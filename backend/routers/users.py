from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
from models import User
from schemas import UserCreate, UserOut
from routers.auth import get_password_hash

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    db_user = User(email=user.email, hashed_password=get_password_hash(user.password), name=user.name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
