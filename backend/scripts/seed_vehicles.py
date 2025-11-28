"""
Script to seed vehicle data
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.core.database import engine
from app.models.vehicle import Vehicle, VehicleType, VehicleStatus
from app.models.user import User
from datetime import datetime, timedelta

def seed_vehicles():
    """Seed vehicle data"""
    with Session(engine) as session:
        # Check if vehicles already exist
        existing = session.exec(select(Vehicle)).first()
        if existing:
            print("Vehicles already exist, skipping...")

            return
        
        # Lấy user test chính (user001) để gán xe cho dễ thấy
        test_user = session.exec(select(User).where(User.username == "user001")).first()
        
        # Nếu không có user001, lấy user bất kỳ
        if not test_user:
            test_user = session.exec(select(User).where(User.role == "user")).first()
        
        if not test_user:
            print("No users found. Please run seed_users.py first")
            return
            
        print(f"🚗 Seeding vehicles for user: {test_user.username}")
        
        admin = session.exec(select(User).where(User.role == "admin")).first()
        admin_id = admin.id if admin else None
        
        # Danh sách xe mẫu
        vehicles_data = [
            # Xe 1: Đã duyệt (Active) - Ô tô
            {
                "user_id": test_user.id,
                "license_plate": "30A-123.45",
                "make": "Toyota",
                "model": "Camry",
                "color": "Trắng",
                "vehicle_type": VehicleType.CAR,
                "status": VehicleStatus.ACTIVE,
                "parking_spot": "P1-23",
                "registered_at": datetime.utcnow() - timedelta(days=180),
                "expires_at": datetime.utcnow() + timedelta(days=185),
                "approved_at": datetime.utcnow() - timedelta(days=175),
                "approved_by": admin_id,
            },
            # Xe 2: Đang chờ duyệt (Pending) - Xe máy
            {
                "user_id": test_user.id,
                "license_plate": "29X-999.88",
                "make": "Honda",
                "model": "SH Mode",
                "color": "Đỏ mận",
                "vehicle_type": VehicleType.MOTORCYCLE,
                "status": VehicleStatus.PENDING,
                "registered_at": datetime.utcnow() - timedelta(days=2),
                "expires_at": datetime.utcnow() + timedelta(days=363),
            },
            # Xe 3: Bị từ chối (Rejected) - Ô tô
            {
                "user_id": test_user.id,
                "license_plate": "30F-555.66",
                "make": "VinFast",
                "model": "VF e34",
                "color": "Xanh lam",
                "vehicle_type": VehicleType.CAR,
                "status": VehicleStatus.REJECTED,
                "rejection_reason": "Hình ảnh biển số mờ, vui lòng chụp lại rõ nét.",
                "registered_at": datetime.utcnow() - timedelta(days=5),
            },
            # Xe 4: Hết hạn (Expired) - Xe đạp (cho user khác nếu có, hoặc user này)
            {
                "user_id": test_user.id,
                "license_plate": "XE-DAP-01",
                "make": "Thống Nhất",
                "model": "Địa hình",
                "color": "Đen",
                "vehicle_type": VehicleType.BICYCLE,
                "status": VehicleStatus.EXPIRED,
                "registered_at": datetime.utcnow() - timedelta(days=400),
                "expires_at": datetime.utcnow() - timedelta(days=35),
            }
        ]
        
        # Create vehicles
        for vehicle_data in vehicles_data:
            vehicle = Vehicle(**vehicle_data)
            session.add(vehicle)
        
        session.commit()
        print(f"✅ Created {len(vehicles_data)} vehicles successfully!")
        
        # Print summary
        total = session.exec(select(Vehicle)).all()
        print(f"\n📊 Vehicle Statistics in DB: Total {len(total)}")

if __name__ == "__main__":
    print("🚗 Seeding vehicles...")
    seed_vehicles()