from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.apartment import ApartmentStatus

class ApartmentBase(BaseModel):
    apartment_number: str
    building: str
    floor: int
    area: float
    bedrooms: int = 1
    bathrooms: int = 1
    description: Optional[str] = None

class ApartmentCreate(ApartmentBase):
    pass

class ApartmentUpdate(BaseModel):
    apartment_number: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[int] = None
    area: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    status: Optional[ApartmentStatus] = None
    description: Optional[str] = None

class ApartmentResponse(ApartmentBase):
    id: int
    status: ApartmentStatus
    resident_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ApartmentWithResident(ApartmentResponse):
    resident: Optional[dict] = None

class ApartmentRegisterUser(BaseModel):
    """Schema để đăng ký người dùng cho căn hộ"""
    apartment_id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    password: Optional[str] = None  # Nếu không cung cấp, sẽ tự động sinh
