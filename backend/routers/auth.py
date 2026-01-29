

import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import get_db
from backend.db import SessionLocal
from backend import models
from backend import schemas


router = APIRouter(tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

logger = logging.getLogger("telego.auth")

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
    try:
        # Validação explícita do email
        try:
            EmailStr.validate(user_in.email)
        except ValidationError:
            logger.warning(f"Tentativa de registro com email inválido: {user_in.email}")
            raise HTTPException(status_code=400, detail="Email inválido")

        stmt = select(models.User).where(models.User.email == user_in.email)
        result = await db.execute(stmt)
        if result.scalars().first():
            logger.info(f"Tentativa de registro com email já cadastrado: {user_in.email}")
            raise HTTPException(status_code=409, detail="Email já cadastrado")

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
        logger.info(f"Usuário registrado com sucesso: {user_in.email} (role={user_in.role})")
        return {"access_token": access_token, "token_type": "bearer", "user": new_user}

    except HTTPException as e:
        await db.rollback()
        raise e
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro inesperado no registro de usuário: {str(e)} | email={getattr(user_in, 'email', None)}")
        raise HTTPException(status_code=500, detail="Erro interno ao registrar usuário")

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
