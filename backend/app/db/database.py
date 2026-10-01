import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config import settings
from app.db.models import Base, User, SettingRecord

engine = create_async_engine(
    settings.db_url,
    echo=settings.debug,
    connect_args={"check_same_thread": False} if "sqlite" in settings.db_url else {}
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Ensure default user exists
    async with async_session_factory() as session:
        result = await session.get(User, 1)
        if not result:
            user = User(id=1, name="FocusLens User")
            session.add(user)
            await session.commit()
