from fastapi import APIRouter

router = APIRouter(prefix="/restaurants", tags=["restaurants"])

from backend.db import SessionLocal
from backend import models
from backend import schemas
