from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from enum import Enum

if TYPE_CHECKING:
    from .user import User

class ApartmentStatus(str, Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"

class Apartment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    apartment_number: str = Field(index=True, unique=True)  # Số căn hộ
    building: str = Field(index=True)  # Tòa nhà
    floor: int  # Tầng
    area: float  # Diện tích (m2)
    bedrooms: int = Field(default=1)  # Số phòng ngủ
    bathrooms: int = Field(default=1)  # Số phòng tắm
    status: ApartmentStatus = Field(default=ApartmentStatus.AVAILABLE)
    
    # monthly_fee: float = Field(default=0.0)  # Phí quản lý hàng tháng (chỉ áp dụng cho renter)
    
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    # Thông tin cư dân (nếu có)
    
    resident_id: Optional[int] = Field(default=None, foreign_key="users.id")
    resident: Optional["User"] = Relationship(back_populates="apartment")
