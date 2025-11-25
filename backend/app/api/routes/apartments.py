from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func
from typing import List, Optional
import secrets
import string
from app.core.database import get_session
from app.api.dependencies import get_current_admin_user
from app.models.apartment import Apartment, ApartmentStatus
from app.models.user import User, UserRole
from app.schemas.apartment import (
    ApartmentResponse,
    ApartmentCreate,
    ApartmentUpdate,
    ApartmentWithResident,
    ApartmentRegisterUser,
    ApartmentAssignUser
)
from app.core.security import get_password_hash

router = APIRouter()

def generate_password(length: int = 12) -> str:
    """Tạo mật khẩu ngẫu nhiên"""
    characters = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(secrets.choice(characters) for _ in range(length))
    return password

@router.get("/", response_model=List[ApartmentWithResident])
async def get_apartments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    building: Optional[str] = None,
    status: Optional[ApartmentStatus] = None,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Lấy danh sách căn hộ (admin only)"""
    statement = select(Apartment)
    
    if building:
        statement = statement.where(Apartment.building == building)
    if status:
        statement = statement.where(Apartment.status == status)
    
    statement = statement.offset(skip).limit(limit)
    apartments = session.exec(statement).all()
    
    # Thêm thông tin resident
    result = []
    for apt in apartments:
        apt_dict = apt.model_dump()
        if apt.resident_id:
            resident = session.get(User, apt.resident_id)
            if resident:
                apt_dict["resident"] = {
                    "id": resident.id,
                    "username": resident.username,
                    "full_name": resident.full_name,
                    "email": resident.email,
                    "phone": resident.phone,
                    "occupier": resident.occupier
                }
        result.append(apt_dict)
    
    return result

@router.post("/", response_model=ApartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_apartment(
    apartment: ApartmentCreate,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Tạo căn hộ mới (admin only)"""
    # Kiểm tra xem căn hộ đã tồn tại chưa
    existing = session.exec(
        select(Apartment).where(Apartment.apartment_number == apartment.apartment_number)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Apartment {apartment.apartment_number} already exists"
        )
    
    new_apartment = Apartment(**apartment.model_dump())
    session.add(new_apartment)
    session.commit()
    session.refresh(new_apartment)
    
    return new_apartment

@router.get("/{apartment_id}", response_model=ApartmentWithResident)
async def get_apartment(
    apartment_id: int,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Lấy thông tin căn hộ (admin only)"""
    apartment = session.get(Apartment, apartment_id)
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apartment not found"
        )
    
    apt_dict = apartment.model_dump()
    if apartment.resident_id:
        resident = session.get(User, apartment.resident_id)
        if resident:
            apt_dict["resident"] = {
                "id": resident.id,
                "username": resident.username,
                "full_name": resident.full_name,
                "email": resident.email,
                "phone": resident.phone
            }
    
    return apt_dict

@router.put("/{apartment_id}", response_model=ApartmentResponse)
async def update_apartment(
    apartment_id: int,
    apartment_update: ApartmentUpdate,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Cập nhật thông tin căn hộ (admin only)"""
    apartment = session.get(Apartment, apartment_id)
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apartment not found"
        )
    
    update_data = apartment_update.model_dump(exclude_unset=True)
    
    # Xử lý is_maintenance để chuyển thành status
    if 'is_maintenance' in update_data:
        is_maintenance = update_data.pop('is_maintenance')
        if is_maintenance:
            update_data['status'] = ApartmentStatus.MAINTENANCE
        else:
            # Nếu không phải bảo trì, kiểm tra có cư dân không
            if apartment.resident_id:
                update_data['status'] = ApartmentStatus.OCCUPIED
            else:
                update_data['status'] = ApartmentStatus.AVAILABLE
    
    for field, value in update_data.items():
        setattr(apartment, field, value)
    
    from datetime import datetime
    apartment.updated_at = datetime.utcnow()
    
    session.add(apartment)
    session.commit()
    session.refresh(apartment)
    
    return apartment

@router.delete("/{apartment_id}")
async def delete_apartment(
    apartment_id: int,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Xóa căn hộ (admin only)"""
    apartment = session.get(Apartment, apartment_id)
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apartment not found"
        )
    
    if apartment.resident_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete apartment with resident. Remove resident first."
        )
    
    session.delete(apartment)
    session.commit()
    
    return {"message": "Apartment deleted successfully"}

@router.post("/{apartment_id}/register-resident")
async def register_resident(
    apartment_id: int,
    user_data: ApartmentRegisterUser,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Đăng ký cư dân mới cho căn hộ (admin only)
    
    - Tạo tài khoản với username là số căn hộ
    - Mật khẩu có thể tự động sinh hoặc do admin cung cấp
    - Liên kết user với căn hộ
    """
    # Kiểm tra căn hộ
    apartment = session.get(Apartment, apartment_id)
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apartment not found"
        )
    
    if apartment.status == ApartmentStatus.OCCUPIED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apartment is already occupied"
        )
    
    # Kiểm tra email đã tồn tại
    existing_user = session.exec(
        select(User).where(User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Kiểm tra username (số căn hộ) đã tồn tại
    username = apartment.apartment_number
    existing_username = session.exec(
        select(User).where(User.username == username)
    ).first()
    
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username {username} already exists"
        )
    
    # Tạo mật khẩu
    password = user_data.password if user_data.password else generate_password()
    
    # Tạo user mới
    new_user = User(
        username=username,
        email=user_data.email,
        hashed_password=get_password_hash(password),
        full_name=user_data.full_name,
        phone=user_data.phone,
        role=UserRole.USER,
        apartment_number=apartment.apartment_number,
        building=apartment.building,
        is_active=True
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    # Cập nhật căn hộ
    apartment.resident_id = new_user.id
    apartment.status = ApartmentStatus.OCCUPIED
    from datetime import datetime
    apartment.updated_at = datetime.utcnow()
    
    session.add(apartment)
    session.commit()
    session.refresh(apartment)
    
    return {
        "message": "Resident registered successfully",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "apartment_number": new_user.apartment_number,
            "building": new_user.building
        },
        "credentials": {
            "username": username,
            "password": password  # Trả về mật khẩu để admin có thể thông báo cho cư dân
        }
    }

@router.post("/{apartment_id}/assign-user")
async def assign_user_to_apartment(
    apartment_id: int,
    *,
    user_id: int,
    occupier_type: str,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Gán user có sẵn vào căn hộ với phân loại owner/renter (admin only)
    
    Body: {
        "user_id": int,
        "occupier_type": "owner" | "renter"
    }
    """
    # Kiểm tra căn hộ
    apartment = session.get(Apartment, apartment_id)
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apartment not found"
        )
    
    if apartment.status == ApartmentStatus.OCCUPIED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apartment is already occupied"
        )
    
    # Kiểm tra user
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Kiểm tra user đã có căn hộ chưa
    if user.apartment_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User already assigned to apartment {user.apartment_number}"
        )
    
    # Kiểm tra occupier_type hợp lệ
    from app.models.user import OccupierType
    if occupier_type not in [OccupierType.OWNER, OccupierType.RENTER]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid occupier type. Must be 'owner' or 'renter'"
        )
    
    # Cập nhật user
    user.apartment_number = apartment.apartment_number
    user.building = apartment.building
    user.occupier = occupier_type
    
    session.add(user)
    
    # Cập nhật căn hộ
    apartment.resident_id = user.id
    apartment.status = ApartmentStatus.OCCUPIED
    from datetime import datetime
    apartment.updated_at = datetime.utcnow()
    
    session.add(apartment)
    session.commit()
    session.refresh(apartment)
    session.refresh(user)
    
    return {
        "message": "User assigned successfully",
        "apartment": {
            "id": apartment.id,
            "apartment_number": apartment.apartment_number,
            "building": apartment.building,
            "status": apartment.status
        },
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "occupier": user.occupier
        }
    }

@router.delete("/{apartment_id}/remove-resident")
async def remove_resident(
    apartment_id: int,
    delete_user: bool = Query(False, description="Xóa luôn tài khoản user"),
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Xóa cư dân khỏi căn hộ (admin only)"""
    apartment = session.get(Apartment, apartment_id)
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apartment not found"
        )
    
    if not apartment.resident_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apartment has no resident"
        )
    
    resident_id = apartment.resident_id
    
    # Xóa liên kết
    apartment.resident_id = None
    apartment.status = ApartmentStatus.AVAILABLE
    from datetime import datetime
    apartment.updated_at = datetime.utcnow()
    
    session.add(apartment)
    
    # Xóa user nếu được yêu cầu
    if delete_user:
        resident = session.get(User, resident_id)
        if resident:
            session.delete(resident)
    else:
        # Chỉ cập nhật thông tin user (reset apartment info và occupier)
        resident = session.get(User, resident_id)
        if resident:
            resident.apartment_number = None
            resident.building = None
            resident.occupier = None
            session.add(resident)
    
    session.commit()
    
    return {
        "message": "Resident removed successfully",
        "user_deleted": delete_user
    }

@router.get("/buildings/list")
async def get_buildings(
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Lấy danh sách các tòa nhà"""
    buildings = session.exec(
        select(Apartment.building).distinct()
    ).all()
    
    return {"buildings": list(buildings)}

@router.get("/stats/overview")
async def get_apartment_stats(
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Thống kê tổng quan căn hộ"""
    total = session.exec(select(func.count(Apartment.id))).one()
    occupied = session.exec(
        select(func.count(Apartment.id)).where(Apartment.status == ApartmentStatus.OCCUPIED)
    ).one()
    available = session.exec(
        select(func.count(Apartment.id)).where(Apartment.status == ApartmentStatus.AVAILABLE)
    ).one()
    maintenance = session.exec(
        select(func.count(Apartment.id)).where(Apartment.status == ApartmentStatus.MAINTENANCE)
    ).one()
    
    return {
        "total": total,
        "occupied": occupied,
        "available": available,
        "maintenance": maintenance,
        "occupancy_rate": round((occupied / total * 100) if total > 0 else 0, 2)
    }
