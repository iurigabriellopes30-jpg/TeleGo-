from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.db import Base, engine
from backend.routers import auth, couriers, orders, restaurants, websocket

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="TeleGo Backend", version="1.0.0", lifespan=lifespan)

# 🔥🔥🔥 CORS SIMPLIFICADO E FUNCIONAL 🔥🔥🔥
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite TODAS as origens temporariamente
    allow_credentials=True,
    allow_methods=["*"],  # Todos métodos: GET, POST, PUT, DELETE, PATCH, OPTIONS
    allow_headers=["*"],  # Todos headers
    expose_headers=["*"],  # Expõe todos headers na resposta
)

# Rotas principais
app.include_router(auth.router)
app.include_router(couriers.router)
app.include_router(orders.router)
app.include_router(restaurants.router)
app.include_router(websocket.router)

@app.get("/")
async def root():
    return {"status": "ok", "service": "TeleGo Backend", "message": "TeleGo API online"}

# Rota de teste CORS
@app.get("/test-cors")
async def test_cors():
    return {"message": "CORS test successful", "cors": "enabled"}