from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, users, orders, restaurants, couriers

app = FastAPI(title="TeleGo Backend", version="1.0.0")

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
app.include_router(users.router)
app.include_router(orders.router)
app.include_router(restaurants.router)
app.include_router(couriers.router)

@app.get("/")
def root():
    return {"message": "TeleGo API online"}
