from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class RestaurantBase(BaseModel):
    name: str
    lat: float
    lng: float

class RestaurantCreate(RestaurantBase):
    pass

class Restaurant(RestaurantBase):
    id: int
    user_id: Optional[int]
    class Config:
        from_attributes = True

class CourierBase(BaseModel):
    name: str
    lat: float
    lng: float
    available: bool = True

class CourierCreate(CourierBase):
    email: EmailStr
    pass

class Courier(CourierBase):
    id: int
    user_id: Optional[int]
    class Config:
        from_attributes = True

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
        from_attributes = True
