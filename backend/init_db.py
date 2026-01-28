import asyncio
from db import Base, engine
from backend import models

async def init_db():
    print("Criando tabelas do banco de dados...")
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # Opcional: limpa o banco antes de criar
        await conn.run_sync(Base.metadata.create_all)
    print("Tabelas criadas com sucesso!")

if __name__ == "__main__":
    asyncio.run(init_db())
