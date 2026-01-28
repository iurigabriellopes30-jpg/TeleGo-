import os
import os

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

print("DATABASE_URL RAW =>", repr(SQLALCHEMY_DATABASE_URL))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./telego.db")

# Ajuste para PostgreSQL se necessário
if SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False,
    connect_args={"ssl": True} if SQLALCHEMY_DATABASE_URL.startswith("postgresql") else {},
    pool_pre_ping=True,
)

SessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as db:
        yield db


