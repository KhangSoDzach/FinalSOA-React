"""
Seed the database with initial data for testing
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlmodel import Session, create_engine, select
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.bill import Bill, BillType, BillStatus
from app.models.service import Service, ServiceCategory, ServiceStatus
from app.models.notification import Notification, NotificationType, NotificationStatus
from app.core.security import get_password_hash
from datetime import datetime, date, time
from decimal import Decimal

# Create engine
engine = create_engine(str(settings.database_url))

def create_users():
    """Create sample users"""
    users = [
        User(
            username="admin",
            email="admin@apartment.com", 
            hashed_password=get_password_hash("admin123"),
            full_name="Quản trị viên",
            role=UserRole.ADMIN,
            is_active=True,
            created_at=datetime.now()
        ),
        User(
            username="manager",
            email="manager@apartment.com",
            hashed_password=get_password_hash("manager123"),
            full_name="Người quản lý",
            role=UserRole.MANAGER,
            is_active=True,
            created_at=datetime.now()
        ),
        User(
            username="user001",
            email="user001@apartment.com",
            hashed_password=get_password_hash("user123"),
            full_name="Nguyễn Văn A",
            phone="0901234567",
            role=UserRole.USER,
            apartment_number="A101",
            building="A",
            is_active=True,
            created_at=datetime.now()
        ),
        User(
            username="user002",
            email="user002@apartment.com",
            hashed_password=get_password_hash("user123"),
            full_name="Trần Thị B", 
            phone="0901234568",
            role=UserRole.USER,
            apartment_number="B202",
            building="B",
            is_active=True,
            created_at=datetime.now()
        )
    ]
    return users

def create_services():
    """Create sample services"""
    services = [
        Service(
            name="Dọn dẹp nhà",
            description="Dịch vụ dọn dẹp chung cư theo giờ",
            category=ServiceCategory.CLEANING,
            price=Decimal("100000"),
            unit="giờ",
            status=ServiceStatus.ACTIVE,
            available_days="1,2,3,4,5,6,7",  # Monday to Sunday
            available_time_start=time(8, 0),
            available_time_end=time(18, 0),
            advance_booking_hours=24,
            max_booking_days=7,
            provider_name="Công ty vệ sinh ABC",
            provider_contact="0901111111",
            created_at=datetime.now()
        ),
        Service(
            name="Sửa chữa điện",
            description="Dịch vụ sửa chữa điện trong chung cư",
            category=ServiceCategory.REPAIR,
            price=Decimal("200000"),
            unit="lần",
            status=ServiceStatus.ACTIVE,
            available_days="1,2,3,4,5",  # Monday to Friday
            available_time_start=time(8, 0),
            available_time_end=time(17, 0),
            advance_booking_hours=48,
            max_booking_days=14,
            provider_name="Thợ điện XYZ",
            provider_contact="0902222222",
            created_at=datetime.now()
        ),
        Service(
            name="Đặt phòng hội thảo",
            description="Đặt phòng hội thảo trong tòa nhà",
            category=ServiceCategory.ROOM_BOOKING,
            price=Decimal("500000"),
            unit="ngày",
            status=ServiceStatus.ACTIVE,
            available_days="1,2,3,4,5,6,7",
            available_time_start=time(6, 0),
            available_time_end=time(22, 0),
            advance_booking_hours=72,
            max_booking_days=30,
            provider_name="Ban quản lý tòa nhà",
            provider_contact="0903333333",
            created_at=datetime.now()
        )
    ]
    return services

def create_bills(users):
    """Create sample bills"""
    bills = [
        Bill(
            bill_number="HD202401001",
            user_id=users[2].id,  # user001
            bill_type=BillType.MANAGEMENT_FEE,
            title="Phí quản lý tháng 1/2024",
            description="Phí quản lý chung cư cho căn hộ A101",
            amount=Decimal("2000000"),
            due_date=datetime(2024, 2, 15),
            status=BillStatus.PENDING,
            created_at=datetime.now()
        ),
        Bill(
            bill_number="HD202401002",
            user_id=users[3].id,  # user002
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
            user_id=users[2].id,  # user001
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
    """Create sample notifications"""
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
            created_by=users[1].id,  # manager
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
            created_by=users[0].id,  # admin
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
            created_by=users[1].id,  # manager
            created_at=datetime.now()
        )
    ]
    return notifications

def main():
    print("🌱 Seeding database with initial data...")
    
    with Session(engine) as session:
        # Create users
        print("👥 Creating users...")
        users = create_users()
        for user in users:
            session.add(user)
        session.commit()
        session.refresh(users[0])
        session.refresh(users[1])
        session.refresh(users[2])
        session.refresh(users[3])
        print(f"✅ Created {len(users)} users")

        # Create services
        print("🔧 Creating services...")
        services = create_services()
        for service in services:
            session.add(service)
        session.commit()
        print(f"✅ Created {len(services)} services")

        # Create bills
        print("💳 Creating bills...")
        bills = create_bills(users)
        for bill in bills:
            session.add(bill)
        session.commit()
        print(f"✅ Created {len(bills)} bills")

        # Create notifications
        print("📢 Creating notifications...")
        notifications = create_notifications(users)
        for notification in notifications:
            session.add(notification)
        session.commit()
        print(f"✅ Created {len(notifications)} notifications")

    print("\n🎉 Database seeding completed!")
    print("\nTest accounts:")
    print("Admin: admin / admin123")
    print("Manager: manager / manager123") 
    print("User 1: user001 / user123 (Căn hộ A101)")
    print("User 2: user002 / user123 (Căn hộ B202)")

if __name__ == "__main__":
    main()