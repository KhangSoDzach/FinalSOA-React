from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.vehicle import VehicleType, VehicleStatus

# Schema cơ bản
class VehicleBase(BaseModel):
    license_plate: str
    make: str
    model: str
    color: str
    vehicle_type: VehicleType
    license_plate_image: Optional[str] = None

# Schema để tạo mới
class VehicleCreate(VehicleBase):
    pass

# Schema để cập nhật
class VehicleUpdate(BaseModel):
    license_plate: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    vehicle_type: Optional[VehicleType] = None
    parking_spot: Optional[str] = None

# Schema để admin approve/reject
class VehicleApproval(BaseModel):
    status: VehicleStatus
    parking_spot: Optional[str] = None
    rejection_reason: Optional[str] = None

# Schema response
class VehicleResponse(VehicleBase):
    id: int
    user_id: int
    status: VehicleStatus
    parking_spot: Optional[str] = None
    license_plate_image: Optional[str] = None
    registered_at: datetime
    expires_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    approved_by: Optional[int] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Schema response với thông tin user
class VehicleWithUserResponse(VehicleResponse):
    user_full_name: Optional[str] = None
    user_email: Optional[str] = None
    user_apartment: Optional[str] = None
    user_building: Optional[str] = None
    approver_name: Optional[str] = None

# Schema thống kê
class VehicleStats(BaseModel):
    total: int
    pending: int
    active: int
    expired: int
    rejected: int
    by_type: dict
