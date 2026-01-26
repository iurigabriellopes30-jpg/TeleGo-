from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..db import get_db

router = APIRouter(prefix="/couriers", tags=["couriers"])

@router.post("/", response_model=schemas.Courier)
def create_courier(courier: schemas.CourierCreate, db: Session = Depends(get_db)):
    """
    Creates a new courier.
    """
    db_courier = models.Courier(**courier.dict())
    db.add(db_courier)
    db.commit()
    db.refresh(db_courier)
    return db_courier

@router.get("/", response_model=List[schemas.Courier])
def list_couriers(db: Session = Depends(get_db)):
    """
    Returns a list of all couriers.
    """
    couriers = db.query(models.Courier).all()
    return couriers
