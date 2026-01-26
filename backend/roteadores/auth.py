from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..db import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=schemas.Token)
def login(db: Session = Depends(get_db)):
    # Placeholder for login logic
    return {"access_token": "fake-token", "token_type": "bearer"}
