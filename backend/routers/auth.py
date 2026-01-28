from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend import models, schemas
from backend.db import get_db
from backend.security import create_access_token, verify_password, get_password_hash, decode_access_token

router = APIRouter(tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    email = payload.get("sub")
    stmt = select(models.User).where(models.User.email == email)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.post("/register", response_model=schemas.Token)
async def register(user_in: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    stmt = select(models.User).where(models.User.email == user_in.email)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user_in.password)
    new_user = models.User(
        email=user_in.email,
        hashed_password=hashed_password,
        name=user_in.name,
        role=user_in.role
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    if new_user.role == "RESTAURANT":
        restaurant = models.Restaurant(name=new_user.name, user_id=new_user.id, lat=-23.5505, lng=-46.6333)
        db.add(restaurant)
    elif new_user.role == "COURIER":
        courier = models.Courier(name=new_user.name, email=new_user.email, user_id=new_user.id, lat=-23.5505, lng=-46.6333)
        db.add(courier)

    await db.commit()

    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    stmt = select(models.User).where(models.User.email == form_data.username)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/me")
async def get_me(current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Retorna o usuário e o ID do restaurante/entregador associado
    res = {"user": current_user}
    if current_user.role == "RESTAURANT":
        stmt = select(models.Restaurant).where(models.Restaurant.user_id == current_user.id)
        result = await db.execute(stmt)
        restaurant = result.scalars().first()
        res["restaurant_id"] = restaurant.id if restaurant else None
    elif current_user.role == "COURIER":
        stmt = select(models.Courier).where(models.Courier.user_id == current_user.id)
        result = await db.execute(stmt)
        courier = result.scalars().first()
        res["courier_id"] = courier.id if courier else None
    return res
