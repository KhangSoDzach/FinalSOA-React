from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import datetime, time
from app.core.database import get_session
from app.api.dependencies import get_current_user, get_current_admin_user
from app.models.user import User
from app.models.service import Service, ServiceBooking, ServiceStatus, BookingStatus
from app.schemas.service import (
    ServiceCreate, ServiceUpdate, ServiceResponse,
    ServiceBookingCreate, ServiceBookingUpdate, ServiceBookingResponse,
    BookingConfirm, BookingFeedback
)
import uuid

router = APIRouter()

# Service Management (Admin)
@router.get("/", response_model=List[ServiceResponse])
async def get_services(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    category: Optional[str] = None,
    status: Optional[ServiceStatus] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get available services"""
    statement = select(Service)
    
    if category:
        statement = statement.where(Service.category == category)
    if status:
        statement = statement.where(Service.status == status)
    else:
        # Only show active services to regular users
        if current_user.role.value == "user":
            statement = statement.where(Service.status == ServiceStatus.ACTIVE)
    
    statement = statement.offset(skip).limit(limit).order_by(Service.name)
    services = session.exec(statement).all()
    
    return services

@router.post("/", response_model=ServiceResponse)
async def create_service(
    service_create: ServiceCreate,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Create new service (admin only)"""
    service = Service(**service_create.dict())
    
    session.add(service)
    session.commit()
    session.refresh(service)
    
    return service

@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get service by ID"""
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    # Users can only view active services
    if current_user.role.value == "user" and service.status != ServiceStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    return service

@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: int,
    service_update: ServiceUpdate,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Update service (admin only)"""
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    update_data = service_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)
    
    service.updated_at = datetime.utcnow()
    session.add(service)
    session.commit()
    session.refresh(service)
    
    return service

@router.delete("/{service_id}")
async def delete_service(
    service_id: int,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Delete service (admin only)"""
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    # Check if there are active bookings
    statement = select(ServiceBooking).where(
        ServiceBooking.service_id == service_id,
        ServiceBooking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS])
    )
    active_bookings = session.exec(statement).first()
    
    if active_bookings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete service with active bookings"
        )
    
    session.delete(service)
    session.commit()
    
    return {"message": "Service deleted successfully"}

# Service Booking (Users)
@router.get("/bookings/my-bookings", response_model=List[ServiceBookingResponse])
async def get_my_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[BookingStatus] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get current user's service bookings"""
    statement = select(ServiceBooking).where(ServiceBooking.user_id == current_user.id)
    
    if status:
        statement = statement.where(ServiceBooking.status == status)
    
    statement = statement.offset(skip).limit(limit).order_by(ServiceBooking.created_at.desc())
    bookings = session.exec(statement).all()
    
    return bookings

@router.get("/bookings", response_model=List[ServiceBookingResponse])
async def get_all_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    service_id: Optional[int] = None,
    status: Optional[BookingStatus] = None,
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get all service bookings (admin only)"""
    statement = select(ServiceBooking)
    
    if service_id:
        statement = statement.where(ServiceBooking.service_id == service_id)
    if status:
        statement = statement.where(ServiceBooking.status == status)
    if user_id:
        statement = statement.where(ServiceBooking.user_id == user_id)
    
    statement = statement.offset(skip).limit(limit).order_by(ServiceBooking.created_at.desc())
    bookings = session.exec(statement).all()
    
    return bookings

@router.post("/{service_id}/book", response_model=ServiceBookingResponse)
async def book_service(
    service_id: int,
    booking_create: ServiceBookingCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Book a service"""
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    if service.status != ServiceStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service is not available for booking"
        )
    
    # Validate booking time (simplified validation)
    if booking_create.scheduled_date < datetime.now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot book service in the past"
        )
    
    # Generate unique booking number
    booking_number = f"BK-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    
    # Calculate total amount
    total_amount = service.price * booking_create.quantity
    
    booking = ServiceBooking(
        booking_number=booking_number,
        service_id=service_id,
        user_id=current_user.id,
        unit_price=service.price,
        total_amount=total_amount,
        **booking_create.dict()
    )
    
    session.add(booking)
    session.commit()
    session.refresh(booking)
    
    return booking

@router.get("/bookings/{booking_id}", response_model=ServiceBookingResponse)
async def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get booking by ID"""
    booking = session.get(ServiceBooking, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Users can only view their own bookings
    if current_user.role.value == "user" and booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return booking

@router.put("/bookings/{booking_id}", response_model=ServiceBookingResponse)
async def update_booking(
    booking_id: int,
    booking_update: ServiceBookingUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update booking"""
    booking = session.get(ServiceBooking, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Users can only update their own bookings (limited fields)
    if current_user.role.value == "user":
        if booking.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        if booking.status not in [BookingStatus.PENDING]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only update pending bookings"
            )
        
        # Users can only update certain fields
        allowed_fields = {'scheduled_date', 'scheduled_time_start', 'scheduled_time_end', 'location', 'special_instructions'}
        update_data = {k: v for k, v in booking_update.dict(exclude_unset=True).items() 
                      if k in allowed_fields}
    else:
        update_data = booking_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(booking, field, value)
    
    # Recalculate total if quantity changed
    if 'quantity' in update_data:
        service = session.get(Service, booking.service_id)
        booking.total_amount = service.price * booking.quantity
    
    booking.updated_at = datetime.utcnow()
    session.add(booking)
    session.commit()
    session.refresh(booking)
    
    return booking

@router.post("/bookings/{booking_id}/confirm")
async def confirm_booking(
    booking_id: int,
    booking_confirm: BookingConfirm,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Confirm booking (admin only)"""
    booking = session.get(ServiceBooking, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    booking.status = booking_confirm.status
    booking.confirmed_by = current_user.id
    booking.confirmed_at = datetime.utcnow()
    
    if booking_confirm.status == BookingStatus.COMPLETED:
        booking.completed_at = datetime.utcnow()
        booking.completion_notes = booking_confirm.completion_notes
    
    booking.updated_at = datetime.utcnow()
    session.add(booking)
    session.commit()
    
    return {"message": "Booking status updated successfully"}

@router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Cancel booking"""
    booking = session.get(ServiceBooking, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Users can only cancel their own bookings
    if current_user.role.value == "user" and booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    if booking.status not in [BookingStatus.PENDING, BookingStatus.CONFIRMED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only cancel pending or confirmed bookings"
        )
    
    booking.status = BookingStatus.CANCELLED
    booking.updated_at = datetime.utcnow()
    session.add(booking)
    session.commit()
    
    return {"message": "Booking cancelled successfully"}

@router.post("/bookings/{booking_id}/feedback")
async def provide_booking_feedback(
    booking_id: int,
    feedback: BookingFeedback,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Provide feedback for completed booking"""
    booking = session.get(ServiceBooking, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Users can only provide feedback for their own bookings
    if current_user.role.value == "user" and booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only provide feedback for completed bookings"
        )
    
    booking.rating = feedback.rating
    booking.feedback = feedback.feedback
    booking.updated_at = datetime.utcnow()
    
    session.add(booking)
    session.commit()
    
    return {"message": "Feedback provided successfully"}