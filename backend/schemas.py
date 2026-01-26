from pydantic import BaseModel
from typing import Optional
import datetime

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class RestaurantBase(BaseModel):
    name: str
    lat: float
    lng: float

class RestaurantCreate(RestaurantBase):
    pass

class Restaurant(RestaurantBase):
    id: int
    class Config:
        orm_mode = True

class CourierBase(BaseModel):
    name: str
    lat: float
    lng: float
    available: bool = True

class CourierCreate(CourierBase):
    pass

class Courier(CourierBase):
    id: int
    class Config:
        orm_mode = True

class OrderBase(BaseModel):
    restaurant_id: int

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    id: int
    courier_id: Optional[int] = None
    status: str
    current_candidate_courier_id: Optional[int] = None
    offer_sent_at: Optional[datetime.datetime] = None
    attempt_count: int

    class Config:
        orm_mode = True
