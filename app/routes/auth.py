from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import timedelta
from typing import Annotated, Union
from fastapi.security import OAuth2PasswordRequestForm
from starlette.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.auth import Token
from app.schemas.user import UserBase, UserCreate, UserInDB
from app.models.user import UserModel
from app.database.db_engine import get_session
from app.services.user_services import get_user_by_username, get_user_by_id, get_user_by_email, create_user
from app.security import authenticate_user, create_access_token
from app.logger import logger
from ..config import Config
from sqlalchemy import select
from ..dependencies import get_current_active_user

auth = APIRouter(tags=["Auth"])


async def get_user_model(
    db: Annotated[AsyncSession, Depends(get_session)],
) -> UserModel:
    """
    Dependency that provides access to the UserModel bound to a database session.
    You can call this to perform queries inside routes or other dependencies.
    """
    # You can attach the db session dynamically if needed
    UserModel.session = db
    return UserModel


@auth.post("/token", response_model=Token)
async def login_for_access_token(
        form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
        db: Annotated[AsyncSession, Depends(get_session)],
) -> Token:
    """Authenticate user and issue a JWT access token."""
    # Call the instance method using the injected user_model
    user = await authenticate_user(db, username=form_data.username, password=form_data.password)
    logger.info(user)
    # user = UserInDB(user)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(user=user, access_token=access_token)  # , token_type="bearer"


# Register route
@auth.post("/auth/register", response_model=UserBase, status_code=status.HTTP_201_CREATED)
async def register_user(
        user_data: UserCreate,
        db: Annotated[AsyncSession, Depends(get_session)],
        user_model: Annotated[UserModel, Depends(get_user_model)],
) -> UserBase:
    if not user_data.email or not user_data.username:
        raise HTTPException(status_code=400, detail="Missing required fields")

    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered.")

    new_user = await create_user(db, user_data)

    # new_user is a SQLModel instance; FastAPI + SQLModel's Pydantic works directly
    return new_user


# Login route
@auth.post("/auth/login", response_model=Token)
async def login_for_access_token(
        form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
        db: Annotated[AsyncSession, Depends(get_session)],
        user_model: Annotated[UserModel, Depends(get_user_model)],
) -> Token:
    user = await authenticate_user(db, username=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


# check if username already exists in database
@auth.get("/auth/check-username", status_code=status.HTTP_200_OK)
async def check_username(
    username: str = Query(..., description="Username to check"),
    db: AsyncSession = Depends(get_session),
):
    """
    Checks if a username already exists in the PostgreSQL database.
    """
    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is required"
        )

    stmt = select(UserModel).where(UserModel.username == username)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()

    return {"exists": existing_user is not None}


@auth.get("/auth/check-email", status_code=status.HTTP_200_OK)
async def check_email(
    email: str = Query(..., description="Email to check"),
    db: AsyncSession = Depends(get_session),
):
    """
    Checks if an email already exists in the PostgreSQL database.
    """
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )

    stmt = select(UserModel).where(UserModel.email == email)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()

    return {"exists": existing_user is not None}

@auth.post("/auth/logout", status_code=status.HTTP_200_OK)
async def logout_user(
    current_user: UserBase = Depends(get_current_active_user),
):
    """
    Logout user.
    """
    if not current_user:
      return {"success": current_user is not None}