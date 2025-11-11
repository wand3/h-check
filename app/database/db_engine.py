import os
from typing import AsyncGenerator
from ..config import Config
from fastapi import FastAPI
import logging
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
import asyncpg
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel


# connect_args = {"check_same_thread": False}
engine = any
# load db depending on prod env and test env
if os.getenv("TESTING", "false").lower() == "true":
    DATABASE_URL: str = os.getenv("TEST_DATABASE_URL",
                                  "postgresql+asyncpg://postgres:ma3str0@localhost:5432/hchecktest")
    SYNC_DATABASE_URL: str = os.getenv("TEST_SYNC_DATABASE_URL",
                                       "postgresql://postgres:ma3str0@localhost:5432/hchecktest")
    engine = create_async_engine(DATABASE_URL,
                             echo=True)
    # Create a new async "sessionmaker"
    # This is a configurable factory for creating new AsyncSession objects
    AsyncSessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )


else:
    DATABASE_URL: str = os.getenv("DATABASE_URL",
                                  "postgresql+asyncpg://postgres:ma3str0@localhost:5432/hcheck")
    SYNC_DATABASE_URL: str = os.getenv("SYNC_DATABASE_URL",
                                       "postgresql://postgres:ma3str0@localhost:5432/hcheck")

    engine = create_async_engine(DATABASE_URL,
                                 echo=True)

    # Create a new async "sessionmaker"
    # This is a configurable factory for creating new AsyncSession objects
    AsyncSessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

async def create_db_and_tables():
    """
    Initializes the database tables. Should be called once on application startup.
    """
    async with engine.begin() as conn:
        # await conn.run_sync(SQLModel.metadata.drop_all) # Optional: drop tables first
        # await conn.run_sync(SQLModel.metadata.create_all)
        pass

async def get_session() -> AsyncSession:
    """
    FastAPI dependency to get an async database session.
    Ensures the session is always closed, even if errors occur.
    """
    async_session = AsyncSessionLocal()
    try:
        yield async_session
    finally:
        await async_session.close()

# Test database connection
async def test_db_connection():
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"Database connection error: {e}")
        return False
