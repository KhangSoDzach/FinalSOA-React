from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import datetime
import uuid
import os
from app.core.database import get_session
from app.api.dependencies import get_current_user, get_current_admin_user
from app.models.user import User
from app.models.ticket import Ticket, TicketAttachment, TicketLog, TicketStatus
from app.schemas.ticket import (
    TicketCreate, TicketUpdate, TicketResponse,
    TicketAssign, TicketResolve, TicketFeedback,
    TicketAttachmentResponse, TicketLogResponse, TicketStats
)
from app.core.config import settings

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
    
    statement = statement.offset(skip).limit(limit).order_by(Ticket.created_at.desc())
    tickets = session.exec(statement).all()
    
    return tickets

@router.get("/", response_model=List[TicketResponse])
async def get_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[TicketStatus] = None,
    category: Optional[str] = None,
    assigned_to: Optional[int] = None,
    building: Optional[str] = None,
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
    if building:
        statement = statement.where(Ticket.building == building)
    
    statement = statement.offset(skip).limit(limit).order_by(Ticket.created_at.desc())
    tickets = session.exec(statement).all()
    
    return tickets

@router.post("/", response_model=TicketResponse)
async def create_ticket(
    ticket_create: TicketCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create new ticket"""
    # Generate unique ticket number
    ticket_number = f"TCK-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    
    # Auto-fill user's building and apartment if not provided
    ticket_data = ticket_create.dict()
    if not ticket_data.get('building'):
        ticket_data['building'] = current_user.building
    if not ticket_data.get('apartment'):
        ticket_data['apartment'] = current_user.apartment_number
    
    ticket = Ticket(
        ticket_number=ticket_number,
        user_id=current_user.id,
        **ticket_data
    )
    
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    # Create log entry
    log = TicketLog(
        ticket_id=ticket.id,
        action="created",
        description=f"Ticket created by {current_user.full_name}",
        created_by=current_user.id
    )
    session.add(log)
    session.commit()
    
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
    
    # Users can only view their own tickets, admins can view any ticket
    if current_user.role.value == "user" and ticket.user_id != current_user.id:
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
    
    # Users can only update their own tickets (limited fields)
    # Admins can update any ticket
    if current_user.role.value == "user":
        if ticket.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        # Users can only update certain fields
        allowed_fields = {'title', 'description', 'location'}
        update_data = {k: v for k, v in ticket_update.dict(exclude_unset=True).items() 
                      if k in allowed_fields}
    else:
        update_data = ticket_update.dict(exclude_unset=True)
    
    # Track changes for logging
    changes = []
    for field, new_value in update_data.items():
        old_value = getattr(ticket, field)
        if old_value != new_value:
            changes.append((field, str(old_value), str(new_value)))
            setattr(ticket, field, new_value)
    
    ticket.updated_at = datetime.utcnow()
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    # Create log entries for changes
    for field, old_value, new_value in changes:
        log = TicketLog(
            ticket_id=ticket.id,
            action="updated",
            description=f"{field.replace('_', ' ').title()} changed",
            old_value=old_value,
            new_value=new_value,
            created_by=current_user.id
        )
        session.add(log)
    
    session.commit()
    
    return ticket

@router.post("/{ticket_id}/assign")
async def assign_ticket(
    ticket_id: int,
    ticket_assign: TicketAssign,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Assign ticket to user (admin only)"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Verify assigned user exists
    assigned_user = session.get(User, ticket_assign.assigned_to)
    if not assigned_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned user not found"
        )
    
    old_assigned = ticket.assigned_to
    ticket.assigned_to = ticket_assign.assigned_to
    ticket.assigned_at = datetime.utcnow()
    ticket.status = TicketStatus.ASSIGNED
    ticket.updated_at = datetime.utcnow()
    
    session.add(ticket)
    session.commit()
    
    # Create log entry
    log = TicketLog(
        ticket_id=ticket.id,
        action="assigned",
        description=f"Ticket assigned to {assigned_user.full_name}",
        old_value=str(old_assigned) if old_assigned else None,
        new_value=str(ticket_assign.assigned_to),
        created_by=current_user.id
    )
    session.add(log)
    session.commit()
    
    return {"message": "Ticket assigned successfully"}

@router.post("/{ticket_id}/resolve")
async def resolve_ticket(
    ticket_id: int,
    ticket_resolve: TicketResolve,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Resolve ticket (admin only)"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    ticket.status = TicketStatus.RESOLVED
    ticket.resolved_at = datetime.utcnow()
    ticket.resolved_by = current_user.id
    ticket.resolution_notes = ticket_resolve.resolution_notes
    ticket.updated_at = datetime.utcnow()
    
    session.add(ticket)
    session.commit()
    
    # Create log entry
    log = TicketLog(
        ticket_id=ticket.id,
        action="resolved",
        description=f"Ticket resolved by {current_user.full_name}",
        new_value=ticket_resolve.resolution_notes,
        created_by=current_user.id
    )
    session.add(log)
    session.commit()
    
    return {"message": "Ticket resolved successfully"}

@router.post("/{ticket_id}/feedback")
async def provide_feedback(
    ticket_id: int,
    feedback: TicketFeedback,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Provide feedback for resolved ticket"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Users can only provide feedback for their own tickets
    if current_user.role.value == "user" and ticket.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    if ticket.status != TicketStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only provide feedback for resolved tickets"
        )
    
    ticket.rating = feedback.rating
    ticket.feedback = feedback.feedback
    ticket.status = TicketStatus.CLOSED
    ticket.updated_at = datetime.utcnow()
    
    session.add(ticket)
    session.commit()
    
    # Create log entry
    log = TicketLog(
        ticket_id=ticket.id,
        action="feedback_provided",
        description=f"Feedback provided: {feedback.rating}/5 stars",
        new_value=feedback.feedback,
        created_by=current_user.id
    )
    session.add(log)
    session.commit()
    
    return {"message": "Feedback provided successfully"}

@router.post("/{ticket_id}/attachments")
async def upload_attachment(
    ticket_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Upload attachment for ticket"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Users can only upload attachments to their own tickets
    if current_user.role.value == "user" and ticket.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Create upload directory if it doesn't exist
    upload_dir = settings.upload_dir
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"ticket_{ticket_id}_{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    attachment = TicketAttachment(
        ticket_id=ticket_id,
        file_name=file.filename,
        file_url=file_path,
        file_type=file.content_type,
        file_size=len(content),
        uploaded_by=current_user.id
    )
    
    session.add(attachment)
    session.commit()
    
    return {"message": "Attachment uploaded successfully", "file_path": file_path}

@router.get("/{ticket_id}/attachments", response_model=List[TicketAttachmentResponse])
async def get_ticket_attachments(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get ticket attachments"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Users can only view attachments for their own tickets
    if current_user.role.value == "user" and ticket.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    statement = select(TicketAttachment).where(TicketAttachment.ticket_id == ticket_id)
    attachments = session.exec(statement).all()
    
    return attachments

@router.get("/{ticket_id}/logs", response_model=List[TicketLogResponse])
async def get_ticket_logs(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get ticket logs"""
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Users can only view logs for their own tickets
    if current_user.role.value == "user" and ticket.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    statement = select(TicketLog).where(TicketLog.ticket_id == ticket_id).order_by(TicketLog.created_at)
    logs = session.exec(statement).all()
    
    return logs

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
        select(func.count(Ticket.id)).where(Ticket.status == TicketStatus.RESOLVED)
    ).one()
    
    # Calculate average resolution time (simplified)
    avg_resolution_time = 2.5  # days - would need proper calculation
    
    # Calculate satisfaction rating
    avg_rating = session.exec(
        select(func.avg(Ticket.rating)).where(Ticket.rating.isnot(None))
    ).one() or 0.0
    
    return TicketStats(
        total_tickets=total_tickets,
        open_tickets=open_tickets,
        resolved_tickets=resolved_tickets,
        average_resolution_time=avg_resolution_time,
        satisfaction_rating=float(avg_rating)
    )