from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func, or_
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_session
from app.api.dependencies import get_current_user, get_current_admin_user
from app.models.vehicle import Vehicle, VehicleStatus, VehicleType
from app.models.user import User
from app.schemas.vehicle import (
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse,
    VehicleWithUserResponse,
    VehicleApproval,
    VehicleStats
)

router = APIRouter()

# User endpoints
@router.post("/", response_model=VehicleResponse)
def create_vehicle(
    vehicle_data: VehicleCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """User đăng ký xe mới"""
    # Kiểm tra license plate đã tồn tại chưa
    existing = session.exec(
        select(Vehicle).where(Vehicle.license_plate == vehicle_data.license_plate)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="License plate already registered")
    
    # Tạo vehicle mới với status PENDING
    vehicle = Vehicle(
        **vehicle_data.model_dump(),
        user_id=current_user.id,
        status=VehicleStatus.PENDING,
        expires_at=datetime.utcnow() + timedelta(days=365)  # 1 năm
    )
    
    session.add(vehicle)
    session.commit()
    session.refresh(vehicle)
    
    return vehicle

@router.get("/my-vehicles", response_model=List[VehicleResponse])
def get_my_vehicles(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách xe của user hiện tại"""
    vehicles = session.exec(
        select(Vehicle)
        .where(Vehicle.user_id == current_user.id)
        .order_by(Vehicle.created_at.desc())
    ).all()
    
    return vehicles

@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Lấy thông tin chi tiết một xe"""
    vehicle = session.get(Vehicle, vehicle_id)
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # User chỉ xem được xe của mình, admin xem được tất cả
    if vehicle.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return vehicle

@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    vehicle_data: VehicleUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """User cập nhật thông tin xe của mình"""
    vehicle = session.get(Vehicle, vehicle_id)
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    if vehicle.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Không cho phép cập nhật nếu đã được approve
    if vehicle.status == VehicleStatus.ACTIVE:
        raise HTTPException(
            status_code=400, 
            detail="Cannot update approved vehicle. Please contact admin."
        )
    
    # Cập nhật thông tin
    update_data = vehicle_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vehicle, key, value)
    
    vehicle.updated_at = datetime.utcnow()
    
    session.add(vehicle)
    session.commit()
    session.refresh(vehicle)
    
    return vehicle

@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """User xóa xe của mình"""
    vehicle = session.get(Vehicle, vehicle_id)
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    if vehicle.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    session.delete(vehicle)
    session.commit()
    
    return {"message": "Vehicle deleted successfully"}

# Admin endpoints
@router.get("/admin/all", response_model=List[VehicleWithUserResponse])
def get_all_vehicles(
    status: Optional[VehicleStatus] = None,
    vehicle_type: Optional[VehicleType] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user)
):
    """Admin lấy danh sách tất cả xe với filter"""
    query = select(Vehicle, User).join(User, Vehicle.user_id == User.id)
    
    # Filters
    if status:
        query = query.where(Vehicle.status == status)
    
    if vehicle_type:
        query = query.where(Vehicle.vehicle_type == vehicle_type)
    
    if search:
        query = query.where(
            or_(
                Vehicle.license_plate.ilike(f"%{search}%"),
                Vehicle.make.ilike(f"%{search}%"),
                Vehicle.model.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )
    
    query = query.order_by(Vehicle.created_at.desc()).offset(skip).limit(limit)
    
    results = session.exec(query).all()
    
    # Combine vehicle and user data
    vehicles_with_users = []
    for vehicle, user in results:
        vehicle_dict = vehicle.model_dump()
        vehicle_dict["user_full_name"] = user.full_name
        vehicle_dict["user_email"] = user.email
        vehicle_dict["user_apartment"] = user.apartment_number
        vehicle_dict["user_building"] = user.building
        
        # Get approver name if exists
        if vehicle.approved_by:
            approver = session.get(User, vehicle.approved_by)
            vehicle_dict["approver_name"] = approver.full_name if approver else None
        
        vehicles_with_users.append(VehicleWithUserResponse(**vehicle_dict))
    
    return vehicles_with_users

@router.get("/admin/stats", response_model=VehicleStats)
def get_vehicle_stats(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user)
):
    """Admin lấy thống kê xe"""
    total = session.exec(select(func.count(Vehicle.id))).one()
    
    pending = session.exec(
        select(func.count(Vehicle.id)).where(Vehicle.status == VehicleStatus.PENDING)
    ).one()
    
    active = session.exec(
        select(func.count(Vehicle.id)).where(Vehicle.status == VehicleStatus.ACTIVE)
    ).one()
    
    expired = session.exec(
        select(func.count(Vehicle.id)).where(Vehicle.status == VehicleStatus.EXPIRED)
    ).one()
    
    rejected = session.exec(
        select(func.count(Vehicle.id)).where(Vehicle.status == VehicleStatus.REJECTED)
    ).one()
    
    # By type
    by_type = {}
    for vtype in VehicleType:
        count = session.exec(
            select(func.count(Vehicle.id)).where(Vehicle.vehicle_type == vtype)
        ).one()
        by_type[vtype.value] = count
    
    return VehicleStats(
        total=total,
        pending=pending,
        active=active,
        expired=expired,
        rejected=rejected,
        by_type=by_type
    )

@router.post("/admin/{vehicle_id}/approve", response_model=VehicleResponse)
def approve_or_reject_vehicle(
    vehicle_id: int,
    approval_data: VehicleApproval,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user)
):
    """Admin approve hoặc reject xe"""
    vehicle = session.get(Vehicle, vehicle_id)
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Cập nhật status
    vehicle.status = approval_data.status
    vehicle.approved_by = current_user.id
    vehicle.approved_at = datetime.utcnow()
    vehicle.updated_at = datetime.utcnow()
    
    if approval_data.status == VehicleStatus.ACTIVE:
        # Nếu approve, gán parking spot nếu có
        if approval_data.parking_spot:
            vehicle.parking_spot = approval_data.parking_spot
        # Set expiry date nếu chưa có
        if not vehicle.expires_at:
            vehicle.expires_at = datetime.utcnow() + timedelta(days=365)
    elif approval_data.status == VehicleStatus.REJECTED:
        # Nếu reject, lưu lý do
        vehicle.rejection_reason = approval_data.rejection_reason
        vehicle.parking_spot = None
    
    session.add(vehicle)
    session.commit()
    session.refresh(vehicle)
    
    return vehicle

@router.put("/admin/{vehicle_id}/parking", response_model=VehicleResponse)
def update_parking_spot(
    vehicle_id: int,
    parking_spot: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user)
):
    """Admin cập nhật parking spot"""
    vehicle = session.get(Vehicle, vehicle_id)
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    vehicle.parking_spot = parking_spot
    vehicle.updated_at = datetime.utcnow()
    
    session.add(vehicle)
    session.commit()
    session.refresh(vehicle)
    
    return vehicle
