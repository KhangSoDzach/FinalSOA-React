from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from enum import Enum

if TYPE_CHECKING:
    from .user import User

class VehicleType(str, Enum):
    CAR = "car"
    MOTORCYCLE = "motorcycle"
    BICYCLE = "bicycle"

class VehicleStatus(str, Enum):
    PENDING = "pending"  # Chờ xác nhận
    ACTIVE = "active"    # Đã xác nhận
    EXPIRED = "expired"  # Hết hạn
    REJECTED = "rejected" # Bị từ chối

class Vehicle(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    license_plate: str = Field(index=True, unique=True)
    make: str  # Hãng xe
    model: str  # Dòng xe
    color: str
    vehicle_type: VehicleType
    status: VehicleStatus = Field(default=VehicleStatus.PENDING)
    parking_spot: Optional[str] = None
    license_plate_image: Optional[str] = None  # URL ảnh biển số xe
    registered_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    approved_by: Optional[int] = Field(default=None, foreign_key="user.id")
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    # Relationships
    user: Optional["User"] = Relationship(
        back_populates="vehicles",
        sa_relationship_kwargs={"foreign_keys": "[Vehicle.user_id]"}
    )
    approver: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Vehicle.approved_by]"}
    )
