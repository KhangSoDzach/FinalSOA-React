from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
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
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    
    # Relationships
    user: Optional["User"] = Relationship(back_populates="bills")
    payments: List["Payment"] = Relationship(back_populates="bill")

class PaymentMethod(str, Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    ONLINE = "online"
    CREDIT_CARD = "credit_card"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Payment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    payment_number: str = Field(index=True, unique=True)
    user_id: int = Field(foreign_key="user.id")
    bill_id: int = Field(foreign_key="bill.id")
    amount: Decimal = Field(decimal_places=2)
    payment_method: PaymentMethod
    status: PaymentStatus = Field(default=PaymentStatus.PENDING)
    transaction_id: Optional[str] = None
    receipt_url: Optional[str] = None
    evidence_url: Optional[str] = None  # For uploaded payment evidence
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    confirmed_at: Optional[datetime] = None
    confirmed_by: Optional[int] = Field(foreign_key="user.id")
    
    # Relationships
    user: Optional["User"] = Relationship(back_populates="payments", sa_relationship_kwargs={"foreign_keys": "[Payment.user_id]"})
    bill: Optional["Bill"] = Relationship(back_populates="payments")