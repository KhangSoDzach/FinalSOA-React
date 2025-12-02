from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime
from enum import Enum
from decimal import Decimal

class PriceType(str, Enum):
    SERVICE = "service"
    MANAGEMENT_FEE_PER_M2 = "management_fee_per_m2"
    PARKING_CAR = "parking_car"
    PARKING_MOTOR = "parking_motor"
    PARKING_BICYCLE = "parking_bicycle"
    WATER_TIER_1 = "water_tier_1"
    OTHER = "other"

class PriceHistory(SQLModel, table=True):
    __tablename__ = "price_histories"

    id: Optional[int] = Field(default=None, primary_key=True)
    type: PriceType = Field(index=True)
    reference_id: Optional[int] = Field(default=None, index=True) # ServiceID nếu là Service
    price: Decimal = Field(decimal_places=2)
    description: Optional[str] = None
    
    # Quan trọng: Thời điểm giá này bắt đầu có hiệu lực
    effective_from: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    created_by: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)