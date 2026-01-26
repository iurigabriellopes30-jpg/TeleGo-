from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from db import get_db
from schemas import Restaurant, RestaurantCreate, RestaurantUpdate
from models import Restaurant as RestaurantModel
from routers.auth import get_current_user
from schemas import UserOut

router = APIRouter(prefix="/restaurants", tags=["restaurants"])

@router.post("/", response_model=Restaurant)
def create_restaurant(restaurant: RestaurantCreate, db: Session = Depends(get_db), current_user: UserOut = Depends(get_current_user)):
    db_restaurant = RestaurantModel(**restaurant.model_dump())
    db.add(db_restaurant)
    db.commit()
    db.refresh(db_restaurant)
    return db_restaurant

@router.get("/", response_model=List[Restaurant])
def read_restaurants(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    restaurants = db.query(RestaurantModel).offset(skip).limit(limit).all()
    return restaurants

@router.get("/{restaurant_id}", response_model=Restaurant)
def read_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    db_restaurant = db.query(RestaurantModel).filter(RestaurantModel.id == restaurant_id).first()
    if db_restaurant is None:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return db_restaurant

@router.put("/{restaurant_id}", response_model=Restaurant)
def update_restaurant(restaurant_id: int, restaurant: RestaurantUpdate, db: Session = Depends(get_db), current_user: UserOut = Depends(get_current_user)):
    db_restaurant = db.query(RestaurantModel).filter(RestaurantModel.id == restaurant_id).first()
    if db_restaurant is None:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    update_data = restaurant.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_restaurant, key, value)

    db.commit()
    db.refresh(db_restaurant)
    return db_restaurant

@router.delete("/{restaurant_id}", response_model=Restaurant)
def delete_restaurant(restaurant_id: int, db: Session = Depends(get_db), current_user: UserOut = Depends(get_current_user)):
    db_restaurant = db.query(RestaurantModel).filter(RestaurantModel.id == restaurant_id).first()
    if db_restaurant is None:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    db.delete(db_restaurant)
    db.commit()
    return db_restaurant
