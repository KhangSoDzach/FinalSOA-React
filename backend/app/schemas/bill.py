from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.bill import BillType, BillStatus, PaymentStatus

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
    is_prorated: bool = False  # Badge hiển thị Pro-rata
    # ĐÃ SỬA: Thay đổi thành Optional[datetime] để khớp với model (nếu trường này đã bị xóa)
    created_at: Optional[datetime] = None 
    # Nếu updated_at cũng bị xóa khỏi model, nó cũng nên là Optional ở đây
    updated_at: Optional[datetime] = None 
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    amount: Decimal
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    bill_id: int

class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int 
    bill_id: Optional[int] = None
    user_id: int 
    amount: Decimal
    status: PaymentStatus
    message: Optional[str] = None
    payment_date: datetime

    class Config:
        from_attributes = True

# --- SCHEMAS FOR OTP PAYMENT ---

class PaymentRequest(BaseModel):
    bill_id: int

class OTPVerify(BaseModel):
    payment_id: int 
    otp: str

class PaymentRequestResponse(BaseModel):
    payment_id: int 
    message: str
    bill_amount: Decimal
    # Giả định trường này không còn trong model nhưng frontend vẫn cần 
    otp_valid_until: datetime

    class Config:
        from_attributes = True