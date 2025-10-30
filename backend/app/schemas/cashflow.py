from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.cashflow import CashFlowType, CashFlowCategory

class CashFlowBase(BaseModel):
    type: CashFlowType
    category: CashFlowCategory
    amount: Decimal
    description: str
    date: datetime
    account_type: str  # "cash" or "bank"
    bank_account: Optional[str] = None
    reference_number: Optional[str] = None

class CashFlowCreate(CashFlowBase):
    pass

class CashFlowUpdate(BaseModel):
    type: Optional[CashFlowType] = None
    category: Optional[CashFlowCategory] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    account_type: Optional[str] = None
    bank_account: Optional[str] = None
    reference_number: Optional[str] = None

class CashFlowResponse(CashFlowBase):
    id: int
    transaction_number: str
    evidence_url: Optional[str] = None
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    reconciled: bool
    reconciled_at: Optional[datetime] = None
    reconciled_by: Optional[int] = None

    class Config:
        from_attributes = True

class BankStatementBase(BaseModel):
    bank_account: str
    statement_date: datetime
    opening_balance: Decimal
    closing_balance: Decimal

class BankStatementCreate(BankStatementBase):
    pass

class BankStatementResponse(BankStatementBase):
    id: int
    statement_file_url: str
    uploaded_by: int
    uploaded_at: datetime
    reconciled: bool

    class Config:
        from_attributes = True

class ReconcileRequest(BaseModel):
    cash_flow_ids: list[int]