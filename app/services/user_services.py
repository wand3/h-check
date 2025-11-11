import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func
from app.models.user import UserModel
from app.security import hash_password
from passlib.context import CryptContext
from typing import Optional, Annotated, AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from ..schemas.user import UserInDB, UserCreate, UserUpdate, UserBase
from ..schemas.auth import TokenData
from ..config import Config
from jose import jwt, JWTError
from app.database.db_engine import get_session
from ..security import hash_password
from uuid import UUID
from ..logger import logger


async def create_user(db: AsyncSession, user_data: UserCreate) -> UserInDB:
    try:
        hashed_pass = hash_password(user_data.password)
        user = UserModel(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_pass,
            disabled=user_data.disabled or False,
            profile_pic=user_data.profile_pic,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    except Exception as e:
        logger.error(e)

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[UserModel]:
    stmt = select(UserModel).where(UserModel.email == email)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> Optional[UserModel]:
    stmt = select(UserModel).where(UserModel.username == username)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[UserModel]:
    return await db.get(UserModel, user_id)  # .get() is simpler for primary keys


async def update_user_in_db(
    db: AsyncSession,
    user_id: UUID,
    user_update: UserUpdate
) -> Optional[UserModel]:
    """
    Update a UserModel row with fields provided in user_update.
    Returns the updated SQLModel instance or None if not found.
    """
    stmt = select(UserModel).where(UserModel.id == user_id)
    result = await db.execute(stmt)
    user: Optional[UserModel] = result.scalar_one_or_none()

    if user is None:
        return None

    # Build dict of provided fields only
    update_data = user_update.dict(exclude_unset=True)

    # If password is included, hash it before storing
    if "password" in update_data:
        plain = update_data.pop("password")
        update_data["hashed_password"] = hash_password(plain)

    # Apply updates
    for field, value in update_data.items():
        # defensive: skip None on fields you want to keep unchanged unless explicit
        setattr(user, field, value)

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_user_image_in_db(db: AsyncSession, user_id: UUID, image_filename: str) -> Optional[UserModel]:
    """
    Update the user's profile_pic and updated_at, commit and return the refreshed instance.
    """
    stmt = select(UserModel).where(UserModel.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if user is None:
        return None

    user.profile_pic = image_filename
    user.updated_at = datetime.utcnow()

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def delete_user(db: AsyncSession, user_id: uuid.UUID) -> bool:
    user = await db.get(UserModel, user_id)
    if user:
        await db.delete(user)
        await db.commit()
        return True
    return False
