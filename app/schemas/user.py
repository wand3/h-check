from datetime import datetime
from pydantic import BaseModel, EmailStr, constr, Field, field_validator # type: ignore
from typing import Optional


class UserBase(BaseModel):
    email: EmailStr
    username: str
    disabled: Optional[bool] = None
    profile_pic: Optional[str] = None

    class Config:
        from_attributes = True  # <-- allows .from_orm() and response_model conversion


class UserInDB(UserBase):
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # <-- allows .from_orm() and response_model conversion


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[constr(min_length=3, max_length=50)] = None
    password: Optional[constr(min_length=6)] = None
