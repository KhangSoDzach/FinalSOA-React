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
    user_id: int = Field(foreign_key="user.id")
    title: str
    description: str
    category: TicketCategory
    priority: TicketPriority = Field(default=TicketPriority.NORMAL)
    status: TicketStatus = Field(default=TicketStatus.OPEN)

    # Assignment
    assigned_to: Optional[int] = Field(foreign_key="user.id")
    
    # Resolution
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = Field(foreign_key="user.id")
    resolution_notes: Optional[str] = None
    


    # Relationships
    user: Optional["User"] = Relationship(back_populates="tickets", sa_relationship_kwargs={"foreign_keys": "[Ticket.user_id]"})

