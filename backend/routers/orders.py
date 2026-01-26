from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from db import get_db
from schemas import Order, OrderCreate, OrderUpdate
from models import Order as OrderModel
from routers.auth import get_current_user
from schemas import UserOut

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("/", response_model=Order)
def create_order(order: OrderCreate, db: Session = Depends(get_db), current_user: UserOut = Depends(get_current_user)):
    db_order = OrderModel(**order.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/", response_model=List[Order])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: UserOut = Depends(get_current_user)):
    orders = db.query(OrderModel).offset(skip).limit(limit).all()
    return orders

@router.get("/{order_id}", response_model=Order)
def read_order(order_id: int, db: Session = Depends(get_db), current_user: UserOut = Depends(get_current_user)):
    db_order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order

@router.put("/{order_id}", response_model=Order)
def update_order(order_id: int, order: OrderUpdate, db: Session = Depends(get_db), current_user: UserOut = Depends(get_current_user)):
    db_order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    update_data = order.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_order, key, value)

    db.commit()
    db.refresh(db_order)
    return db_order

@router.delete("/{order_id}", response_model=Order)
def delete_order(order_id: int, db: Session = Depends(get_db), current_user: UserOut = Depends(get_current_user)):
    db_order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    db.delete(db_order)
    db.commit()
    return db_order
