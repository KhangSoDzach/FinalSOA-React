from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from enum import Enum

if TYPE_CHECKING:
    from .user import User

class TicketStatus(str, Enum):
    OPEN = "open"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    CANCELLED = "cancelled"

class TicketPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class TicketCategory(str, Enum):
    MAINTENANCE = "maintenance"
    COMPLAINT = "complaint"
    SUGGESTION = "suggestion"
    FACILITY = "facility"
    SECURITY = "security"
    NOISE = "noise"
    CLEANING = "cleaning"
    OTHER = "other"

class Ticket(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ticket_number: str = Field(index=True, unique=True)
    user_id: int = Field(foreign_key="user.id")
    title: str
    description: str
    category: TicketCategory
    priority: TicketPriority = Field(default=TicketPriority.NORMAL)
    status: TicketStatus = Field(default=TicketStatus.OPEN)
    
    # Location information
    location: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    apartment: Optional[str] = None
    
    # Assignment
    assigned_to: Optional[int] = Field(foreign_key="user.id")
    assigned_at: Optional[datetime] = None
    
    # Resolution
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = Field(foreign_key="user.id")
    resolution_notes: Optional[str] = None
    
    # Feedback
    rating: Optional[int] = None  # 1-5 stars
    feedback: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    # Relationships
    user: Optional["User"] = Relationship(back_populates="tickets", sa_relationship_kwargs={"foreign_keys": "[Ticket.user_id]"})
    attachments: List["TicketAttachment"] = Relationship(back_populates="ticket")
    logs: List["TicketLog"] = Relationship(back_populates="ticket")

class TicketAttachment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ticket_id: int = Field(foreign_key="ticket.id")
    file_name: str
    file_url: str
    file_type: str
    file_size: int
    uploaded_by: int = Field(foreign_key="user.id")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    ticket: Optional["Ticket"] = Relationship(back_populates="attachments")

class TicketLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ticket_id: int = Field(foreign_key="ticket.id")
    action: str  # "created", "assigned", "status_changed", "commented", etc.
    description: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_by: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    ticket: Optional["Ticket"] = Relationship(back_populates="logs")