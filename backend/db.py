import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# Pega a URL, remove espaços em branco e garante que não seja None
raw_db_url = os.getenv("DATABASE_URL", "").strip()

if not raw_db_url:
    # Fallback para SQLite local
    SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./telego.db"
else:
    # Ajuste para PostgreSQL assíncrono (Railway usa postgres://)
    if raw_db_url.startswith("postgresql://"):
        SQLALCHEMY_DATABASE_URL = raw_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif raw_db_url.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = raw_db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    else:
        SQLALCHEMY_DATABASE_URL = raw_db_url

# Log seguro para ajudar no debug do deploy
print(f"DATABASE_INFO: Protocolo detectado: {SQLALCHEMY_DATABASE_URL.split('://')[0]}")

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
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
