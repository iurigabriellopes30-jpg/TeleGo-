import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from models import models, schemas, dispatch
from db import get_db
from security import decode_access_token

router = APIRouter(prefix="/orders", tags=["orders"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

async def get_current_user_email(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload.get("sub")

async def get_current_courier(email: str = Depends(get_current_user_email), db: AsyncSession = Depends(get_db)):
    stmt = select(models.Courier).where(models.Courier.email == email)
    result = await db.execute(stmt)
    courier = result.scalars().first()
    if courier is None:
        raise HTTPException(status_code=404, detail="Courier not found")
    return courier

@router.post("/", response_model=schemas.Order)
async def create_order(order: schemas.OrderCreate, db: AsyncSession = Depends(get_db)):
    new_order = models.Order(restaurant_id=order.restaurant_id, status="SEARCHING")
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)

    asyncio.create_task(dispatch.dispatch_order(new_order.id))

    return new_order

@router.get("/available", response_model=List[schemas.Order])
async def get_available_orders(db: AsyncSession = Depends(get_db), current_courier: models.Courier = Depends(get_current_courier)):
    stmt = select(models.Order).where(
        models.Order.status == "SEARCHING",
        models.Order.current_candidate_courier_id == current_courier.id
    )
    result = await db.execute(stmt)
    orders = result.scalars().all()
    return orders

@router.get("/restaurant/{restaurant_id}", response_model=List[schemas.Order])
async def get_restaurant_orders(restaurant_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(models.Order).where(models.Order.restaurant_id == restaurant_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/courier/{courier_id}", response_model=List[schemas.Order])
async def get_courier_orders(courier_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(models.Order).where(models.Order.courier_id == courier_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/{order_id}/respond", response_model=schemas.Order)
async def respond_to_order(
    order_id: int,
    response: bool,
    db: AsyncSession = Depends(get_db),
    current_courier: models.Courier = Depends(get_current_courier)
):
    stmt = select(models.Order).where(models.Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalars().first()

    if not order or order.current_candidate_courier_id != current_courier.id:
        raise HTTPException(status_code=403, detail="Invalid order or not your turn")

    if response:
        order.courier_id = current_courier.id
        order.status = "ASSIGNED"
    else:
        order.current_candidate_courier_id = None

    await db.commit()

    if response_event := dispatch.courier_responses.get(order.id):
        response_event.set()

    await db.refresh(order)
    return order

@router.put("/{order_id}/status", response_model=schemas.Order)
async def update_order_status(order_id: int, status: str, db: AsyncSession = Depends(get_db)):
    stmt = select(models.Order).where(models.Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    await db.commit()
    await db.refresh(order)
    return order
