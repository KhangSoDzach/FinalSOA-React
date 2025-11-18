from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import datetime # Vẫn cần cho resolved_at
from app.core.database import get_session
from app.api.dependencies import get_current_user, get_current_admin_user
from app.models.user import User

# Chỉ import các model chính cần thiết
from app.models.ticket import Ticket, TicketStatus 

from app.schemas.ticket import (
    TicketCreate, TicketUpdate, TicketResponse, 
    TicketAssign, TicketResolve,
    TicketStats
)

# --- ROUTER ENDPOINTS ---

router = APIRouter()

@router.get("/my-tickets", response_model=List[TicketResponse])
async def get_my_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[TicketStatus] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get current user's tickets"""
    statement = select(Ticket).where(Ticket.user_id == current_user.id)
    
    if status:
        statement = statement.where(Ticket.status == status)
    
    # Sắp xếp theo ID giảm dần (mới nhất)
    statement = statement.offset(skip).limit(limit).order_by(Ticket.id.desc())
    tickets = session.exec(statement).all()
    
    return tickets

@router.get("/", response_model=List[TicketResponse])
async def get_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[TicketStatus] = None,
    category: Optional[str] = None,
    assigned_to: Optional[int] = None,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get all tickets (admin only)"""
    statement = select(Ticket)
    
    if status:
        statement = statement.where(Ticket.status == status)
    if category:
        statement = statement.where(Ticket.category == category)
    if assigned_to:
        statement = statement.where(Ticket.assigned_to == assigned_to)
    
    # Sắp xếp theo ID giảm dần (mới nhất)
    statement = statement.offset(skip).limit(limit).order_by(Ticket.id.desc())
    tickets = session.exec(statement).all()
    
    return tickets

@router.post("/", response_model=TicketResponse)
async def create_ticket(
    ticket_create: TicketCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create new ticket"""
    # Chỉ lấy các trường có trong TicketBase
    data = ticket_create.model_dump(include={'title', 'description', 'category', 'priority'})
    
    ticket = Ticket(
        user_id=current_user.id,
        **data
    )
    
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    return ticket

@router.get("/{ticket_id}", response_model=TicketResponse) 
async def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get ticket by ID"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    if getattr(current_user, 'role', None) and current_user.role.value == "user" and ticket.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return ticket

@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: int,
    ticket_update: TicketUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update ticket"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    is_user_role = getattr(current_user, 'role', None) and current_user.role.value == "user"
    
    allowed_user_fields = {'title', 'description', 'category', 'priority'}
    allowed_admin_fields = allowed_user_fields.union({'status', 'assigned_to', 'resolution_notes'})
    
    update_data = ticket_update.model_dump(exclude_unset=True)
    
    if is_user_role:
        if ticket.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
        
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_user_fields}
    else:
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_admin_fields}

    changes = []
    for field, new_value in filtered_data.items():
        old_value = getattr(ticket, field)
        if old_value != new_value:
            changes.append((field, str(old_value), str(new_value)))
            setattr(ticket, field, new_value)
    
    if changes:
        if filtered_data.get('status') == TicketStatus.RESOLVED and not ticket.resolved_at:
            ticket.resolved_at = datetime.utcnow()
            ticket.resolved_by = current_user.id
        
        session.add(ticket)
        session.commit()
        session.refresh(ticket)
        
    
    return ticket

@router.post("/{ticket_id}/assign", response_model=TicketResponse)
async def assign_ticket(
    ticket_id: int,
    ticket_assign: TicketAssign,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Assign ticket to user (admin only)"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    assigned_user = session.get(User, ticket_assign.assigned_to)
    if not assigned_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned user not found")
    
    old_assigned = ticket.assigned_to
    
    if old_assigned != ticket_assign.assigned_to:
        ticket.assigned_to = ticket_assign.assigned_to
        
        if ticket.status == TicketStatus.OPEN:
             ticket.status = TicketStatus.ASSIGNED
        
        session.add(ticket)
        session.commit()
        
        session.refresh(ticket)
    
    return ticket

@router.post("/{ticket_id}/resolve", response_model=TicketResponse)
async def resolve_ticket(
    ticket_id: int,
    ticket_resolve: TicketResolve,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Resolve ticket (admin only)"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    ticket.status = TicketStatus.RESOLVED
    ticket.resolved_at = datetime.utcnow()
    ticket.resolved_by = current_user.id
    ticket.resolution_notes = ticket_resolve.resolution_notes
    
    session.add(ticket)
    session.commit()
    
    session.refresh(ticket)
    
    return ticket

@router.get("/stats/overview", response_model=TicketStats)
async def get_ticket_stats(
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get ticket statistics (admin only)"""
    total_tickets = session.exec(select(func.count(Ticket.id))).one()
    open_tickets = session.exec(
        select(func.count(Ticket.id)).where(Ticket.status.in_([TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS]))
    ).one()
    resolved_tickets = session.exec(
        select(func.count(Ticket.id)).where(Ticket.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED]))
    ).one()
    
    # Vì created_at đã bị xóa, chúng ta không thể tính thời gian giải quyết trung bình.
    avg_resolution_time_hours = None
    
    return TicketStats(
        total_tickets=total_tickets,
        open_tickets=open_tickets,
        resolved_tickets=resolved_tickets,
        average_resolution_time_hours=avg_resolution_time_hours, # Đặt là None
        satisfaction_rating=None
    )