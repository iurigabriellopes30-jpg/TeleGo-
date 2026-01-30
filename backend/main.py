from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.responses import JSONResponse
from backend.db import Base, engine
from backend.routers import auth, couriers, orders, restaurants

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="TeleGo Backend", version="1.0.0", lifespan=lifespan)

# SOLUÇÃO 1: CORS padrão do FastAPI (tente esta primeira)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tele-go.vercel.app", "http://localhost:3000"],  # Frontend específico
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# SOLUÇÃO 2: Middleware manual adicional (garantia extra)
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "https://tele-go.vercel.app"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    return response

# SOLUÇÃO 3: Handler especial para requisições OPTIONS (preflight)
@app.options("/{rest_of_path:path}")
async def preflight_handler():
    return JSONResponse(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "https://tele-go.vercel.app",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",  # Cache por 24 horas
        }
    )

# Rotas principais
app.include_router(auth.router)
app.include_router(couriers.router)
app.include_router(orders.router)
app.include_router(restaurants.router)

@app.get("/")
async def root():
    return {"status": "ok", "service": "TeleGo Backend", "message": "TeleGo API online"}

# Rota de teste CORS
@app.get("/test-cors")
async def test_cors():
    return {"message": "CORS test successful", "cors": "enabled"}