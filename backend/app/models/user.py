from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from enum import Enum
from decimal import Decimal
if TYPE_CHECKING:
    from .bill import Bill, Payment
    from .ticket import Ticket
    from .service import ServiceBooking
    from .apartment import Apartment
    from .vehicle import Vehicle

class UserRole(str, Enum):
    USER = "user"
    MANAGER = "manager"         # Quản lý - Full access
    ACCOUNTANT = "accountant"   # Kế toán - Bills & Finance
    RECEPTIONIST = "receptionist"  # Lễ tân - Services & Support

class OccupierType(str, Enum):
    OWNER = "owner"
    RENTER = "renter"

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    full_name: str
    balance: Decimal = Field(default=Decimal("0.00"))
    phone: Optional[str] = None
    role: UserRole = Field(default=UserRole.USER)
    
    occupier: Optional[OccupierType] = Field(default=OccupierType.OWNER)
    
    apartment_number: Optional[str] = None
    building: Optional[str] = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    # Password reset fields
    reset_otp: Optional[str] = None
    reset_otp_created_at: Optional[datetime] = None
    
    # Relationships
    bills: List["Bill"] = Relationship(back_populates="user")
    tickets: List["Ticket"] = Relationship(back_populates="user", sa_relationship_kwargs={"foreign_keys": "[Ticket.user_id]"})
    payments: List["Payment"] = Relationship(back_populates="user", sa_relationship_kwargs={"foreign_keys": "Payment.user_id"})
    service_bookings: List["ServiceBooking"] = Relationship(back_populates="user", sa_relationship_kwargs={"foreign_keys": "[ServiceBooking.user_id]"})
    apartment: Optional["Apartment"] = Relationship(back_populates="resident", sa_relationship_kwargs={"foreign_keys": "[Apartment.resident_id]"})
    vehicles: List["Vehicle"] = Relationship(back_populates="user", sa_relationship_kwargs={"foreign_keys": "[Vehicle.user_id]"})