import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, dispatch
from ..db import get_db

router = APIRouter(prefix="/orders", tags=["orders"])

def get_current_courier():
    # Placeholder for a real authentication system
    return models.Courier(id=1, name="Mock Courier", lat=0.0, lng=0.0)

@router.post("/", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    new_order = models.Order(restaurant_id=order.restaurant_id, status="SEARCHING")
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    asyncio.create_task(dispatch.dispatch_order(new_order.id))

    return new_order

@router.get("/available", response_model=List[schemas.Order])
def get_available_orders(db: Session = Depends(get_db), current_courier: models.Courier = Depends(get_current_courier)):
    orders = db.query(models.Order).filter(
        models.Order.status == "SEARCHING",
        models.Order.current_candidate_courier_id == current_courier.id
    ).all()
    return orders

@router.post("/{order_id}/respond", response_model=schemas.Order)
def respond_to_order(
    order_id: int,
    response: bool,
    db: Session = Depends(get_db),
    current_courier: models.Courier = Depends(get_current_courier)
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()

    if not order or order.current_candidate_courier_id != current_courier.id:
        raise HTTPException(status_code=403, detail="Invalid order or not your turn")

    if response:
        order.courier_id = current_courier.id
        order.status = "ASSIGNED"
    else:
        order.current_candidate_courier_id = None

    db.commit()

    # Signal the dispatch loop that a response has been received
    if response_event := dispatch.courier_responses.get(order.id):
        response_event.set()

    db.refresh(order)
    return order
