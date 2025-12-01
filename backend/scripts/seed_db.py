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
from app.models.service import Service, ServiceCategory, ServiceStatus, ServiceBooking, BookingStatus
from app.models.notification import Notification, NotificationType, NotificationStatus
from app.models.ticket import Ticket, TicketCategory, TicketPriority, TicketStatus
from app.models.apartment import Apartment, ApartmentStatus
from app.models.vehicle import Vehicle, VehicleType, VehicleStatus
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
    services = [
        Service(
            name="Dọn dẹp căn hộ (Tiêu chuẩn)",
            description="Dịch vụ dọn dẹp vệ sinh tiêu chuẩn: quét, lau sàn, lau bụi, vệ sinh toilet.",
            category=ServiceCategory.CLEANING,
            price=Decimal("150000"),
            unit="giờ",
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5,6]",
            provider_name="CleanPro",
            created_at=datetime.now()
        ),
        Service(
            name="Vệ sinh Sofa & Thảm",
            description="Giặt sofa nỉ/da, giặt thảm phòng khách bằng máy chuyên dụng.",
            category=ServiceCategory.CLEANING,
            price=Decimal("450000"),
            unit="bộ",
            status=ServiceStatus.ACTIVE,
            available_days="[5,6]", 
            provider_name="Sofa Sạch",
            created_at=datetime.now()
        ),
        Service(
            name="Diệt côn trùng",
            description="Phun thuốc diệt muỗi, gián, kiến an toàn sinh học.",
            category=ServiceCategory.CLEANING,
            price=Decimal("600000"),
            unit="lần",
            status=ServiceStatus.ACTIVE,
            available_days="[1,3,5]",
            provider_name="PestBuster",
            created_at=datetime.now()
        ),

        Service(
            name="Sửa chữa điện lạnh",
            description="Bảo dưỡng máy lạnh, bơm ga, sửa tủ lạnh, máy giặt.",
            category=ServiceCategory.REPAIR,
            price=Decimal("250000"),
            unit="lần",
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5]",
            provider_name="Điện Lạnh 24h",
            created_at=datetime.now()
        ),
        Service(
            name="Sửa chữa Điện & Nước",
            description="Xử lý rò rỉ nước, thay bóng đèn, sửa ổ cắm, thông tắc cống.",
            category=ServiceCategory.REPAIR,
            price=Decimal("200000"),
            unit="lần",
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5,6]",
            provider_name="Thợ Sài Gòn",
            created_at=datetime.now()
        ),
        Service(
            name="Dịch vụ Thợ khóa",
            description="Mở khóa cửa, thay khóa từ, sửa khóa két sắt.",
            category=ServiceCategory.CLEANING,
            price=Decimal("150000"),
            unit="lần",
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5,6]",
            provider_name="KeyMaster",
            created_at=datetime.now()
        ),

        Service(
            name="Giao nước uống (19L)",
            description="Đổi nước bình 19L (Lavie/Vĩnh Hảo) tận căn hộ.",
            category=ServiceCategory.DELIVERY, 
            price=Decimal("650000"),
            unit="bình",
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5,6]",
            provider_name="Đại lý Nước Xanh",
            created_at=datetime.now()
        ),
        Service(
            name="Giặt ủi giao nhận tận nơi",
            description="Giặt sấy, gấp gọn. Giá tính theo kg. Giao nhận trong 24h.",
            category=ServiceCategory.CLEANING, 
            price=Decimal("25000"),
            unit="kg",
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5,6]",
            provider_name="Giặt Là 365",
            created_at=datetime.now()
        ),

        Service(
            name="Thuê khu vực BBQ",
            description="Đặt chỗ khu nướng BBQ sân thượng (Bao gồm lò nướng + than).",
            category=ServiceCategory.OTHER, 
            price=Decimal("300000"),
            unit="giờ",
            status=ServiceStatus.ACTIVE,
            available_days="[4,5,6]", 
            provider_name="Ban Quản Lý",
            created_at=datetime.now()
        ),
        Service(
            name="Chăm sóc thú cưng (Pet Sitting)",
            description="Trông giữ chó mèo, dắt chó đi dạo trong khuôn viên.",
            category=ServiceCategory.OTHER, 
            price=Decimal("100000"),
            unit="giờ",
            status=ServiceStatus.ACTIVE,
            available_days="[0,1,2,3,4,5,6]",
            provider_name="PetLove",
            created_at=datetime.now()
        )
    ]
    
    for s in services:
        session.add(s)
    session.commit()
    
    # Refresh để lấy ID
    for s in services:
        session.refresh(s)

    # 2. Tạo Bookings
    
    # Booking 1: PENDING (Để test nút Cancel)
    booking_pending = ServiceBooking(
        booking_number="BK-PENDING-01",
        service_id=services[0].id,
        user_id=users[2].id, # user001
        scheduled_date=datetime.now() + timedelta(days=2),
        scheduled_time_start=time(9, 0),
        unit_price=services[0].price,
        quantity=2,
        total_amount=services[0].price * 2,
        status=BookingStatus.PENDING,
        created_at=datetime.now()
    )

    # Booking 2: COMPLETED (Đã hoàn thành - KHÔNG có rating/feedback)
    booking_completed = ServiceBooking(
        booking_number="BK-COMPLETED-01",
        service_id=services[1].id,
        user_id=users[2].id,
        scheduled_date=datetime.now() - timedelta(days=10),
        scheduled_time_start=time(14, 0),
        unit_price=services[1].price,
        quantity=1,
        total_amount=services[1].price,
        status=BookingStatus.COMPLETED,
        completed_at=datetime.now() - timedelta(days=10),
        created_at=datetime.now() - timedelta(days=12)
    )

    session.add(booking_pending)
    session.add(booking_completed)
    session.commit()
    print("✅ Created Services & Bookings scenarios (Pending & Completed)")

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
    
    # Định nghĩa các loại căn hộ
    apartment_types = [
        {"area": 55.0, "bedrooms": 1, "bathrooms": 1, "base_fee": 1800000},  # Studio
        {"area": 65.0, "bedrooms": 2, "bathrooms": 1, "base_fee": 2300000},  # 2PN
        {"area": 75.0, "bedrooms": 2, "bathrooms": 2, "base_fee": 2800000},  # 2PN + 2WC
        {"area": 85.0, "bedrooms": 3, "bathrooms": 2, "base_fee": 3200000},  # 3PN
        {"area": 100.0, "bedrooms": 3, "bathrooms": 3, "base_fee": 3800000}, # 3PN cao cấp
    ]
    
    for building in buildings:
        for floor in range(1, floors + 1):
            for room in range(1, rooms_per_floor + 1):
                # Số phòng: A101, A102, ..., A105, A201, ...
                apartment_number = f"{building}{floor}0{room}"
                
                # Chọn loại căn hộ (xoay vòng)
                apt_type = apartment_types[(room - 1) % len(apartment_types)]
                
                # Phí tăng theo tầng (100k mỗi tầng)
                monthly_fee = apt_type["base_fee"] + (floor - 1) * 100000
                
                # Mặc định tất cả đều AVAILABLE
                status = ApartmentStatus.AVAILABLE
                description = None
                
                # Đặc biệt một vài căn có người ở (để test)
                special_occupied = ["A101", "A202", "A305", "B101", "B203", "B404"]
                if apartment_number in special_occupied:
                    status = ApartmentStatus.OCCUPIED
                    if room == 1:
                        description = "Căn góc, view đẹp"
                
                apartment = Apartment(
                    apartment_number=apartment_number,
                    building=building,
                    floor=floor,
                    area=apt_type["area"],
                    bedrooms=apt_type["bedrooms"],
                    bathrooms=apt_type["bathrooms"],
                    monthly_fee=monthly_fee,
                    status=status,
                    description=description
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