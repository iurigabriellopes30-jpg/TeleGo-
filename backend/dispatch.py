
import asyncio
import datetime
from sqlalchemy.orm import Session
from geopy.distance import geodesic
from . import models, schemas
from .db import SessionLocal

# This is a simplified in-memory store for pending offers and events.
# In a real-world application, you'd use a more robust solution like Redis.
pending_offers = {}
courier_responses = {}

def find_nearby_couriers(db: Session, lat: float, lng: float, radius_km: int):
    """
    Finds available couriers within a given radius, ordered by distance.
    """
    couriers = db.query(models.Courier).filter(models.Courier.available == 1).all()
    nearby_couriers = []
    for courier in couriers:
        distance = geodesic((lat, lng), (courier.lat, courier.lng)).kilometers
        if distance <= radius_km:
            nearby_couriers.append((courier, distance))

    nearby_couriers.sort(key=lambda x: x[1])
    return [courier for courier, distance in nearby_couriers]

async def dispatch_order(order_id: int):
    """
    Manages the sequential dispatch of an order to nearby couriers.
    This function now creates its own database session.
    """
    db = SessionLocal()
    try:
        order = db.query(models.Order).filter(models.Order.id == order_id).first()
        if not order or order.status != "SEARCHING":
            return

        restaurant = order.restaurant
        radii = [1, 2, 3, 5, 10]

        tried_couriers = set()

        for radius in radii:
            nearby_couriers = find_nearby_couriers(db, restaurant.lat, restaurant.lng, radius)

            for courier in nearby_couriers:
                if courier.id in tried_couriers:
                    continue

                tried_couriers.add(courier.id)

                order.current_candidate_courier_id = courier.id
                order.offer_sent_at = datetime.datetime.now(datetime.UTC)
                order.attempt_count += 1
                db.commit()

                try:
                    # Wait for an event (response) for up to 20 seconds
                    response_event = asyncio.Event()
                    courier_responses[order.id] = response_event
                    await asyncio.wait_for(response_event.wait(), timeout=20.0)
                except asyncio.TimeoutError:
                    # No response, continue to the next courier
                    order.current_candidate_courier_id = None
                    db.commit()
                    continue
                finally:
                    courier_responses.pop(order.id, None)

                # Re-fetch order to check if it was accepted
                db.refresh(order)
                if order.status == "ASSIGNED":
                    return

        # If loop finishes, no courier was found
        order.status = "NO_COURIER_FOUND"
        db.commit()
    finally:
        db.close()
