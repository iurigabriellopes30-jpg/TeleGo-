from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend import models, schemas
from backend.db import get_db
from backend.security import get_password_hash

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register", response_model=schemas.User)
async def register(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    stmt = select(models.User).where(models.User.email == user.email)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, name=user.name)

    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    return db_user
