from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.db import Base, engine
from backend.routers import auth, couriers, orders, restaurants

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="TeleGo Backend", version="1.0.0", lifespan=lifespan)

# CORS configurado corretamente para permitir qualquer origem em desenvolvimento
# Se allow_credentials for True, allow_origins não pode ser ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite tudo
    allow_methods=["*"],   # Todos métodos
    allow_headers=["*"],   # Todos headers
)

# Rotas principais
app.include_router(auth.router)
app.include_router(couriers.router)
app.include_router(orders.router)
app.include_router(restaurants.router)

@app.get("/")
async def root():
    return {"status": "ok", "service": "TeleGo Backend", "message": "TeleGo API online"}
