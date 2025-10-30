from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, time
from enum import Enum
from decimal import Decimal

if TYPE_CHECKING:
    from .user import User

class ServiceStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"

class ServiceCategory(str, Enum):
    CLEANING = "cleaning"
    MAINTENANCE = "maintenance"
    REPAIR = "repair"
    ROOM_BOOKING = "room_booking"
    VEHICLE_SERVICE = "vehicle_service"
    DELIVERY = "delivery"
    OTHER = "other"

class Service(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: str
    category: ServiceCategory
    price: Decimal = Field(decimal_places=2)
    unit: str  # "per hour", "per service", "per room", etc.
    status: ServiceStatus = Field(default=ServiceStatus.ACTIVE)
    
    # Availability
    available_days: str  # JSON string for days of week
    available_time_start: Optional[time] = None
    available_time_end: Optional[time] = None
    advance_booking_hours: int = Field(default=24)  # Minimum hours to book in advance
    max_booking_days: int = Field(default=30)  # Maximum days ahead for booking
    
    # Provider information
    provider_name: Optional[str] = None
    provider_contact: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    # Relationships
    bookings: List["ServiceBooking"] = Relationship(back_populates="service")

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class ServiceBooking(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    booking_number: str = Field(index=True, unique=True)
    service_id: int = Field(foreign_key="service.id")
    user_id: int = Field(foreign_key="user.id")
    
    # Booking details
    scheduled_date: datetime
    scheduled_time_start: time
    scheduled_time_end: Optional[time] = None
    duration_hours: Optional[int] = None
    location: Optional[str] = None
    special_instructions: Optional[str] = None
    
    # Pricing
    unit_price: Decimal = Field(decimal_places=2)
    quantity: int = Field(default=1)
    total_amount: Decimal = Field(decimal_places=2)
    
    status: BookingStatus = Field(default=BookingStatus.PENDING)
    
    # Admin actions
    confirmed_by: Optional[int] = Field(foreign_key="user.id")
    confirmed_at: Optional[datetime] = None
    
    # Completion
    completed_at: Optional[datetime] = None
    completion_notes: Optional[str] = None
    
    # Rating and feedback
    rating: Optional[int] = None  # 1-5 stars
    feedback: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    # Relationships
    service: Optional["Service"] = Relationship(back_populates="bookings")
    user: Optional["User"] = Relationship(back_populates="service_bookings", sa_relationship_kwargs={"foreign_keys": "[ServiceBooking.user_id]"})