from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# Restaurant Schemas
class RestaurantBase(BaseModel):
    name: str
    address: str
    phone: Optional[str] = None

class RestaurantCreate(RestaurantBase):
    pass

class RestaurantUpdate(RestaurantBase):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None

class Restaurant(RestaurantBase):
    id: int
    class Config:
        from_attributes = True

# Courier Schemas
class CourierBase(BaseModel):
    name: str
    phone: Optional[str] = None
    vehicle: Optional[str] = None

class CourierCreate(CourierBase):
    pass

class CourierUpdate(CourierBase):
    name: Optional[str] = None
    phone: Optional[str] = None
    vehicle: Optional[str] = None

class Courier(CourierBase):
    id: int
    class Config:
        from_attributes = True

# Order Schemas
class OrderBase(BaseModel):
    total_price: float
    status: str = "pendente"
    user_id: int
    restaurant_id: int
    courier_id: int

>>>>>>> main

class OrderCreate(OrderBase):
    pass

<<<<<<< HEAD
class Order(OrderBase):
    id: int
    courier_id: Optional[int] = None
    status: str
    current_candidate_courier_id: Optional[int] = None
    offer_sent_at: Optional[datetime.datetime] = None
    attempt_count: int

    class Config:
        orm_mode = True
=======

class OrderUpdate(OrderBase):
    total_price: Optional[float] = None
    status: Optional[str] = None
    user_id: Optional[int] = None
    restaurant_id: Optional[int] = None
    courier_id: Optional[int] = None


class Order(OrderBase):
    id: int

    class Config:
        from_attributes = True
>>>>>>> main
