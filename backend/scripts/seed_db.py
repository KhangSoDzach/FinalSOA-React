import sys
import os
from datetime import datetime, date, time, timedelta
from decimal import Decimal
from enum import Enum
from sqlmodel import Session, create_engine, select

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import settings
from app.models.user import User, UserRole, OccupierType
from app.models.bill import Bill, BillType, BillStatus
from app.models.service import Service, ServiceCategory, ServiceStatus, ServiceBooking, BookingStatus, ServiceUnit
from app.models.notification import Notification, NotificationType, NotificationStatus
from app.models.ticket import Ticket, TicketCategory, TicketPriority, TicketStatus
from app.models.apartment import Apartment, ApartmentStatus
from app.models.vehicle import Vehicle, VehicleType, VehicleStatus
from app.models.price_history import PriceHistory, PriceType
from app.core.security import get_password_hash


engine = create_engine(str(settings.database_url))

def create_users():
    users = [
        # Staff accounts
        User(
            username="manager",
            email="manager@apartment.com",
            hashed_password=get_password_hash("123456"),
            full_name="Nguyễn Văn Quản Lý",
            role=UserRole.MANAGER,
            is_active=True,
            balance=Decimal("2000000.00"),  
            created_at=datetime.now(),
            occupier=OccupierType.OWNER
        ),
        User(
            username="accountant",
            email="accountant@apartment.com",
            hashed_password=get_password_hash("123456"),
            full_name="Trần Thị Kế Toán",
            role=UserRole.ACCOUNTANT,
            is_active=True,
            balance=Decimal("2500000.00"),  
            created_at=datetime.now(),
            occupier=OccupierType.OWNER
        ),
        User(
            username="receptionist",
            email="receptionist@apartment.com",
            hashed_password=get_password_hash("123456"),
            full_name="Lê Thị Lễ Tân",
            role=UserRole.RECEPTIONIST,
            is_active=True,
            balance=Decimal("1800000.00"),  
            created_at=datetime.now(),
            occupier=OccupierType.OWNER
        ),
        # Regular user accounts
        User(
            username="user001",
            email="vamila2710@gmail.com",
            hashed_password=get_password_hash("123123"),
            full_name="Nguyễn Văn A",
            phone="0901234567",
            role=UserRole.USER,
            apartment_number="A101",
            building="A",
            is_active=True,
            balance=Decimal("5000000.00"),  
            created_at=datetime.now(),
            occupier=OccupierType.OWNER
        ),
        User(
            username="user002",
            email="lexa61313@gmail.com",
            hashed_password=get_password_hash("123456"),
            full_name="Đặng Bảo Khang", 
            phone="0901234568",
            role=UserRole.USER,
            apartment_number="B101",
            building="B",
            is_active=True,
            balance=Decimal("50000000.00"),  
            created_at=datetime.now(),
            occupier=OccupierType.OWNER
        ),
        User(
        username="user003",
        email="user003@apartment.com",
        hashed_password=get_password_hash("123456"),
        full_name="Lê Văn C", 
        phone="0901234569",
        role=UserRole.USER,
        apartment_number="A202",
        building="A",
        is_active=True,
        balance=Decimal("1250000.00"), 
        created_at=datetime.now(),
        occupier=OccupierType.OWNER
        ),
        User(
            username="user004",
            email="user004@apartment.com",
            hashed_password=get_password_hash("123456"),
            full_name="Phạm Thị D", 
            phone="0901234570",
            role=UserRole.USER,
            apartment_number="A305",
            building="A",
            is_active=True,
            balance=Decimal("0.00"), 
            created_at=datetime.now(),
            occupier=OccupierType.RENTER
        ),
        User(
            username="user005",
            email="user005@apartment.com",
            hashed_password=get_password_hash("123456"),
            full_name="Hoàng Đình E", 
            phone="0901234571",
            role=UserRole.USER,
            apartment_number="B203",
            building="B",
            is_active=True,
            balance=Decimal("7800000.00"), 
            created_at=datetime.now(),
            occupier=OccupierType.OWNER
        ),
        User(
            username="user006",
            email="user006@apartment.com",
            hashed_password=get_password_hash("123456"),
            full_name="Võ Văn F", 
            phone="0901234572",
            role=UserRole.USER,
            apartment_number="B404",
            building="B",
            is_active=False,  
            balance=Decimal("300000.00"), 
            created_at=datetime.now(),
            occupier=OccupierType.RENTER
        ),
    ]
    return users
    
def create_tickets(users):
    tickets = [
        Ticket(
            user_id=users[2].id, 
            title="Sửa chữa vòi nước bị rò rỉ khẩn cấp",
            description="Vòi nước trong nhà vệ sinh căn hộ A101 bị rò rỉ lớn, cần thợ đến ngay lập tức.",
            category=TicketCategory.MAINTENANCE,
            priority=TicketPriority.URGENT, 
            status=TicketStatus.OPEN,
        ),
        Ticket(
            user_id=users[2].id, 
            title="Phản ánh tiếng ồn từ căn hộ B202",
            description="Căn hộ B202 thường xuyên gây tiếng ồn lớn vào ban đêm sau 10 giờ tối.",
            category=TicketCategory.NOISE,
            priority=TicketPriority.HIGH,
            status=TicketStatus.IN_PROGRESS,
            assigned_to=users[1].id, 
        ),
        Ticket(
            user_id=users[2].id, 
            title="Yêu cầu vệ sinh hành lang Tầng 1",
            description="Hành lang tầng 1 tòa nhà A có vết bẩn, cần được dọn dẹp.",
            category=TicketCategory.CLEANING,
            priority=TicketPriority.LOW,
            status=TicketStatus.RESOLVED,
            assigned_to=users[1].id,
            resolved_by=users[1].id,
            resolution_notes="Đã cử nhân viên vệ sinh dọn dẹp và xác nhận hoàn thành.",
            resolved_at=datetime.now(),
        ),
        Ticket(
            user_id=users[2].id, 
            title="Đề xuất lắp đặt thêm ghế đá công viên",
            description="Khu vực công viên cần thêm ghế đá để cư dân có thể ngồi nghỉ ngơi thoải mái hơn.",
            category=TicketCategory.SUGGESTION,
            priority=TicketPriority.NORMAL,
            status=TicketStatus.OPEN,
        ),
        Ticket(
            user_id=users[3].id, 
            title="Lỗi khóa cửa ra vào",
            description="Khóa cửa căn hộ B202 bị kẹt, không thể mở được. Đã được sửa chữa.",
            category=TicketCategory.MAINTENANCE,
            priority=TicketPriority.HIGH,
            status=TicketStatus.CLOSED,
            assigned_to=users[1].id,
            resolved_by=users[1].id,
            resolution_notes="Đã thay thế ổ khóa mới, cư dân xác nhận hoạt động bình thường.",
            resolved_at=datetime.now() - timedelta(hours=72),
        ),
    ]
    return tickets
    
# HÀM MỚI: Tạo Service và Booking cùng lúc
def create_services_and_bookings(users, session):
    """
    Tạo các dịch vụ theo phân loại thực tế:
    - Dọn dẹp: per_hour, per_package
    - Sửa chữa: per_job
    - Giao hàng: per_unit
    - Tiện ích: per_hour, per_slot
    """
    services = [
        # ========== DỊCH VỤ DỌN DẸP (CLEANING) ==========
        # Tính theo GIỜ
        Service(
            name="Dọn dẹp căn hộ theo giờ",
            description="Dịch vụ dọn dẹp vệ sinh tiêu chuẩn: quét, lau sàn, lau bụi, vệ sinh toilet. Tính theo giờ làm việc.",
            category=ServiceCategory.CLEANING,
            unit=ServiceUnit.PER_HOUR,
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5,6]",
            provider_name="CleanPro",
            created_at=datetime.now()
        ),
        # Tính theo GÓI (Package - theo số phòng ngủ)
        Service(
            name="Gói Dọn dẹp Căn 1PN",
            description="Gói dọn dẹp trọn gói cho căn hộ 1 phòng ngủ. Bao gồm: phòng khách, bếp, 1PN, 1WC.",
            category=ServiceCategory.CLEANING,
            unit=ServiceUnit.PER_PACKAGE,
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5,6]",
            provider_name="CleanPro",
            created_at=datetime.now()
        ),
        Service(
            name="Gói Dọn dẹp Căn 2PN",
            description="Gói dọn dẹp trọn gói cho căn hộ 2 phòng ngủ. Bao gồm: phòng khách, bếp, 2PN, 1-2WC.",
            category=ServiceCategory.CLEANING,
            unit=ServiceUnit.PER_PACKAGE,
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5,6]",
            provider_name="CleanPro",
            created_at=datetime.now()
        ),
        Service(
            name="Vệ sinh Sofa & Thảm",
            description="Giặt sofa nỉ/da, giặt thảm phòng khách bằng máy chuyên dụng. Giá theo bộ.",
            category=ServiceCategory.CLEANING,
            unit=ServiceUnit.PER_UNIT,
            status=ServiceStatus.ACTIVE,
            available_days="[5,6]",  # Cuối tuần
            provider_name="Sofa Sạch",
            created_at=datetime.now()
        ),
        Service(
            name="Diệt côn trùng",
            description="Phun thuốc diệt muỗi, gián, kiến an toàn sinh học. Giá theo lần xử lý.",
            category=ServiceCategory.CLEANING,
            unit=ServiceUnit.PER_JOB,
            status=ServiceStatus.ACTIVE,
            available_days="[1,3,5]",
            provider_name="PestBuster",
            created_at=datetime.now()
        ),
        Service(
            name="Giặt ủi giao nhận tận nơi",
            description="Giặt sấy, gấp gọn. Giá tính theo kg. Giao nhận trong 24h.",
            category=ServiceCategory.CLEANING,
            unit=ServiceUnit.PER_UNIT,  # Tính theo kg
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5,6]",
            provider_name="Giặt Là 365",
            created_at=datetime.now()
        ),

        # ========== DỊCH VỤ SỬA CHỮA (REPAIR) ==========
        # Tính theo VỤ VIỆC (Job)
        Service(
            name="Sửa chữa điện lạnh",
            description="Bảo dưỡng máy lạnh, bơm ga, sửa tủ lạnh, máy giặt. Phí nhân công theo lần + vật tư tính riêng.",
            category=ServiceCategory.REPAIR,
            unit=ServiceUnit.PER_JOB,
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5]",
            provider_name="Điện Lạnh 24h",
            created_at=datetime.now()
        ),
        Service(
            name="Sửa chữa Điện & Nước",
            description="Xử lý rò rỉ nước, thay bóng đèn, sửa ổ cắm, thông tắc cống. Giá cố định/vụ + vật tư.",
            category=ServiceCategory.REPAIR,
            unit=ServiceUnit.PER_JOB,
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5,6]",
            provider_name="Thợ Sài Gòn",
            created_at=datetime.now()
        ),
        Service(
            name="Dịch vụ Thợ khóa",
            description="Mở khóa cửa, thay khóa từ, sửa khóa két sắt. Tính theo lần.",
            category=ServiceCategory.REPAIR,
            unit=ServiceUnit.PER_JOB,
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5,6]",
            provider_name="KeyMaster",
            created_at=datetime.now()
        ),

        # ========== DỊCH VỤ GIAO HÀNG (DELIVERY) ==========
        # Tính theo ĐƠN VỊ (Unit)
        Service(
            name="Giao nước uống (19L)",
            description="Đổi nước bình 19L (Lavie/Vĩnh Hảo) tận căn hộ. Giá/bình.",
            category=ServiceCategory.DELIVERY,
            unit=ServiceUnit.PER_UNIT,  # Tính theo bình
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5,6]",
            provider_name="Đại lý Nước Xanh",
            created_at=datetime.now()
        ),

        # ========== TIỆN ÍCH TÒA NHÀ (AMENITIES - OTHER) ==========
        # Tính theo GIỜ (Hour)
        Service(
            name="Thuê khu vực BBQ",
            description="Đặt chỗ khu nướng BBQ sân thượng (Bao gồm lò nướng + than). Tính theo giờ.",
            category=ServiceCategory.OTHER,
            unit=ServiceUnit.PER_HOUR,
            status=ServiceStatus.ACTIVE,
            available_days="[5,6]",  # Chỉ cuối tuần
            available_time_start=time(17, 0),
            available_time_end=time(22, 0),
            provider_name="Ban Quản Lý",
            created_at=datetime.now()
        ),
        # Tính theo SLOT (Khung giờ cố định)
        Service(
            name="Thuê Phòng Sinh hoạt Cộng đồng",
            description="Đặt phòng họp/tiệc nhỏ. Mỗi slot = 4 tiếng. Cọc 500k (hoàn nếu dọn sạch).",
            category=ServiceCategory.OTHER,
            unit=ServiceUnit.PER_SLOT,
            status=ServiceStatus.ACTIVE,
            available_days="[5,6]",
            provider_name="Ban Quản Lý",
            created_at=datetime.now()
        ),
        Service(
            name="Chăm sóc thú cưng (Pet Sitting)",
            description="Trông giữ chó mèo, dắt chó đi dạo trong khuôn viên. Tính theo giờ.",
            category=ServiceCategory.OTHER,
            unit=ServiceUnit.PER_HOUR,
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5,6]",
            provider_name="PetLove",
            created_at=datetime.now()
        ),
        
        # ========== VÉ TIỆN ÍCH THÁNG (AMENITIES SUBSCRIPTION) ==========
        # Tính theo THÁNG (Month)
        Service(
            name="Vé Gym tháng",
            description="Vé sử dụng phòng Gym tòa nhà không giới hạn. Đăng ký theo tháng.",
            category=ServiceCategory.OTHER,
            unit=ServiceUnit.PER_MONTH,
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5,6]",
            provider_name="Ban Quản Lý",
            created_at=datetime.now()
        ),
        Service(
            name="Vé Hồ bơi tháng",
            description="Vé sử dụng hồ bơi không giới hạn trong tháng.",
            category=ServiceCategory.OTHER,
            unit=ServiceUnit.PER_MONTH,
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5,6]",
            available_time_start=time(6, 0),
            available_time_end=time(21, 0),
            provider_name="Ban Quản Lý",
            created_at=datetime.now()
        ),
    ]
    
    for s in services:
        session.add(s)
    session.commit()
    
    # Refresh để lấy ID
    for s in services:
        session.refresh(s)

    # ========== TẠO PRICE HISTORY CHO TẤT CẢ DỊCH VỤ ==========
    print("💰 Creating price histories for services...")
    price_histories = [
        # --- PHÍ QUẢN LÝ & PARKING (Không phải Service) ---
        PriceHistory(
            type=PriceType.MANAGEMENT_FEE_PER_M2,
            reference_id=None,
            price=Decimal("30000"),
            description="Phí quản lý Q4/2024",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id  # manager
        ),
        PriceHistory(
            type=PriceType.MANAGEMENT_FEE_PER_M2,
            reference_id=None,
            price=Decimal("35000"),
            description="Tăng phí từ tháng 12/2024 theo QĐ ban quản trị",
            effective_from=datetime(2024, 12, 1),
            created_by=users[0].id
        ),
        PriceHistory(
            type=PriceType.PARKING_CAR,
            reference_id=None,
            price=Decimal("1200000"),
            description="Phí gửi xe ô tô theo tháng",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        PriceHistory(
            type=PriceType.PARKING_CAR,
            reference_id=None,
            price=Decimal("1500000"),
            description="Tăng phí gửi xe ô tô từ 01/12/2024",
            effective_from=datetime(2024, 12, 1),
            created_by=users[0].id
        ),
        PriceHistory(
            type=PriceType.PARKING_MOTOR,
            reference_id=None,
            price=Decimal("100000"),
            description="Phí gửi xe máy theo tháng",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        PriceHistory(
            type=PriceType.PARKING_MOTOR,
            reference_id=None,
            price=Decimal("120000"),
            description="Tăng phí gửi xe máy từ 01/12/2024",
            effective_from=datetime(2024, 12, 1),
            created_by=users[0].id
        ),
        PriceHistory(
            type=PriceType.PARKING_BICYCLE,
            reference_id=None,
            price=Decimal("50000"),
            description="Phí gửi xe đạp theo tháng",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        PriceHistory(
            type=PriceType.ELECTRICITY_TIER_1,
            reference_id=None,
            price=Decimal("1806"),
            description="Giá điện bậc 1 theo EVN Q4/2024",
            effective_from=datetime(2024, 11, 1),
            created_by=users[1].id  # accountant
        ),
        PriceHistory(
            type=PriceType.WATER_TIER_1,
            reference_id=None,
            price=Decimal("7000"),
            description="Giá nước sinh hoạt bậc 1",
            effective_from=datetime(2024, 11, 1),
            created_by=users[1].id
        ),
        
        # --- GIÁ CÁC DỊCH VỤ ---
        # [0] Dọn dẹp theo giờ
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[0].id,
            price=Decimal("80000"),
            description="Giá dọn dẹp theo giờ",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[0].id,
            price=Decimal("100000"),
            description="Tăng giá mùa cao điểm Tết",
            effective_from=datetime(2024, 12, 15),
            created_by=users[0].id
        ),
        
        # [1] Gói Dọn 1PN
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[1].id,
            price=Decimal("250000"),
            description="Giá gói dọn 1PN",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        
        # [2] Gói Dọn 2PN
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[2].id,
            price=Decimal("350000"),
            description="Giá gói dọn 2PN",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        
        # [3] Vệ sinh Sofa & Thảm
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[3].id,
            price=Decimal("450000"),
            description="Giá vệ sinh sofa & thảm/bộ",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        
        # [4] Diệt côn trùng
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[4].id,
            price=Decimal("600000"),
            description="Giá diệt côn trùng/lần",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        
        # [5] Giặt ủi
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[5].id,
            price=Decimal("25000"),
            description="Giá giặt ủi/kg",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        
        # [6] Sửa chữa điện lạnh
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[6].id,
            price=Decimal("200000"),
            description="Phí nhân công sửa điện lạnh/lần (chưa bao gồm vật tư)",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[6].id,
            price=Decimal("250000"),
            description="Tăng giá mùa nóng từ 01/12/2024",
            effective_from=datetime(2024, 12, 1),
            created_by=users[0].id
        ),
        
        # [7] Sửa Điện & Nước
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[7].id,
            price=Decimal("150000"),
            description="Phí nhân công sửa điện nước/lần",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        
        # [8] Thợ khóa
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[8].id,
            price=Decimal("100000"),
            description="Phí dịch vụ thợ khóa/lần",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        
        # [9] Giao nước
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[9].id,
            price=Decimal("65000"),
            description="Giá giao nước 19L/bình",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        
        # [10] Thuê BBQ
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[10].id,
            price=Decimal("200000"),
            description="Giá thuê BBQ/giờ",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        
        # [11] Thuê Phòng sinh hoạt
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[11].id,
            price=Decimal("300000"),
            description="Giá thuê phòng/slot (4 tiếng)",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        
        # [12] Pet Sitting
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[12].id,
            price=Decimal("80000"),
            description="Giá chăm sóc thú cưng/giờ",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        
        # [13] Vé Gym tháng
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[13].id,
            price=Decimal("500000"),
            description="Giá vé Gym/tháng",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
        
        # [14] Vé Hồ bơi tháng
        PriceHistory(
            type=PriceType.SERVICE,
            reference_id=services[14].id,
            price=Decimal("400000"),
            description="Giá vé hồ bơi/tháng",
            effective_from=datetime(2024, 11, 1),
            created_by=users[0].id
        ),
    ]
    
    for ph in price_histories:
        session.add(ph)
    session.commit()
    print(f"✅ Created {len(price_histories)} price history records")

    # ========== TẠO BOOKINGS MẪU ==========
    # Booking 1: Dọn dẹp theo giờ - PENDING
    booking1 = ServiceBooking(
        booking_number="BK-CLEAN-HOUR-01",
        service_id=services[0].id,  # Dọn dẹp theo giờ
        user_id=users[3].id,  # user001
        scheduled_date=datetime.now() + timedelta(days=2),
        scheduled_time_start=time(9, 0),
        unit_price=Decimal("80000"),
        quantity=3,  # 3 giờ
        total_amount=Decimal("240000"),
        status=BookingStatus.PENDING,
        created_at=datetime.now()
    )

    # Booking 2: Gói dọn 2PN - COMPLETED
    booking2 = ServiceBooking(
        booking_number="BK-CLEAN-PKG-01",
        service_id=services[2].id,  # Gói Dọn 2PN
        user_id=users[3].id,
        scheduled_date=datetime.now() - timedelta(days=5),
        scheduled_time_start=time(14, 0),
        unit_price=Decimal("350000"),
        quantity=1,
        total_amount=Decimal("350000"),
        status=BookingStatus.COMPLETED,
        completed_at=datetime.now() - timedelta(days=5),
        created_at=datetime.now() - timedelta(days=7)
    )
    
    # Booking 3: Sửa điện lạnh - CONFIRMED
    booking3 = ServiceBooking(
        booking_number="BK-REPAIR-AC-01",
        service_id=services[6].id,  # Sửa điện lạnh
        user_id=users[4].id,  # user002
        scheduled_date=datetime.now() + timedelta(days=1),
        scheduled_time_start=time(10, 0),
        unit_price=Decimal("200000"),
        quantity=1,
        total_amount=Decimal("200000"),  # Chưa bao gồm vật tư
        status=BookingStatus.CONFIRMED,
        confirmed_at=datetime.now(),
        created_at=datetime.now()
    )

    session.add(booking1)
    session.add(booking2)
    session.add(booking3)
    session.commit()
    print("✅ Created Services & Bookings (Diverse scenarios with different units)")


def create_bills(users):
    bills = [
        Bill(
            bill_number="HD202401001",
            user_id=users[2].id,  
            bill_type=BillType.MANAGEMENT_FEE,
            title="Phí quản lý tháng 1/2025",
            description="Phí quản lý chung cư cho căn hộ A101",
            amount=Decimal("2000000"),
            due_date=datetime(2024, 2, 15),
            status=BillStatus.PENDING,
            created_at=datetime.now()
        ),
        Bill(
            bill_number="HD202401004",
            user_id=users[2].id,  
            bill_type=BillType.MANAGEMENT_FEE,
            title="Phí gửi xe",
            description="Phí gửi",
            amount=Decimal("2000000"),
            due_date=datetime(2024, 2, 15),
            status=BillStatus.PENDING,
            created_at=datetime.now()
        ),
        Bill(
            bill_number="HD202401002",
            user_id=users[3].id,  
            bill_type=BillType.UTILITY,
            title="Tiền điện nước tháng 1/2024",
            description="Tiền điện nước cho căn hộ B202",
            amount=Decimal("1500000"),
            due_date=datetime(2024, 2, 20),
            status=BillStatus.PENDING,
            created_at=datetime.now()
        ),
        Bill(
            bill_number="HD202401003",
            user_id=users[2].id,  
            bill_type=BillType.PARKING,
            title="Phí gửi xe tháng 1/2024",
            description="Phí gửi xe ô tô và xe máy",
            amount=Decimal("800000"),
            due_date=datetime(2024, 2, 10),
            status=BillStatus.PAID,
            created_at=datetime.now(),
            paid_at=datetime(2024, 1, 25)
        )
    ]
    return bills

def create_notifications(users):
    notifications = [
        Notification(
            title="Thông báo bảo trì thang máy",
            content="Thang máy tòa A sẽ được bảo trì vào ngày 15/02/2024 từ 8:00 đến 17:00. Vui lòng sử dụng cầu thang bộ.",
            type=NotificationType.MAINTENANCE,
            priority=2,
            target_audience="building_A",
            status=NotificationStatus.SENT,
            scheduled_at=datetime(2024, 2, 10, 8, 0),
            sent_at=datetime(2024, 2, 10, 8, 0),
            push_notification=True,
            sms=False,
            email=True,
            requires_response=False,
            created_by=users[1].id,  
            created_at=datetime.now()
        ),
        Notification(
            title="Nhắc nhở thanh toán hóa đơn",
            content="Kính gửi cư dân, hóa đơn phí quản lý tháng 1/2024 sẽ đến hạn thanh toán vào ngày 15/02/2024.",
            type=NotificationType.BILL_REMINDER,
            priority=1,
            target_audience="all",
            status=NotificationStatus.SENT,
            scheduled_at=datetime(2024, 2, 5, 9, 0),
            sent_at=datetime(2024, 2, 5, 9, 0),
            push_notification=True,
            sms=True,
            email=True,
            requires_response=False,
            created_by=users[0].id,  
            created_at=datetime.now()
        ),
        Notification(
            title="Sự kiện Tết Nguyên Đán 2024",
            content="Chung cư tổ chức tiệc Tết Nguyên Đán vào ngày 10/02/2024 tại sảnh tầng 1. Mời các gia đình tham gia.",
            type=NotificationType.EVENT,
            priority=1,
            target_audience="all",
            status=NotificationStatus.SCHEDULED,
            scheduled_at=datetime(2024, 2, 1, 10, 0),
            push_notification=True,
            sms=False,
            email=True,
            event_date=datetime(2024, 2, 10, 18, 0),
            event_location="Sảnh tầng 1",
            requires_response=True,
            created_by=users[1].id,  
            created_at=datetime.now()
        )
    ]
    return notifications

def create_apartments():
    """Create apartments for 2 buildings (A, B), 5 floors each, 5 rooms per floor"""
    apartments = []
    
    # Tòa A và B
    buildings = ["A", "B"]
    floors = 5  # 5 lầu
    rooms_per_floor = 5  # 5 phòng mỗi lầu
    
    # Định nghĩa các loại căn hộ (đã XÓA monthly_fee)
    apartment_types = [
        {"area": 55.0, "bedrooms": 1, "bathrooms": 1},  # Studio
        {"area": 65.0, "bedrooms": 2, "bathrooms": 1},  # 2PN
        {"area": 75.0, "bedrooms": 2, "bathrooms": 2},  # 2PN + 2WC
        {"area": 85.0, "bedrooms": 3, "bathrooms": 2},  # 3PN
        {"area": 100.0, "bedrooms": 3, "bathrooms": 3}, # 3PN cao cấp
    ]
    
    for building in buildings:
        for floor in range(1, floors + 1):
            for room in range(1, rooms_per_floor + 1):
                # Số phòng: A101, A102, ..., A105, A201, ...
                apartment_number = f"{building}{floor}0{room}"
                
                # Chọn loại căn hộ (xoay vòng)
                apt_type = apartment_types[(room - 1) % len(apartment_types)]
                
                # Mặc định tất cả đều AVAILABLE
                status = ApartmentStatus.AVAILABLE
                description = None
                move_in_date = None
                electricity_meter_start = None
                water_meter_start = None
                
                # Đặc biệt một vài căn có người ở (để test Pro-rata)
                special_occupied = ["A101", "A202", "A305", "B101", "B203", "B404"]
                if apartment_number in special_occupied:
                    status = ApartmentStatus.OCCUPIED
                    
                    # Set ngày chuyển vào khác nhau để test Pro-rata
                    if apartment_number == "A101":
                        description = "Căn góc, view đẹp. Chuyển vào đầu tháng."
                        move_in_date = date(2024, 12, 1)  # Đầu tháng -> Full tháng
                        electricity_meter_start = Decimal("1250.00")
                        water_meter_start = Decimal("85.50")
                    elif apartment_number == "A202":
                        description = "Chuyển vào giữa tháng (ngày 15)"
                        move_in_date = date(2024, 12, 15)  # Giữa tháng -> Pro-rata
                        electricity_meter_start = Decimal("0.00")  # Căn mới
                        water_meter_start = Decimal("0.00")
                    elif apartment_number == "A305":
                        description = "Chuyển vào cuối tháng (ngày 25)"
                        move_in_date = date(2024, 12, 25)  # Cuối tháng -> Pro-rata ít ngày
                        electricity_meter_start = Decimal("520.30")
                        water_meter_start = Decimal("42.00")
                    elif apartment_number == "B101":
                        description = "Căn góc, view đẹp. Ở từ tháng trước."
                        move_in_date = date(2024, 11, 10)  # Tháng trước -> Full tháng 12
                        electricity_meter_start = Decimal("3480.75")
                        water_meter_start = Decimal("125.20")
                    elif apartment_number == "B203":
                        description = "Chuyển vào ngày 20"
                        move_in_date = date(2024, 12, 20)  # Ngày 20 -> Pro-rata
                        electricity_meter_start = Decimal("1890.00")
                        water_meter_start = Decimal("98.50")
                    elif apartment_number == "B404":
                        description = "Chuyển vào ngày 5"
                        move_in_date = date(2024, 12, 5)  # Đầu tháng -> Gần full
                        electricity_meter_start = Decimal("2100.00")
                        water_meter_start = Decimal("110.00")
                
                apartment = Apartment(
                    apartment_number=apartment_number,
                    building=building,
                    floor=floor,
                    area=apt_type["area"],
                    bedrooms=apt_type["bedrooms"],
                    bathrooms=apt_type["bathrooms"],
                    status=status,
                    description=description,
                    move_in_date=move_in_date,
                    electricity_meter_start=electricity_meter_start,
                    water_meter_start=water_meter_start
                )
                apartments.append(apartment)
    
    return apartments

def create_vehicles(user_id, manager_id):
    """Create sample vehicles for testing"""
    vehicles = [
        Vehicle(
            user_id=user_id,
            license_plate="30A-123.45",
            make="Toyota",
            model="Camry",
            color="Trắng",
            vehicle_type=VehicleType.CAR,
            status=VehicleStatus.ACTIVE,
            parking_spot="P1-23",
            registered_at=datetime.utcnow() - timedelta(days=180),
            expires_at=datetime.utcnow() + timedelta(days=185),
            approved_at=datetime.utcnow() - timedelta(days=175),
            approved_by=manager_id,
        ),
        Vehicle(
            user_id=user_id,
            license_plate="29X-999.88",
            make="Honda",
            model="SH Mode",
            color="Đỏ mận",
            vehicle_type=VehicleType.MOTORCYCLE,
            status=VehicleStatus.PENDING,
            registered_at=datetime.utcnow() - timedelta(days=2),
            expires_at=datetime.utcnow() + timedelta(days=363),
        ),
        Vehicle(
            user_id=user_id,
            license_plate="30F-555.66",
            make="VinFast",
            model="VF e34",
            color="Xanh lam",
            vehicle_type=VehicleType.CAR,
            status=VehicleStatus.REJECTED,
            rejection_reason="Hình ảnh biển số mờ, vui lòng chụp lại rõ nét.",
            registered_at=datetime.utcnow() - timedelta(days=5),
        ),
    ]
    return vehicles

def main():
    print("🌱 Seeding database with complete data...")
    print("=" * 60)
    
    with Session(engine) as session:
        
        # 1. CREATE USERS
        print("\n👥 Creating users...")
        users = create_users()
        for user in users:
            session.add(user)
        session.commit()
        
        # Refresh to get IDs
        for i in range(len(users)):
            session.refresh(users[i])
        print(f"✅ Created {len(users)} users")
        print(f"   - Staff: {len([u for u in users if u.role in [UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.RECEPTIONIST]])}")
        print(f"   - Residents: {len([u for u in users if u.role == UserRole.USER])}")

        # 2. CREATE APARTMENTS
        print("\n🏢 Creating apartments...")
        apartments = create_apartments()
        for apt in apartments:
            session.add(apt)
        session.commit()
        
        # Refresh apartments to get IDs
        for apt in apartments:
            session.refresh(apt)
        
        # Link apartments to users
        apartment_user_map = {
            "A101": users[3],  # user001
            "A202": users[5],  # user003
            "A305": users[6],  # user004
            "B101": users[4],  # user002
            "B203": users[7],  # user005
            "B404": users[8],  # user006
        }
        
        for apt_number, user in apartment_user_map.items():
            apt = next((a for a in apartments if a.apartment_number == apt_number), None)
            if apt:
                apt.resident_id = user.id
                session.add(apt)
        
        session.commit()
        print(f"✅ Created {len(apartments)} apartments")
        print(f"   - Occupied: {len([a for a in apartments if a.status == ApartmentStatus.OCCUPIED])}")
        print(f"   - Available: {len([a for a in apartments if a.status == ApartmentStatus.AVAILABLE])}")
        
        # 3. CREATE SERVICES & BOOKINGS
        print("\n🔧 Creating services and bookings...")
        create_services_and_bookings(users, session)

        # 4. CREATE BILLS
        print("\n💳 Creating bills...")
        bills = create_bills(users)
        for bill in bills:
            session.add(bill)
        session.commit()
        print(f"✅ Created {len(bills)} bills")
        print(f"   - Pending: {len([b for b in bills if b.status == BillStatus.PENDING])}")
        print(f"   - Paid: {len([b for b in bills if b.status == BillStatus.PAID])}")

        # 5. CREATE NOTIFICATIONS
        print("\n📢 Creating notifications...")
        notifications = create_notifications(users)
        for notification in notifications:
            session.add(notification)
        session.commit()
        print(f"✅ Created {len(notifications)} notifications")

        # 6. CREATE TICKETS
        print("\n🎫 Creating tickets...")
        tickets = create_tickets(users)
        for ticket in tickets:
            session.add(ticket)
        session.commit()
        print(f"✅ Created {len(tickets)} tickets")
        print(f"   - Open: {len([t for t in tickets if t.status == TicketStatus.OPEN])}")
        print(f"   - In Progress: {len([t for t in tickets if t.status == TicketStatus.IN_PROGRESS])}")
        print(f"   - Resolved: {len([t for t in tickets if t.status == TicketStatus.RESOLVED])}")
        print(f"   - Closed: {len([t for t in tickets if t.status == TicketStatus.CLOSED])}")

        # 7. CREATE VEHICLES
        print("\n🚗 Creating vehicles...")
        vehicles = create_vehicles(users[3].id, users[0].id)  # user001's vehicles, approved by manager
        for vehicle in vehicles:
            session.add(vehicle)
        session.commit()
        print(f"✅ Created {len(vehicles)} vehicles")
        print(f"   - Active: {len([v for v in vehicles if v.status == VehicleStatus.ACTIVE])}")
        print(f"   - Pending: {len([v for v in vehicles if v.status == VehicleStatus.PENDING])}")
        print(f"   - Rejected: {len([v for v in vehicles if v.status == VehicleStatus.REJECTED])}")

    print("\n" + "=" * 60)
    print("🎉 Database seeding completed successfully!")
    print("=" * 60)
    print("\n📋 Test Accounts:")
    print("-" * 60)
    print("STAFF ACCOUNTS:")
    print("  Manager (Quản lý):     manager / 123456")
    print("  Accountant (Kế toán):  accountant / 123456") 
    print("  Receptionist (Lễ tân): receptionist / 123456")
    print("\nRESIDENT ACCOUNTS:")
    print("  User 1: user001 / 123456   (Căn hộ A101, Owner)")
    print("  User 2: user002 / 123456   (Căn hộ B101, Owner)")
    print("  User 3: user003 / 123456   (Căn hộ A202, Owner)")
    print("  User 4: user004 / 123456   (Căn hộ A305, Renter)")
    print("  User 5: user005 / 123456   (Căn hộ B203, Owner)")
    print("  User 6: user006 / 123456   (Căn hộ B404, Renter - Inactive)")
    print("-" * 60)
    print("\n💡 Tips:")
    print("  - Login as manager to access all management features")
    print("  - Login as accountant to manage bills and finances")
    print("  - Login as receptionist to manage vehicles, tickets, notifications")
    print("  - Login as user001 to test resident features (bills, vehicles, tickets)")
    print("=" * 60)

if __name__ == "__main__":
    main()