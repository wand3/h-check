import uuid
from ..logger import logger
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from typing import Optional, Annotated, AsyncGenerator, List, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from ..schemas.user import UserInDB, UserCreate, UserUpdate, UserBase
from ..schemas.auth import TokenData
from ..config import Config
# from jose import jwt, JWTError
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field, Session, SQLModel, create_engine, select, Relationship, Column, Text, JSON


class UserModel(SQLModel, table=True):
    __tablename__ = "users"

    # Use type hints and Field for column definitions
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    username: Optional[str] = Field(default=None)
    disabled: bool = Field(default=False)
    profile_pic: str = Field(default=None, nullable=True)

    # Use default_factory for values generated at creation time
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Use sa_column_kwargs for pure SQLAlchemy arguments like 'onupdate'
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": datetime.utcnow}
    )

    # Use SQLModel's Relationship
    query_logs: List["QueryLog"] = Relationship(back_populates="user")

# active_u = UserModel(db=dep_inj)


class QueryLog(SQLModel, table=True):
    __tablename__ = "query_logs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id")
    natural_language_query: str = Field(sa_column=Column(Text))
    fhir_query: str = Field(sa_column=Column(Text))
    fhir_response: Optional[Any] = Field(default=None, sa_column=Column(JSON))
    processed_results: Optional[Any] = Field(default=None, sa_column=Column(JSON))
    execution_time: Optional[int] = None
    patient_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to User
    user: UserModel = Relationship(back_populates="query_logs")