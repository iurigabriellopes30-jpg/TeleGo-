
import pytest
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend import models, dispatch
from backend.db import Base

# Use an in-memory SQLite database for testing, with a static connection pool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session(monkeypatch):
    # Monkeypatch the production SessionLocal with the test one
    monkeypatch.setattr(dispatch, "SessionLocal", TestingSessionLocal)

    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.mark.asyncio
async def test_dispatch_success_on_first_try(db_session):
    # Setup
    restaurant = models.Restaurant(id=1, name="Restaurant", lat=0, lng=0)
    courier = models.Courier(id=1, name="Courier 1", lat=0.01, lng=0.01, available=True)
    order = models.Order(id=1, restaurant_id=restaurant.id, status="SEARCHING")
    db_session.add_all([restaurant, courier, order])
    db_session.commit()

    async def simulate_courier_acceptance():
        await asyncio.sleep(0.1)
        order_id = 1
        if event := dispatch.courier_responses.get(order_id):
            db = TestingSessionLocal()
            order_to_update = db.query(models.Order).filter(models.Order.id == order_id).first()
            order_to_update.status = "ASSIGNED"
            order_to_update.courier_id = courier.id
            db.commit()
            db.close()
            event.set()

    dispatch_task = asyncio.create_task(dispatch.dispatch_order(order.id))
    acceptance_task = asyncio.create_task(simulate_courier_acceptance())
    await asyncio.gather(dispatch_task, acceptance_task)

    # Verification
    db_session.expire_all()
    final_order = db_session.query(models.Order).filter(models.Order.id == order.id).first()
    assert final_order.status == "ASSIGNED"
    assert final_order.courier_id == courier.id
    assert final_order.attempt_count == 1

@pytest.mark.asyncio
async def test_dispatch_timeout_and_second_courier_accepts(db_session):
    # Setup
    restaurant = models.Restaurant(id=1, name="R", lat=0, lng=0)
    courier1 = models.Courier(id=1, name="C1", lat=0.01, lng=0.01, available=True)
    courier2 = models.Courier(id=2, name="C2", lat=0.02, lng=0.02, available=True)
    order = models.Order(id=1, restaurant_id=restaurant.id, status="SEARCHING")
    db_session.add_all([restaurant, courier1, courier2, order])
    db_session.commit()

    async def simulate_second_courier_acceptance():
        await asyncio.sleep(0.2)
        order_id = 1
        if event := dispatch.courier_responses.get(order_id):
            db = TestingSessionLocal()
            order_in_db = db.query(models.Order).filter(models.Order.id == order_id).first()
            if order_in_db.current_candidate_courier_id == courier2.id:
                order_in_db.status = "ASSIGNED"
                order_in_db.courier_id = courier2.id
                db.commit()
                event.set()
            db.close()

    original_wait_for = asyncio.wait_for
    async def mocked_wait_for(fut, timeout):
        return await original_wait_for(fut, 0.1) # Faster timeout for testing

    asyncio.wait_for = mocked_wait_for

    dispatch_task = asyncio.create_task(dispatch.dispatch_order(order.id))
    acceptance_task = asyncio.create_task(simulate_second_courier_acceptance())
    await asyncio.gather(dispatch_task, acceptance_task)

    asyncio.wait_for = original_wait_for

    # Verification
    db_session.expire_all()
    final_order = db_session.query(models.Order).filter(models.Order.id == order.id).first()
    assert final_order.status == "ASSIGNED"
    assert final_order.courier_id == courier2.id
    assert final_order.attempt_count == 2
