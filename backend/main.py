
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.db import Base, engine
from backend.routers import auth, couriers, orders, restaurants

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TeleGo Backend", version="1.0.0")
@app.get("/")
def root():
    return {"status": "ok", "service": "TeleGo Backend"}
    
# CORS para permitir acesso do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas principais
app.include_router(auth.router)
app.include_router(couriers.router)
app.include_router(orders.router)
app.include_router(restaurants.router)

@app.get("/")
def root():
    return {"message": "TeleGo API online"}
