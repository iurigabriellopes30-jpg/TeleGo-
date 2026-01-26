
import asyncio
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from geopy.distance import geodesic
from . import models
from .db import SessionLocal

# This is a simplified in-memory store for pending offers and events.
# In a real-world application, you'd use a more robust solution like Redis.
courier_responses = {}

async def get_available_couriers(db: AsyncSession):
    """Fetches all available couriers from the database."""
    stmt = select(models.Courier).where(models.Courier.available == 1)
    result = await db.execute(stmt)
    return result.scalars().all()

def filter_couriers_by_distance(couriers, lat, lng, radius_km):
    """Filters a list of couriers by their distance to a point."""
    nearby_couriers = []
    for courier in couriers:
        distance = geodesic((lat, lng), (courier.lat, courier.lng)).kilometers
        if distance <= radius_km:
            nearby_couriers.append((courier, distance))

    nearby_couriers.sort(key=lambda x: x[1])
    return [courier for courier, distance in nearby_couriers]

async def dispatch_order(order_id: int, session_local=None):
    """
    Manages the sequential dispatch of an order to nearby couriers.
    Accepts an optional session_local for testing purposes.
    """
    use_session = session_local or SessionLocal
    async with use_session() as db:
        stmt = select(models.Order).where(models.Order.id == order_id).options(selectinload(models.Order.restaurant))
        result = await db.execute(stmt)
        order = result.scalars().first()

        if not order or order.status != "SEARCHING":
            return

        restaurant = order.restaurant

        # Fetch all couriers once
        all_couriers = await get_available_couriers(db)

        radii = [1, 2, 3, 5, 10]
        tried_couriers = set()

        for radius in radii:
            # Filter couriers in memory to avoid sync I/O in the DB transaction
            nearby_couriers = filter_couriers_by_distance(all_couriers, restaurant.lat, restaurant.lng, radius)

            for courier in nearby_couriers:
                if courier.id in tried_couriers:
                    continue

                tried_couriers.add(courier.id)

                order.current_candidate_courier_id = courier.id
                order.offer_sent_at = datetime.datetime.now(datetime.UTC)
                order.attempt_count += 1
                await db.commit()

                try:
                    response_event = asyncio.Event()
                    courier_responses[order.id] = response_event
                    await asyncio.wait_for(response_event.wait(), timeout=20.0)
                except asyncio.TimeoutError:
                    order.current_candidate_courier_id = None
                    await db.commit()
                    continue
                finally:
                    courier_responses.pop(order.id, None)

                await db.refresh(order)
                if order.status == "ASSIGNED":
                    return

        order.status = "NO_COURIER_FOUND"
        await db.commit()
