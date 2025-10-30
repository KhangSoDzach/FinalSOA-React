from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.ticket import TicketCategory, TicketPriority, TicketStatus

class TicketBase(BaseModel):
    title: str
    description: str
    category: TicketCategory
    priority: TicketPriority = TicketPriority.NORMAL
    location: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    apartment: Optional[str] = None

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[TicketCategory] = None
    priority: Optional[TicketPriority] = None
    status: Optional[TicketStatus] = None
    location: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    apartment: Optional[str] = None
    assigned_to: Optional[int] = None
    resolution_notes: Optional[str] = None

class TicketResponse(TicketBase):
    id: int
    ticket_number: str
    user_id: int
    status: TicketStatus
    assigned_to: Optional[int] = None
    assigned_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None
    resolution_notes: Optional[str] = None
    rating: Optional[int] = None
    feedback: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TicketAssign(BaseModel):
    assigned_to: int

class TicketResolve(BaseModel):
    resolution_notes: str

class TicketFeedback(BaseModel):
    rating: int  # 1-5
    feedback: Optional[str] = None

class TicketAttachmentResponse(BaseModel):
    id: int
    ticket_id: int
    file_name: str
    file_url: str
    file_type: str
    file_size: int
    uploaded_by: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

class TicketLogResponse(BaseModel):
    id: int
    ticket_id: int
    action: str
    description: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

class TicketStats(BaseModel):
    total_tickets: int
    open_tickets: int
    resolved_tickets: int
    average_resolution_time: float
    satisfaction_rating: float