"""
Service Price Calculator
Tính toán giá dịch vụ dựa trên đơn vị tính (ServiceUnit)
"""
from decimal import Decimal
from typing import Optional
from datetime import datetime
from sqlmodel import Session, select, desc

from app.models.service import Service, ServiceUnit
from app.models.price_history import PriceHistory, PriceType
from app.models.apartment import Apartment


def get_current_price(
    session: Session,
    price_type: PriceType,
    reference_id: Optional[int] = None,
    effective_date: Optional[datetime] = None
) -> Optional[Decimal]:
    """
    Lấy giá hiện tại từ bảng price_histories
    
    Args:
        session: Database session
        price_type: Loại giá (SERVICE, PARKING_CAR, etc.)
        reference_id: ID tham chiếu (service_id nếu là SERVICE)
        effective_date: Ngày áp dụng (mặc định là hiện tại)
    
    Returns:
        Decimal: Giá hiện tại hoặc None nếu không tìm thấy
    """
    if effective_date is None:
        effective_date = datetime.utcnow()
    
    query = select(PriceHistory).where(
        PriceHistory.type == price_type,
        PriceHistory.effective_from <= effective_date
    )
    
    if reference_id is not None:
        query = query.where(PriceHistory.reference_id == reference_id)
    else:
        query = query.where(PriceHistory.reference_id.is_(None))
    
    query = query.order_by(desc(PriceHistory.effective_from))
    
    result = session.exec(query).first()
    return result.price if result else None


def calculate_service_price(
    service: Service,
    quantity: int,
    session: Session,
    apartment_area: Optional[Decimal] = None,
    effective_date: Optional[datetime] = None
) -> Decimal:
    """
    Tính toán giá dịch vụ dựa trên đơn vị tính
    
    Logic tính toán:
    - PER_HOUR: Giá x Số giờ
    - PER_M2: Giá x Diện tích căn hộ (cần apartment_area)
    - PER_MONTH: Giá x Số tháng
    - PER_JOB: Giá cố định (quantity thường = 1)
    - PER_PACKAGE: Giá x Số gói
    - PER_SLOT: Giá x Số slot
    - PER_VEHICLE: Giá x Số xe
    - PER_UNIT: Giá x Số lượng (kg, bình, etc.)
    
    Args:
        service: Service object
        quantity: Số lượng (giờ/tháng/gói/slot/xe/đơn vị)
        session: Database session
        apartment_area: Diện tích căn hộ (bắt buộc nếu unit = PER_M2)
        effective_date: Ngày áp dụng giá (mặc định là hiện tại)
    
    Returns:
        Decimal: Tổng tiền
    
    Raises:
        ValueError: Nếu thiếu thông tin hoặc không tìm thấy giá
    """
    # Lấy giá hiện tại từ price_histories
    unit_price = get_current_price(
        session=session,
        price_type=PriceType.SERVICE,
        reference_id=service.id,
        effective_date=effective_date
    )
    
    if unit_price is None:
        raise ValueError(f"Không tìm thấy giá cho dịch vụ {service.name} (ID: {service.id})")
    
    # Tính toán dựa trên đơn vị
    if service.unit == ServiceUnit.PER_M2:
        if apartment_area is None:
            raise ValueError(f"Dịch vụ '{service.name}' tính theo m² nhưng không có thông tin diện tích căn hộ")
        total = unit_price * apartment_area
    
    elif service.unit == ServiceUnit.PER_JOB:
        # Phí theo vụ việc thường là giá cố định
        total = unit_price
    
    else:
        # Các trường hợp còn lại: nhân giá với số lượng
        # PER_HOUR, PER_MONTH, PER_PACKAGE, PER_SLOT, PER_VEHICLE, PER_UNIT
        total = unit_price * Decimal(quantity)
    
    return total


def calculate_parking_fee(
    session: Session,
    vehicle_type: str,  # "car", "motorcycle", "bicycle"
    quantity: int = 1,
    effective_date: Optional[datetime] = None
) -> Decimal:
    """
    Tính phí gửi xe dựa trên loại xe
    
    Args:
        session: Database session
        vehicle_type: Loại xe ("car", "motorcycle", "bicycle")
        quantity: Số lượng xe (mặc định = 1)
        effective_date: Ngày áp dụng giá
    
    Returns:
        Decimal: Phí gửi xe
    
    Raises:
        ValueError: Nếu loại xe không hợp lệ hoặc không tìm thấy giá
    """
    # Map vehicle_type sang PriceType
    price_type_map = {
        "car": PriceType.PARKING_CAR,
        "motorcycle": PriceType.PARKING_MOTOR,
        "bicycle": PriceType.PARKING_BICYCLE,
    }
    
    price_type = price_type_map.get(vehicle_type.lower())
    if price_type is None:
        raise ValueError(f"Loại xe không hợp lệ: {vehicle_type}")
    
    unit_price = get_current_price(
        session=session,
        price_type=price_type,
        reference_id=None,
        effective_date=effective_date
    )
    
    if unit_price is None:
        raise ValueError(f"Không tìm thấy giá cho loại xe: {vehicle_type}")
    
    return unit_price * Decimal(quantity)


def calculate_management_fee(
    session: Session,
    apartment: Apartment,
    effective_date: Optional[datetime] = None
) -> Decimal:
    """
    Tính phí quản lý dựa trên diện tích căn hộ
    
    Công thức: Diện tích (m²) x Đơn giá quản lý (/m²)
    
    Args:
        session: Database session
        apartment: Apartment object
        effective_date: Ngày áp dụng giá
    
    Returns:
        Decimal: Phí quản lý
    
    Raises:
        ValueError: Nếu không tìm thấy giá
    """
    unit_price = get_current_price(
        session=session,
        price_type=PriceType.MANAGEMENT_FEE_PER_M2,
        reference_id=None,
        effective_date=effective_date
    )
    
    if unit_price is None:
        raise ValueError("Không tìm thấy giá phí quản lý/m²")
    
    return unit_price * apartment.area


# HELPER: Format display text cho đơn vị
UNIT_DISPLAY_MAP = {
    ServiceUnit.PER_HOUR: "giờ",
    ServiceUnit.PER_M2: "m²",
    ServiceUnit.PER_MONTH: "tháng",
    ServiceUnit.PER_JOB: "lần",
    ServiceUnit.PER_PACKAGE: "gói",
    ServiceUnit.PER_SLOT: "slot",
    ServiceUnit.PER_VEHICLE: "xe",
    ServiceUnit.PER_UNIT: "đơn vị",
}

def get_unit_display_text(unit: ServiceUnit) -> str:
    """Lấy text hiển thị cho đơn vị tính"""
    return UNIT_DISPLAY_MAP.get(unit, str(unit.value))
