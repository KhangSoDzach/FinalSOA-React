from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.notification import NotificationType, NotificationStatus, ResponseType

class NotificationBase(BaseModel):
    title: str
    content: str
    type: NotificationType
    priority: int = 1
    target_audience: str = "all"
    push_notification: bool = True
    sms: bool = False
    email: bool = False
    requires_response: bool = False

class NotificationCreate(NotificationBase):
    scheduled_at: Optional[datetime] = None
    event_date: Optional[datetime] = None
    event_location: Optional[str] = None

class NotificationUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[NotificationType] = None
    priority: Optional[int] = None
    target_audience: Optional[str] = None
    status: Optional[NotificationStatus] = None
    scheduled_at: Optional[datetime] = None
    event_date: Optional[datetime] = None
    event_location: Optional[str] = None

class NotificationResponse(NotificationBase):
    id: int
    status: NotificationStatus
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    event_date: Optional[datetime] = None
    event_location: Optional[str] = None
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NotificationReadResponse(BaseModel):
    id: int
    notification_id: int
    user_id: int
    read_at: datetime

    class Config:
        from_attributes = True

class NotificationResponseCreate(BaseModel):
    response_type: ResponseType
    comment: Optional[str] = None

class NotificationResponseResponse(BaseModel):
    id: int
    notification_id: int
    user_id: int
    response_type: ResponseType
    comment: Optional[str] = None
    responded_at: datetime

    class Config:
        from_attributes = True

class NotificationStats(BaseModel):
    total_sent: int
    total_read: int
    total_responses: int
    read_rate: float
    response_rate: float