from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum

class NotificationType(str, Enum):
    GENERAL = "general"
    BILL_REMINDER = "bill_reminder"
    PAYMENT_CONFIRMATION = "payment_confirmation"
    MAINTENANCE = "maintenance"
    EVENT = "event"
    URGENT = "urgent"

class NotificationStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENT = "sent"
    CANCELLED = "cancelled"

class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    content: str
    type: NotificationType
    priority: int = Field(default=1)  # 1=low, 2=normal, 3=high, 4=urgent
    target_audience: str = Field(default="")  # "all", "building_a", "floor_1", "apartment_101", etc.
    target_user_id: Optional[int] = Field(default=None, foreign_key="user.id")  # For individual notifications
    status: NotificationStatus = Field(default=NotificationStatus.DRAFT)
    
    # Scheduling
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    
    # Delivery methods
    push_notification: bool = Field(default=True)
    sms: bool = Field(default=False)
    email: bool = Field(default=False)
    
    # Event related
    event_date: Optional[datetime] = None
    event_location: Optional[str] = None
    requires_response: bool = Field(default=False)
    
    created_by: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    # Relationships
    reads: List["NotificationRead"] = Relationship(back_populates="notification")
    responses: List["NotificationResponse"] = Relationship(back_populates="notification")

class NotificationRead(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    notification_id: int = Field(foreign_key="notification.id")
    user_id: int = Field(foreign_key="user.id")
    read_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    notification: Optional["Notification"] = Relationship(back_populates="reads")

class ResponseType(str, Enum):
    ACKNOWLEDGED = "acknowledged"
    ATTENDING = "attending"
    NOT_ATTENDING = "not_attending"
    INTERESTED = "interested"

class NotificationResponse(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    notification_id: int = Field(foreign_key="notification.id")
    user_id: int = Field(foreign_key="user.id")
    response_type: ResponseType
    comment: Optional[str] = None
    responded_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    notification: Optional["Notification"] = Relationship(back_populates="responses")