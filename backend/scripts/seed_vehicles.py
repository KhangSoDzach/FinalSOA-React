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
        
        # Get some users (assuming users already exist)
        users = session.exec(select(User).where(User.role == "user").limit(10)).all()
        
        if not users:
            print("No users found. Please run seed_users.py first")
            return
        
        admin = session.exec(select(User).where(User.role == "admin")).first()
        admin_id = admin.id if admin else None
        
        # Sample vehicle data
        vehicles_data = [
            {
                "user_id": users[0].id,
                "license_plate": "30A-123.45",
                "make": "Toyota",
                "model": "Camry",
                "color": "Trắng",
                "vehicle_type": VehicleType.CAR,
                "status": VehicleStatus.ACTIVE,
                "parking_spot": "P1-23",
                "license_plate_image": "/images/vehicles/30A12345.jpg",
                "registered_at": datetime.utcnow() - timedelta(days=180),
                "expires_at": datetime.utcnow() + timedelta(days=185),
                "approved_at": datetime.utcnow() - timedelta(days=175),
                "approved_by": admin_id,
            },
            {
                "user_id": users[0].id,
                "license_plate": "30A-678.90",
                "make": "Honda",
                "model": "Wave Alpha",
                "color": "Đỏ",
                "vehicle_type": VehicleType.MOTORCYCLE,
                "status": VehicleStatus.ACTIVE,
                "parking_spot": "M1-05",
                "license_plate_image": "/images/vehicles/30A67890.jpg",
                "registered_at": datetime.utcnow() - timedelta(days=90),
                "expires_at": datetime.utcnow() + timedelta(days=275),
                "approved_at": datetime.utcnow() - timedelta(days=85),
                "approved_by": admin_id,
            },
            {
                "user_id": users[1].id if len(users) > 1 else users[0].id,
                "license_plate": "29X-999.88",
                "make": "Ford",
                "model": "Focus",
                "color": "Xanh",
                "vehicle_type": VehicleType.CAR,
                "status": VehicleStatus.PENDING,
                "license_plate_image": "/images/vehicles/29X99988.jpg",
                "registered_at": datetime.utcnow() - timedelta(days=2),
                "expires_at": datetime.utcnow() + timedelta(days=363),
            },
            {
                "user_id": users[2].id if len(users) > 2 else users[0].id,
                "license_plate": "51F-456.78",
                "make": "Yamaha",
                "model": "Exciter 155",
                "color": "Đen",
                "vehicle_type": VehicleType.MOTORCYCLE,
                "status": VehicleStatus.PENDING,
                "license_plate_image": "/images/vehicles/51F45678.jpg",
                "registered_at": datetime.utcnow() - timedelta(days=1),
                "expires_at": datetime.utcnow() + timedelta(days=364),
            },
            {
                "user_id": users[3].id if len(users) > 3 else users[0].id,
                "license_plate": "30A-111.22",
                "make": "Mazda",
                "model": "CX-5",
                "color": "Trắng ngọc trai",
                "vehicle_type": VehicleType.CAR,
                "status": VehicleStatus.ACTIVE,
                "parking_spot": "P2-15",
                "license_plate_image": "/images/vehicles/30A11122.jpg",
                "registered_at": datetime.utcnow() - timedelta(days=120),
                "expires_at": datetime.utcnow() + timedelta(days=245),
                "approved_at": datetime.utcnow() - timedelta(days=118),
                "approved_by": admin_id,
            },
            {
                "user_id": users[4].id if len(users) > 4 else users[0].id,
                "license_plate": "59A-789.01",
                "make": "Hyundai",
                "model": "Accent",
                "color": "Bạc",
                "vehicle_type": VehicleType.CAR,
                "status": VehicleStatus.REJECTED,
                "license_plate_image": "/images/vehicles/59A78901.jpg",
                "registered_at": datetime.utcnow() - timedelta(days=10),
                "rejection_reason": "Hình ảnh biển số không rõ ràng. Vui lòng chụp lại.",
            },
            {
                "user_id": users[5].id if len(users) > 5 else users[0].id,
                "license_plate": "30F-333.44",
                "make": "Honda",
                "model": "Vision",
                "color": "Trắng",
                "vehicle_type": VehicleType.MOTORCYCLE,
                "status": VehicleStatus.ACTIVE,
                "parking_spot": "M2-12",
                "license_plate_image": "/images/vehicles/30F33344.jpg",
                "registered_at": datetime.utcnow() - timedelta(days=200),
                "expires_at": datetime.utcnow() + timedelta(days=165),
                "approved_at": datetime.utcnow() - timedelta(days=195),
                "approved_by": admin_id,
            },
            {
                "user_id": users[6].id if len(users) > 6 else users[0].id,
                "license_plate": "30A-555.66",
                "make": "VinFast",
                "model": "VF e34",
                "color": "Xanh lam",
                "vehicle_type": VehicleType.CAR,
                "status": VehicleStatus.PENDING,
                "license_plate_image": "/images/vehicles/30A55566.jpg",
                "registered_at": datetime.utcnow() - timedelta(hours=5),
                "expires_at": datetime.utcnow() + timedelta(days=365),
            },
            {
                "user_id": users[7].id if len(users) > 7 else users[0].id,
                "license_plate": "30E-888.99",
                "make": "Suzuki",
                "model": "Raider",
                "color": "Đỏ đen",
                "vehicle_type": VehicleType.MOTORCYCLE,
                "status": VehicleStatus.EXPIRED,
                "parking_spot": "M1-20",
                "license_plate_image": "/images/vehicles/30E88899.jpg",
                "registered_at": datetime.utcnow() - timedelta(days=400),
                "expires_at": datetime.utcnow() - timedelta(days=35),
                "approved_at": datetime.utcnow() - timedelta(days=395),
                "approved_by": admin_id,
            },
            {
                "user_id": users[8].id if len(users) > 8 else users[0].id,
                "license_plate": "29B-222.33",
                "make": "Kia",
                "model": "Morning",
                "color": "Vàng",
                "vehicle_type": VehicleType.CAR,
                "status": VehicleStatus.ACTIVE,
                "parking_spot": "P3-08",
                "license_plate_image": "/images/vehicles/29B22233.jpg",
                "registered_at": datetime.utcnow() - timedelta(days=60),
                "expires_at": datetime.utcnow() + timedelta(days=305),
                "approved_at": datetime.utcnow() - timedelta(days=58),
                "approved_by": admin_id,
            },
        ]
        
        # Create vehicles
        for vehicle_data in vehicles_data:
            vehicle = Vehicle(**vehicle_data)
            session.add(vehicle)
        
        session.commit()
        print(f"✅ Created {len(vehicles_data)} vehicles successfully!")
        
        # Print summary
        total = session.exec(select(Vehicle)).all()
        pending = len([v for v in total if v.status == VehicleStatus.PENDING])
        active = len([v for v in total if v.status == VehicleStatus.ACTIVE])
        expired = len([v for v in total if v.status == VehicleStatus.EXPIRED])
        rejected = len([v for v in total if v.status == VehicleStatus.REJECTED])
        
        print(f"\n📊 Vehicle Statistics:")
        print(f"   Total: {len(total)}")
        print(f"   Pending: {pending}")
        print(f"   Active: {active}")
        print(f"   Expired: {expired}")
        print(f"   Rejected: {rejected}")

if __name__ == "__main__":
    print("🚗 Seeding vehicles...")
    seed_vehicles()
