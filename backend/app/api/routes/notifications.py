from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import datetime
from app.core.database import get_session
from app.api.dependencies import get_current_user, get_current_admin_user
from app.models.user import User
from app.models.notification import Notification, NotificationRead, NotificationResponse, NotificationStatus
from app.schemas.notification import (
    NotificationCreate, NotificationUpdate, NotificationResponse as NotificationResponseSchema,
    NotificationReadResponse, NotificationResponseCreate, NotificationResponseResponse,
    NotificationStats
)

router = APIRouter()

@router.get("/", response_model=List[NotificationResponseSchema])
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    type: Optional[str] = None,
    status: Optional[NotificationStatus] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get notifications for current user"""
    statement = select(Notification)
    
    # Filter by target audience or show all public notifications
    statement = statement.where(
        (Notification.target_audience == "all") |
        (Notification.target_audience == current_user.building) |
        (Notification.target_audience == f"apartment_{current_user.apartment_number}")
    )
    
    if type:
        statement = statement.where(Notification.type == type)
    if status:
        statement = statement.where(Notification.status == status)
    else:
        # Only show sent notifications to users
        statement = statement.where(Notification.status == NotificationStatus.SENT)
    
    statement = statement.offset(skip).limit(limit).order_by(Notification.created_at.desc())
    notifications = session.exec(statement).all()
    
    return notifications

@router.get("/admin", response_model=List[NotificationResponseSchema])
async def get_all_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    type: Optional[str] = None,
    status: Optional[NotificationStatus] = None,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get all notifications (admin only)"""
    statement = select(Notification)
    
    if type:
        statement = statement.where(Notification.type == type)
    if status:
        statement = statement.where(Notification.status == status)
    
    statement = statement.offset(skip).limit(limit).order_by(Notification.created_at.desc())
    notifications = session.exec(statement).all()
    
    return notifications

@router.post("/", response_model=NotificationResponseSchema)
async def create_notification(
    notification_create: NotificationCreate,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Create new notification (admin only)"""
    notification = Notification(
        created_by=current_user.id,
        **notification_create.dict()
    )
    
    # If scheduled_at is not set and status is not draft, send immediately
    if not notification_create.scheduled_at and notification.status != NotificationStatus.DRAFT:
        notification.status = NotificationStatus.SENT
        notification.sent_at = datetime.utcnow()
    
    session.add(notification)
    session.commit()
    session.refresh(notification)
    
    return notification

@router.get("/{notification_id}", response_model=NotificationResponseSchema)
async def get_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get notification by ID"""
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Check if user has access to this notification
    if current_user.role.value == "user":
        # Check target audience
        has_access = (
            notification.target_audience == "all" or
            notification.target_audience == current_user.building or
            notification.target_audience == f"apartment_{current_user.apartment_number}"
        )
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    return notification

@router.put("/{notification_id}", response_model=NotificationResponseSchema)
async def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Update notification (admin only)"""
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    update_data = notification_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(notification, field, value)
    
    notification.updated_at = datetime.utcnow()
    session.add(notification)
    session.commit()
    session.refresh(notification)
    
    return notification

@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Mark notification as read"""
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Check if already read
    statement = select(NotificationRead).where(
        NotificationRead.notification_id == notification_id,
        NotificationRead.user_id == current_user.id
    )
    existing_read = session.exec(statement).first()
    
    if not existing_read:
        read_record = NotificationRead(
            notification_id=notification_id,
            user_id=current_user.id
        )
        session.add(read_record)
        session.commit()
    
    return {"message": "Notification marked as read"}

@router.post("/{notification_id}/respond", response_model=NotificationResponseResponse)
async def respond_to_notification(
    notification_id: int,
    response_create: NotificationResponseCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Respond to notification"""
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    if not notification.requires_response:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This notification does not require a response"
        )
    
    # Check if user already responded
    statement = select(NotificationResponse).where(
        NotificationResponse.notification_id == notification_id,
        NotificationResponse.user_id == current_user.id
    )
    existing_response = session.exec(statement).first()
    
    if existing_response:
        # Update existing response
        existing_response.response_type = response_create.response_type
        existing_response.comment = response_create.comment
        existing_response.responded_at = datetime.utcnow()
        session.add(existing_response)
        session.commit()
        session.refresh(existing_response)
        return existing_response
    else:
        # Create new response
        response = NotificationResponse(
            notification_id=notification_id,
            user_id=current_user.id,
            **response_create.dict()
        )
        session.add(response)
        session.commit()
        session.refresh(response)
        return response

@router.get("/{notification_id}/stats", response_model=NotificationStats)
async def get_notification_stats(
    notification_id: int,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get notification statistics (admin only)"""
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Count total users in target audience (simplified - would need proper calculation)
    total_sent = 100  # This would be calculated based on target_audience
    
    # Count reads
    total_read = session.exec(
        select(func.count(NotificationRead.id)).where(
            NotificationRead.notification_id == notification_id
        )
    ).one()
    
    # Count responses
    total_responses = session.exec(
        select(func.count(NotificationResponse.id)).where(
            NotificationResponse.notification_id == notification_id
        )
    ).one()
    
    read_rate = (total_read / total_sent * 100) if total_sent > 0 else 0
    response_rate = (total_responses / total_sent * 100) if total_sent > 0 else 0
    
    return NotificationStats(
        total_sent=total_sent,
        total_read=total_read,
        total_responses=total_responses,
        read_rate=read_rate,
        response_rate=response_rate
    )

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Delete notification (admin only)"""
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    if notification.status == NotificationStatus.SENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete sent notifications"
        )
    
    session.delete(notification)
    session.commit()
    
    return {"message": "Notification deleted successfully"}