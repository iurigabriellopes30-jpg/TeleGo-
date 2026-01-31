from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.db import Base, engine
from backend.routers import auth, couriers, orders, restaurants, websocket

from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        # Cria tabelas se não existirem
        await conn.run_sync(Base.metadata.create_all)
        
        # Migração manual para adicionar novas colunas se elas não existirem (para bancos como PostgreSQL no Railway)
        try:
            # Lista de colunas para adicionar à tabela 'orders'
            columns_to_add = [
                ("customer_name", "VARCHAR"),
                ("delivery_address", "VARCHAR"),
                ("pickup_address", "VARCHAR"),
                ("price", "FLOAT"),
                ("order_value", "FLOAT"),
                ("created_at", "TIMESTAMP")
            ]
            
            for col_name, col_type in columns_to_add:
                try:
                    # Tenta adicionar a coluna, ignora se já existir
                    await conn.execute(text(f"ALTER TABLE orders ADD COLUMN {col_name} {col_type}"))
                    print(f"✅ Coluna {col_name} adicionada com sucesso.")
                except Exception as e:
                    # Provavelmente a coluna já existe
                    pass
            
            await conn.commit()
        except Exception as e:
            print(f"⚠️ Erro na migração automática: {e}")
            
    yield

app = FastAPI(title="TeleGo Backend", version="1.0.0", lifespan=lifespan)

# 🔥🔥🔥 CORS SIMPLIFICADO E FUNCIONAL 🔥🔥🔥
# 🔥🔥🔥 CORS TOTALMENTE ABERTO PARA RESOLVER O PROBLEMA 🔥🔥🔥
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "https://tele-go.vercel.app"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
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