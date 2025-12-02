"""
Bill Generation Service
Tạo hóa đơn tự động với Pro-rata calculation
"""
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Dict
from sqlmodel import Session, select

from app.models.apartment import Apartment, ApartmentStatus
from app.models.bill import Bill, BillType, BillStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.price_history import PriceType
from app.core.utils import calculate_prorated_amount, is_full_month, get_billing_period
from app.services.price_calculator import get_current_price


def generate_management_fee_bill(
    session: Session,
    apartment: Apartment,
    billing_month: date,
    commit: bool = True
) -> Bill:
    """
    Tạo hóa đơn phí quản lý (có áp dụng Pro-rata)
    
    Args:
        session: Database session
        apartment: Apartment object
        billing_month: Tháng tính phí (thường là ngày cuối tháng)
        commit: Tự động commit hay không
    
    Returns:
        Bill: Hóa đơn phí quản lý
    """
    if apartment.resident_id is None:
        raise ValueError(f"Căn hộ {apartment.apartment_number} không có cư dân")
    
    # 1. Lấy đơn giá phí quản lý/m²
    unit_price = get_current_price(
        session=session,
        price_type=PriceType.MANAGEMENT_FEE_PER_M2,
        reference_id=None,
        effective_date=datetime.combine(billing_month, datetime.min.time())
    )
    
    if unit_price is None:
        raise ValueError("Không tìm thấy đơn giá phí quản lý/m²")
    
    # 2. Tính phí quản lý trọn gói 1 tháng
    monthly_fee = unit_price * Decimal(str(apartment.area))
    
    # 3. Áp dụng Pro-rata nếu chuyển vào giữa tháng
    amount = calculate_prorated_amount(
        monthly_fee=monthly_fee,
        billing_date=billing_month,
        move_in_date=apartment.move_in_date
    )
    
    # 4. Kiểm tra xem có tính Pro-rata không
    is_prorated = not is_full_month(apartment.move_in_date, billing_month) if apartment.move_in_date else False
    
    # 5. Tạo description chi tiết
    description = f"Căn hộ {apartment.apartment_number} - {apartment.area}m² × {unit_price:,}đ/m²"
    if is_prorated and apartment.move_in_date:
        _, num_days = get_billing_period(billing_month)
        days_used = (num_days - apartment.move_in_date).days + 1
        description += f"\n⏱️ Tính theo tỷ lệ: Chuyển vào {apartment.move_in_date.strftime('%d/%m/%Y')}"
    
    # 6. Tạo Bill
    bill = Bill(
        bill_number=f"MF-{apartment.apartment_number}-{billing_month.strftime('%Y%m')}",
        user_id=apartment.resident_id,
        bill_type=BillType.MANAGEMENT_FEE,
        title=f"Phí quản lý tháng {billing_month.month}/{billing_month.year}",
        description=description,
        amount=amount,
        due_date=billing_month + timedelta(days=15),
        status=BillStatus.PENDING,
        is_prorated=is_prorated,  # Đánh dấu Pro-rata
        created_at=datetime.utcnow()
    )
    
    session.add(bill)
    
    if commit:
        session.commit()
        session.refresh(bill)
    
    return bill


def generate_parking_fee_bill(
    session: Session,
    apartment: Apartment,
    vehicle: Vehicle,
    billing_month: date,
    commit: bool = True
) -> Bill:
    """
    Tạo hóa đơn phí gửi xe (có áp dụng Pro-rata)
    
    Args:
        session: Database session
        apartment: Apartment object
        vehicle: Vehicle object
        billing_month: Tháng tính phí
        commit: Tự động commit hay không
    
    Returns:
        Bill: Hóa đơn phí gửi xe
    """
    # Map vehicle_type sang PriceType
    price_type_map = {
        "car": PriceType.PARKING_CAR,
        "motorcycle": PriceType.PARKING_MOTOR,
        "bicycle": PriceType.PARKING_BICYCLE,
    }
    
    price_type = price_type_map.get(vehicle.vehicle_type.value)
    if price_type is None:
        raise ValueError(f"Loại xe không hợp lệ: {vehicle.vehicle_type}")
    
    # 1. Lấy giá gửi xe tháng
    monthly_fee = get_current_price(
        session=session,
        price_type=price_type,
        reference_id=None,
        effective_date=datetime.combine(billing_month, datetime.min.time())
    )
    
    if monthly_fee is None:
        raise ValueError(f"Không tìm thấy giá gửi xe {vehicle.vehicle_type}")
    
    # 2. Áp dụng Pro-rata
    amount = calculate_prorated_amount(
        monthly_fee=monthly_fee,
        billing_date=billing_month,
        move_in_date=apartment.move_in_date
    )
    
    is_prorated = not is_full_month(apartment.move_in_date, billing_month) if apartment.move_in_date else False
    
    # 3. Tạo description
    vehicle_name = {
        "car": "ô tô",
        "motorcycle": "xe máy",
        "bicycle": "xe đạp"
    }.get(vehicle.vehicle_type.value, vehicle.vehicle_type.value)
    
    description = f"Gửi {vehicle_name} - Biển số: {vehicle.license_plate}"
    
    # 4. Tạo Bill
    bill = Bill(
        bill_number=f"PK-{vehicle.vehicle_type.value.upper()}-{apartment.apartment_number}-{billing_month.strftime('%Y%m')}",
        user_id=apartment.resident_id,
        bill_type=BillType.PARKING,
        title=f"Phí gửi xe tháng {billing_month.month}/{billing_month.year}",
        description=description,
        amount=amount,
        due_date=billing_month + timedelta(days=15),
        status=BillStatus.PENDING,
        is_prorated=is_prorated,  # Đánh dấu Pro-rata
        created_at=datetime.utcnow()
    )
    
    session.add(bill)
    
    if commit:
        session.commit()
        session.refresh(bill)
    
    return bill


def generate_monthly_bills_for_all(
    session: Session,
    billing_month: Optional[date] = None,
    include_parking: bool = True
) -> Dict[str, any]:
    """
    Tạo tất cả hóa đơn cho tháng (Management Fee + Parking Fee)
    
    Args:
        session: Database session
        billing_month: Tháng tính phí (mặc định là cuối tháng hiện tại)
        include_parking: Có tạo bill gửi xe không
    
    Returns:
        Dict: Thống kê số lượng bills đã tạo
    """
    # Nếu không truyền billing_month, lấy cuối tháng hiện tại
    if billing_month is None:
        today = date.today()
        import calendar
        _, num_days = calendar.monthrange(today.year, today.month)
        billing_month = date(today.year, today.month, num_days)
    
    # Lấy tất cả căn hộ đang OCCUPIED
    stmt = select(Apartment).where(Apartment.status == ApartmentStatus.OCCUPIED)
    apartments = session.exec(stmt).all()
    
    stats = {
        "total_apartments": len(apartments),
        "management_bills_created": 0,
        "parking_bills_created": 0,
        "total_amount": Decimal("0.00"),
        "errors": []
    }
    
    for apt in apartments:
        if apt.resident_id is None:
            stats["errors"].append(f"Căn {apt.apartment_number}: Không có cư dân")
            continue
        
        try:
            # 1. Tạo hóa đơn phí quản lý
            mgmt_bill = generate_management_fee_bill(
                session=session,
                apartment=apt,
                billing_month=billing_month,
                commit=False  # Commit tất cả cùng lúc ở cuối
            )
            stats["management_bills_created"] += 1
            stats["total_amount"] += mgmt_bill.amount
            
            # 2. Tạo hóa đơn phí gửi xe (nếu có xe đăng ký)
            if include_parking:
                vehicle_stmt = select(Vehicle).where(
                    Vehicle.user_id == apt.resident_id,
                    Vehicle.status == VehicleStatus.ACTIVE
                )
                vehicles = session.exec(vehicle_stmt).all()
                
                for vehicle in vehicles:
                    try:
                        parking_bill = generate_parking_fee_bill(
                            session=session,
                            apartment=apt,
                            vehicle=vehicle,
                            billing_month=billing_month,
                            commit=False
                        )
                        stats["parking_bills_created"] += 1
                        stats["total_amount"] += parking_bill.amount
                    except Exception as e:
                        stats["errors"].append(f"Căn {apt.apartment_number} - Xe {vehicle.license_plate}: {str(e)}")
        
        except Exception as e:
            stats["errors"].append(f"Căn {apt.apartment_number}: {str(e)}")
    
    # Commit tất cả bills cùng lúc
    try:
        session.commit()
    except Exception as e:
        session.rollback()
        raise Exception(f"Lỗi khi lưu hóa đơn: {str(e)}")
    
    return stats


def generate_bills_for_apartment(
    session: Session,
    apartment_id: int,
    billing_month: Optional[date] = None
) -> List[Bill]:
    """
    Tạo tất cả hóa đơn cho 1 căn hộ cụ thể
    
    Args:
        session: Database session
        apartment_id: ID căn hộ
        billing_month: Tháng tính phí
    
    Returns:
        List[Bill]: Danh sách bills đã tạo
    """
    apartment = session.get(Apartment, apartment_id)
    if not apartment:
        raise ValueError(f"Không tìm thấy căn hộ ID={apartment_id}")
    
    if apartment.status != ApartmentStatus.OCCUPIED:
        raise ValueError(f"Căn hộ {apartment.apartment_number} không có người ở")
    
    if apartment.resident_id is None:
        raise ValueError(f"Căn hộ {apartment.apartment_number} không có cư dân")
    
    # Nếu không truyền billing_month, lấy cuối tháng hiện tại
    if billing_month is None:
        today = date.today()
        import calendar
        _, num_days = calendar.monthrange(today.year, today.month)
        billing_month = date(today.year, today.month, num_days)
    
    bills = []
    
    # 1. Phí quản lý
    mgmt_bill = generate_management_fee_bill(
        session=session,
        apartment=apartment,
        billing_month=billing_month,
        commit=False
    )
    bills.append(mgmt_bill)
    
    # 2. Phí gửi xe
    vehicle_stmt = select(Vehicle).where(
        Vehicle.user_id == apartment.resident_id,
        Vehicle.status == VehicleStatus.ACTIVE
    )
    vehicles = session.exec(vehicle_stmt).all()
    
    for vehicle in vehicles:
        parking_bill = generate_parking_fee_bill(
            session=session,
            apartment=apartment,
            vehicle=vehicle,
            billing_month=billing_month,
            commit=False
        )
        bills.append(parking_bill)
    
    # Commit
    session.commit()
    for bill in bills:
        session.refresh(bill)
    
    return bills
