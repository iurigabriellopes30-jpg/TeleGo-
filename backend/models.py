from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.db import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)

class Restaurant(Base):
    __tablename__ = "restaurants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

class Courier(Base):
    __tablename__ = "couriers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    available = Column(Integer, default=1)

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    courier_id = Column(Integer, ForeignKey("couriers.id"), nullable=True)

    status = Column(String, default="SEARCHING", index=True)
    current_candidate_courier_id = Column(Integer, ForeignKey("couriers.id"), nullable=True)
    offer_sent_at = Column(DateTime, nullable=True)
    attempt_count = Column(Integer, default=0)

    restaurant = relationship("Restaurant")
    courier = relationship("Courier", foreign_keys=[courier_id])
    current_candidate_courier = relationship("Courier", foreign_keys=[current_candidate_courier_id])
