from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from .. import models, schemas
from ..db import get_db

router = APIRouter(prefix="/couriers", tags=["couriers"])

@router.post("/", response_model=schemas.Courier)
async def create_courier(courier: schemas.CourierCreate, db: AsyncSession = Depends(get_db)):
    """
    Creates a new courier.
    """
    db_courier = models.Courier(**courier.model_dump())
    db.add(db_courier)
    await db.commit()
    await db.refresh(db_courier)
    return db_courier

@router.get("/", response_model=List[schemas.Courier])
async def list_couriers(db: AsyncSession = Depends(get_db)):
    """
    Returns a list of all couriers.
    """
    result = await db.execute(select(models.Courier))
    couriers = result.scalars().all()
    return couriers
