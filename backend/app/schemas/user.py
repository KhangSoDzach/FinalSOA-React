from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole, OccupierType

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    apartment_number: Optional[str] = None
    building: Optional[str] = None
    occupier: Optional[OccupierType] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str
class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.USER
    occupier: OccupierType = OccupierType.OWNER

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    apartment_number: Optional[str] = None
    building: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
    occupier: Optional[OccupierType] = None

class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    occupier: OccupierType
    balance: float = 0.0

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class BalanceUpdate(BaseModel):
    amount: float

class BalanceResponse(BaseModel):
    user_id: int
    balance: float
    message: str