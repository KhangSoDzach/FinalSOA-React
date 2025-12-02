from pydantic import BaseModel
from typing import Optional
from datetime import datetime, time
from decimal import Decimal
from app.models.service import ServiceCategory, ServiceStatus, BookingStatus, ServiceUnit

class ServiceBase(BaseModel):
    name: str
    description: str
    category: ServiceCategory
    price: Decimal  # Tạm giữ để tương thích với frontend cũ, sẽ xóa sau
    unit: ServiceUnit  # Đổi từ str sang ServiceUnit
    available_days: str
    available_time_start: Optional[time] = None
    available_time_end: Optional[time] = None
    advance_booking_hours: int = 24
    max_booking_days: int = 30
    provider_name: Optional[str] = None
    provider_contact: Optional[str] = None

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ServiceCategory] = None
    price: Optional[Decimal] = None
    unit: Optional[ServiceUnit] = None  # Đổi từ str sang ServiceUnit
    status: Optional[ServiceStatus] = None
    available_days: Optional[str] = None
    available_time_start: Optional[time] = None
    available_time_end: Optional[time] = None
    advance_booking_hours: Optional[int] = None
    max_booking_days: Optional[int] = None
    provider_name: Optional[str] = None
    provider_contact: Optional[str] = None

class ServiceResponse(ServiceBase):
    id: int
    status: ServiceStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ServiceBookingBase(BaseModel):
    scheduled_date: datetime
    scheduled_time_start: time
    scheduled_time_end: Optional[time] = None
    duration_hours: Optional[int] = None
    location: Optional[str] = None
    special_instructions: Optional[str] = None
    quantity: int = 1

class ServiceBookingCreate(ServiceBookingBase):
    service_id: int

class ServiceBookingUpdate(BaseModel):
    scheduled_date: Optional[datetime] = None
    scheduled_time_start: Optional[time] = None
    scheduled_time_end: Optional[time] = None
    duration_hours: Optional[int] = None
    location: Optional[str] = None
    special_instructions: Optional[str] = None
    quantity: Optional[int] = None
    status: Optional[BookingStatus] = None

class ServiceBookingResponse(ServiceBookingBase):
    id: int
    booking_number: str
    service_id: int
    user_id: int
    unit_price: Decimal
    total_amount: Decimal
    status: BookingStatus
    confirmed_by: Optional[int] = None
    confirmed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completion_notes: Optional[str] = None
    # Đã xóa rating và feedback
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BookingConfirm(BaseModel):
    notes: Optional[str] = None