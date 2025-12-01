from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import datetime, time
from app.core.database import get_session
from app.api.dependencies import get_current_user, get_current_receptionist
from app.models.user import User
from app.models.service import Service, ServiceBooking, ServiceStatus, BookingStatus
from app.schemas.service import (
    ServiceCreate, ServiceUpdate, ServiceResponse,
    ServiceBookingCreate, ServiceBookingUpdate, ServiceBookingResponse,
    BookingConfirm,
    ServiceBookingBase 
)
import uuid

router = APIRouter()

# --- PUBLIC / USER ENDPOINTS ---

@router.get("/", response_model=List[ServiceResponse])
async def get_services(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Lấy danh sách dịch vụ đang hoạt động"""
    statement = select(Service).where(Service.status == ServiceStatus.ACTIVE)
    
    if category:
        statement = statement.where(Service.category == category)
    
    statement = statement.offset(skip).limit(limit).order_by(Service.name)
    services = session.exec(statement).all()
    return services

@router.get("/bookings/my-bookings", response_model=List[ServiceBookingResponse])
async def get_my_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[BookingStatus] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Lấy lịch sử đặt chỗ của user hiện tại"""
    statement = select(ServiceBooking).where(ServiceBooking.user_id == current_user.id)
    
    if status:
        statement = statement.where(ServiceBooking.status == status)
    
    # Sắp xếp mới nhất lên đầu
    statement = statement.offset(skip).limit(limit).order_by(ServiceBooking.created_at.desc())
    bookings = session.exec(statement).all()
        
    return bookings

@router.post("/{service_id}/book", response_model=ServiceBookingResponse)
async def book_service(
    service_id: int,
    booking_create: ServiceBookingBase, 
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Đặt dịch vụ mới"""
    service = session.get(Service, service_id)
    if not service or service.status != ServiceStatus.ACTIVE:
        raise HTTPException(status_code=404, detail="Dịch vụ không tồn tại hoặc ngừng hoạt động")
    
    # SỬA LỖI: Đồng bộ timezone để so sánh thời gian
    # Lấy timezone từ input của user (nếu có) để so sánh chính xác
    current_time = datetime.now(booking_create.scheduled_date.tzinfo)
    
    if booking_create.scheduled_date < current_time:
        raise HTTPException(status_code=400, detail="Không thể đặt lịch trong quá khứ")
    
    booking_number = f"BK-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    total_amount = service.price * booking_create.quantity
    
    booking = ServiceBooking(
        booking_number=booking_number,
        service_id=service_id, 
        user_id=current_user.id,
        unit_price=service.price,
        total_amount=total_amount,
        scheduled_date=booking_create.scheduled_date,
        scheduled_time_start=booking_create.scheduled_time_start,
        special_instructions=booking_create.special_instructions,
        status=BookingStatus.PENDING 
    )
    
    session.add(booking)
    session.commit()
    session.refresh(booking)
    return booking

@router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Hủy đặt chỗ (Chỉ áp dụng cho trạng thái PENDING)"""
    booking = session.get(ServiceBooking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn đặt")
    
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không có quyền thực hiện")
    
    # Chỉ cho hủy khi chưa được Admin xác nhận (Pending)
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(
            status_code=400, 
            detail="Chỉ có thể hủy đơn khi đang chờ xác nhận. Vui lòng liên hệ BQL."
        )
    
    booking.status = BookingStatus.CANCELLED
    booking.updated_at = datetime.utcnow()
    session.add(booking)
    session.commit()
    
    return {"message": "Hủy đặt dịch vụ thành công"}


# --- ADMIN / STAFF ENDPOINTS (RECEPTIONIST) ---

@router.get("/admin/all", response_model=List[ServiceResponse])
async def get_all_services_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    category: Optional[str] = None,
    status: Optional[ServiceStatus] = None,
    current_user: User = Depends(get_current_receptionist),
    session: Session = Depends(get_session)
):
    """Get all services including inactive (receptionist/manager only)"""
    statement = select(Service)
    
    if category:
        statement = statement.where(Service.category == category)
    if status:
        statement = statement.where(Service.status == status)
    
    statement = statement.offset(skip).limit(limit).order_by(Service.name)
    services = session.exec(statement).all()
    return services


@router.post("/admin", response_model=ServiceResponse)
async def create_service(
    service_create: ServiceCreate,
    current_user: User = Depends(get_current_receptionist),
    session: Session = Depends(get_session)
):
    """Create new service (receptionist/manager only)"""
    service = Service(**service_create.dict())
    
    session.add(service)
    session.commit()
    session.refresh(service)
    
    return service


@router.put("/admin/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: int,
    service_update: ServiceUpdate,
    current_user: User = Depends(get_current_receptionist),
    session: Session = Depends(get_session)
):
    """Update service (receptionist/manager only)"""
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    update_data = service_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)
    
    service.updated_at = datetime.utcnow()
    session.add(service)
    session.commit()
    session.refresh(service)
    
    return service


@router.delete("/admin/{service_id}")
async def delete_service(
    service_id: int,
    current_user: User = Depends(get_current_receptionist),
    session: Session = Depends(get_session)
):
    """Delete service (receptionist/manager only)"""
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check if there are active bookings
    active_bookings = session.exec(
        select(ServiceBooking).where(
            ServiceBooking.service_id == service_id,
            ServiceBooking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS])
        )
    ).first()
    
    if active_bookings:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete service with active bookings. Set status to INACTIVE instead."
        )
    
    session.delete(service)
    session.commit()
    
    return {"message": "Service deleted successfully"}


@router.get("/admin/bookings/all", response_model=List[ServiceBookingResponse])
async def get_all_bookings_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[BookingStatus] = None,
    service_id: Optional[int] = None,
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_receptionist),
    session: Session = Depends(get_session)
):
    """Get all service bookings (receptionist/manager only)"""
    statement = select(ServiceBooking)
    
    if status:
        statement = statement.where(ServiceBooking.status == status)
    if service_id:
        statement = statement.where(ServiceBooking.service_id == service_id)
    if user_id:
        statement = statement.where(ServiceBooking.user_id == user_id)
    
    statement = statement.offset(skip).limit(limit).order_by(ServiceBooking.created_at.desc())
    bookings = session.exec(statement).all()
    
    return bookings


@router.post("/admin/bookings/{booking_id}/confirm", response_model=ServiceBookingResponse)
async def confirm_booking(
    booking_id: int,
    booking_confirm: BookingConfirm,
    current_user: User = Depends(get_current_receptionist),
    session: Session = Depends(get_session)
):
    """Confirm a service booking (receptionist/manager only)"""
    booking = session.get(ServiceBooking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Only pending bookings can be confirmed"
        )
    
    booking.status = BookingStatus.CONFIRMED
    booking.confirmed_by = current_user.id
    booking.confirmed_at = datetime.utcnow()
    
    if booking_confirm.notes:
        booking.special_instructions = (booking.special_instructions or "") + f"\nStaff notes: {booking_confirm.notes}"
    
    booking.updated_at = datetime.utcnow()
    session.add(booking)
    session.commit()
    session.refresh(booking)
    
    return booking


@router.put("/admin/bookings/{booking_id}/complete", response_model=ServiceBookingResponse)
async def complete_booking(
    booking_id: int,
    current_user: User = Depends(get_current_receptionist),
    session: Session = Depends(get_session)
):
    """Mark booking as completed (receptionist/manager only)"""
    booking = session.get(ServiceBooking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status not in [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS]:
        raise HTTPException(
            status_code=400,
            detail="Only confirmed or in-progress bookings can be completed"
        )
    
    booking.status = BookingStatus.COMPLETED
    booking.completed_at = datetime.utcnow()
    booking.updated_at = datetime.utcnow()
    session.add(booking)
    session.commit()
    session.refresh(booking)
    
    return booking