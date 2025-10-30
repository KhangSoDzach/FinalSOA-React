from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.bill import BillType, BillStatus, PaymentMethod, PaymentStatus

class BillBase(BaseModel):
    title: str
    description: Optional[str] = None
    bill_type: BillType
    amount: Decimal
    due_date: datetime

class BillCreate(BillBase):
    user_id: int

class BillUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    due_date: Optional[datetime] = None
    status: Optional[BillStatus] = None

class BillResponse(BillBase):
    id: int
    bill_number: str
    user_id: int
    status: BillStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    amount: Decimal
    payment_method: PaymentMethod
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    bill_id: int

class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(PaymentBase):
    id: int
    payment_number: str
    user_id: int
    bill_id: int
    status: PaymentStatus
    transaction_id: Optional[str] = None
    receipt_url: Optional[str] = None
    evidence_url: Optional[str] = None
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    confirmed_by: Optional[int] = None

    class Config:
        from_attributes = True

class PaymentConfirm(BaseModel):
    status: PaymentStatus
    notes: Optional[str] = None