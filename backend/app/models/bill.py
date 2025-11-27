from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, timedelta
from enum import Enum
from decimal import Decimal

if TYPE_CHECKING:
    from .user import User

class BillStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class BillType(str, Enum):
    MANAGEMENT_FEE = "management_fee"
    UTILITY = "utility"
    PARKING = "parking"
    SERVICE = "service"
    OTHER = "other"

class Bill(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    bill_number: str = Field(index=True, unique=True)
    user_id: int = Field(foreign_key="user.id")
    bill_type: BillType
    title: str
    description: Optional[str] = None
    amount: Decimal = Field(decimal_places=2)
    due_date: datetime
    status: BillStatus = Field(default=BillStatus.PENDING)
    paid_at: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # Relationships
    user: Optional["User"] = Relationship(back_populates="bills")
    payments: List["Payment"] = Relationship(back_populates="bill")


class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    
    OTP_EXPIRED = "otp_expired" # Giữ lại trạng thái hết hạn

class Payment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    payment_date: datetime = Field(default_factory=datetime.utcnow)
    amount: Decimal = Field(decimal_places=2)
    status: PaymentStatus = Field(default=PaymentStatus.PENDING)
    message: Optional[str] = Field(default="", max_length=200)
    
    # Thêm cột bill_id và user_id
    bill_id: Optional[int] = Field(foreign_key="bill.id")
    user_id: Optional[int] = Field(default=None, foreign_key="user.id") 

    # Các trường liên quan đến OTP
    otp: Optional[str] = Field(default=None, max_length=6) # max_length = 6
    
    # Relationships
    user: Optional["User"] = Relationship(back_populates="payments")
    bill: Optional["Bill"] = Relationship(back_populates="payments")