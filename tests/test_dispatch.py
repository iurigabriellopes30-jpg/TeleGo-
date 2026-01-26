
import pytest
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool
from backend import models, dispatch
from backend.db import Base

# Use an in-memory async SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = async_sessionmaker(
    autocommit=False, autoflush=False, bind=engine, expire_on_commit=False
)

@pytest.fixture(scope="function")
async def db_session():
    """Fixture to create a new database session for each test."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.mark.asyncio
async def test_dispatch_success_on_first_try(db_session: AsyncSession):
    # Setup
    restaurant = models.Restaurant(id=1, name="Restaurant", lat=0, lng=0)
    courier = models.Courier(id=1, name="Courier 1", email="courier1@example.com", lat=0.01, lng=0.01, available=True)
    order = models.Order(id=1, restaurant_id=restaurant.id, status="SEARCHING")
    db_session.add_all([restaurant, courier, order])
    await db_session.commit()

    async def simulate_courier_acceptance(order_id: int, courier_id: int):
        await asyncio.sleep(0.1)
        if event := dispatch.courier_responses.get(order_id):
            async with TestingSessionLocal() as db:
                order_to_update = await db.get(models.Order, order_id)
                if order_to_update:
                    order_to_update.status = "ASSIGNED"
                    order_to_update.courier_id = courier_id
                    await db.commit()
                    event.set()

    dispatch_task = asyncio.create_task(dispatch.dispatch_order(order.id, session_local=TestingSessionLocal))
    acceptance_task = asyncio.create_task(simulate_courier_acceptance(order.id, courier.id))
    await asyncio.gather(dispatch_task, acceptance_task)

    # Verification
    final_order = await db_session.get(models.Order, order.id)
    await db_session.refresh(final_order)
    assert final_order.status == "ASSIGNED"
    assert final_order.courier_id == courier.id
    assert final_order.attempt_count == 1

@pytest.mark.asyncio
async def test_dispatch_timeout_and_second_courier_accepts(db_session: AsyncSession, monkeypatch):
    # Setup
    restaurant = models.Restaurant(id=1, name="R", lat=0, lng=0)
    courier1 = models.Courier(id=1, name="C1", email="c1@example.com", lat=0.01, lng=0.01, available=True)
    courier2 = models.Courier(id=2, name="C2", email="c2@example.com", lat=0.02, lng=0.02, available=True)
    order = models.Order(id=1, restaurant_id=restaurant.id, status="SEARCHING")
    db_session.add_all([restaurant, courier1, courier2, order])
    await db_session.commit()

    async def simulate_second_courier_acceptance():
        await asyncio.sleep(0.2)
        if event := dispatch.courier_responses.get(order.id):
            async with TestingSessionLocal() as db:
                order_in_db = await db.get(models.Order, order.id)
                if order_in_db and order_in_db.current_candidate_courier_id == courier2.id:
                    order_in_db.status = "ASSIGNED"
                    order_in_db.courier_id = courier2.id
                    await db.commit()
                    event.set()

    original_wait_for = asyncio.wait_for
    async def mocked_wait_for(fut, timeout):
        return await original_wait_for(fut, 0.1)
    monkeypatch.setattr(asyncio, "wait_for", mocked_wait_for)

    dispatch_task = asyncio.create_task(dispatch.dispatch_order(order.id, session_local=TestingSessionLocal))
    acceptance_task = asyncio.create_task(simulate_second_courier_acceptance())
    await asyncio.gather(dispatch_task, acceptance_task)

    # Verification
    final_order = await db_session.get(models.Order, order.id)
    await db_session.refresh(final_order)
    assert final_order.status == "ASSIGNED"
    assert final_order.courier_id == courier2.id
    assert final_order.attempt_count == 2
