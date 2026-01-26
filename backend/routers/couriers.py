from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from db import get_db
from schemas import Courier, CourierCreate, CourierUpdate
from models import Courier as CourierModel
from routers.auth import get_current_user
from schemas import UserOut

router = APIRouter(prefix="/couriers", tags=["couriers"])

@router.post("/", response_model=Courier)
def create_courier(courier: CourierCreate, db: Session = Depends(get_db), current_user: UserOut = Depends(get_current_user)):
    db_courier = CourierModel(**courier.model_dump())
    db.add(db_courier)
    db.commit()
    db.refresh(db_courier)
    return db_courier

@router.get("/", response_model=List[Courier])
def read_couriers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    couriers = db.query(CourierModel).offset(skip).limit(limit).all()
    return couriers

@router.get("/{courier_id}", response_model=Courier)
def read_courier(courier_id: int, db: Session = Depends(get_db)):
    db_courier = db.query(CourierModel).filter(CourierModel.id == courier_id).first()
    if db_courier is None:
        raise HTTPException(status_code=404, detail="Courier not found")
    return db_courier

@router.put("/{courier_id}", response_model=Courier)
def update_courier(courier_id: int, courier: CourierUpdate, db: Session = Depends(get_db), current_user: UserOut = Depends(get_current_user)):
    db_courier = db.query(CourierModel).filter(CourierModel.id == courier_id).first()
    if db_courier is None:
        raise HTTPException(status_code=404, detail="Courier not found")

    update_data = courier.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_courier, key, value)

    db.commit()
    db.refresh(db_courier)
    return db_courier

@router.delete("/{courier_id}", response_model=Courier)
def delete_courier(courier_id: int, db: Session = Depends(get_db), current_user: UserOut = Depends(get_current_user)):
    db_courier = db.query(CourierModel).filter(CourierModel.id == courier_id).first()
    if db_courier is None:
        raise HTTPException(status_code=404, detail="Courier not found")

    db.delete(db_courier)
    db.commit()
    return db_courier
