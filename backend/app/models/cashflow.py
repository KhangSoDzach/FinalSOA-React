from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum
from decimal import Decimal

class CashFlowType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"

class CashFlowCategory(str, Enum):
    # Income categories
    MANAGEMENT_FEE = "management_fee"
    UTILITY_PAYMENT = "utility_payment"
    PARKING_FEE = "parking_fee"
    SERVICE_FEE = "service_fee"
    
    # Expense categories
    MAINTENANCE = "maintenance"
    UTILITIES = "utilities"
    STAFF_SALARY = "staff_salary"
    EQUIPMENT = "equipment"
    OTHER = "other"

class CashFlow(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    transaction_number: str = Field(index=True, unique=True)
    type: CashFlowType
    category: CashFlowCategory
    amount: Decimal = Field(decimal_places=2)
    description: str
    date: datetime
    account_type: str  # "cash" or "bank"
    bank_account: Optional[str] = None
    reference_number: Optional[str] = None
    evidence_url: Optional[str] = None  # Attached documents
    created_by: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    # For reconciliation
    reconciled: bool = Field(default=False)
    reconciled_at: Optional[datetime] = None
    reconciled_by: Optional[int] = Field(foreign_key="user.id")

class BankStatement(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    bank_account: str
    statement_date: datetime
    opening_balance: Decimal = Field(decimal_places=2)
    closing_balance: Decimal = Field(decimal_places=2)
    statement_file_url: str
    uploaded_by: int = Field(foreign_key="user.id")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    reconciled: bool = Field(default=False)