"""
Script to seed sample users for testing the Users Management feature
Run: python -m scripts.seed_users
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.core.database import engine
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def create_sample_users():
    """Create sample users with different roles and buildings"""
    
    sample_users = [
        # Admin users
        {
            "username": "admin",
            "email": "admin@skyhome.com",
            "full_name": "Quản trị viên hệ thống",
            "phone": "0901234567",
            "role": UserRole.ADMIN,
            "apartment_number": None,
            "building": None,
            "is_active": True
        },
        
        # Manager users
        {
            "username": "manager_a",
            "email": "manager.a@skyhome.com",
            "full_name": "Nguyễn Văn Quản",
            "phone": "0902345678",
            "role": UserRole.MANAGER,
            "apartment_number": None,
            "building": "A",
            "is_active": True
        },
        {
            "username": "manager_b",
            "email": "manager.b@skyhome.com",
            "full_name": "Trần Thị Lý",
            "phone": "0903456789",
            "role": UserRole.MANAGER,
            "apartment_number": None,
            "building": "B",
            "is_active": True
        },
        
        # Regular users - Building A
        {
            "username": "user_a101",
            "email": "nguyen.vana@gmail.com",
            "full_name": "Nguyễn Văn A",
            "phone": "0904567890",
            "role": UserRole.USER,
            "apartment_number": "101",
            "building": "A",
            "is_active": True
        },
        {
            "username": "user_a102",
            "email": "tran.thib@gmail.com",
            "full_name": "Trần Thị B",
            "phone": "0905678901",
            "role": UserRole.USER,
            "apartment_number": "102",
            "building": "A",
            "is_active": True
        },
        {
            "username": "user_a201",
            "email": "le.vanc@gmail.com",
            "full_name": "Lê Văn C",
            "phone": "0906789012",
            "role": UserRole.USER,
            "apartment_number": "201",
            "building": "A",
            "is_active": True
        },
        {
            "username": "user_a202",
            "email": "pham.thid@gmail.com",
            "full_name": "Phạm Thị D",
            "phone": "0907890123",
            "role": UserRole.USER,
            "apartment_number": "202",
            "building": "A",
            "is_active": False  # Inactive user
        },
        {
            "username": "user_a301",
            "email": "hoang.vane@gmail.com",
            "full_name": "Hoàng Văn E",
            "phone": "0908901234",
            "role": UserRole.USER,
            "apartment_number": "301",
            "building": "A",
            "is_active": True
        },
        
        # Regular users - Building B
        {
            "username": "user_b101",
            "email": "vo.thif@gmail.com",
            "full_name": "Võ Thị F",
            "phone": "0909012345",
            "role": UserRole.USER,
            "apartment_number": "101",
            "building": "B",
            "is_active": True
        },
        {
            "username": "user_b102",
            "email": "dang.vang@gmail.com",
            "full_name": "Đặng Văn G",
            "phone": "0910123456",
            "role": UserRole.USER,
            "apartment_number": "102",
            "building": "B",
            "is_active": True
        },
        {
            "username": "user_b201",
            "email": "bui.thih@gmail.com",
            "full_name": "Bùi Thị H",
            "phone": "0911234567",
            "role": UserRole.USER,
            "apartment_number": "201",
            "building": "B",
            "is_active": True
        },
        {
            "username": "user_b202",
            "email": "do.vani@gmail.com",
            "full_name": "Đỗ Văn I",
            "phone": "0912345678",
            "role": UserRole.USER,
            "apartment_number": "202",
            "building": "B",
            "is_active": True
        },
        {
            "username": "user_b301",
            "email": "ngo.thik@gmail.com",
            "full_name": "Ngô Thị K",
            "phone": "0913456789",
            "role": UserRole.USER,
            "apartment_number": "301",
            "building": "B",
            "is_active": False  # Inactive user
        },
        
        # Regular users - Building C
        {
            "username": "user_c101",
            "email": "duong.vanl@gmail.com",
            "full_name": "Dương Văn L",
            "phone": "0914567890",
            "role": UserRole.USER,
            "apartment_number": "101",
            "building": "C",
            "is_active": True
        },
        {
            "username": "user_c102",
            "email": "ly.thim@gmail.com",
            "full_name": "Lý Thị M",
            "phone": "0915678901",
            "role": UserRole.USER,
            "apartment_number": "102",
            "building": "C",
            "is_active": True
        },
        {
            "username": "user_c201",
            "email": "truong.vann@gmail.com",
            "full_name": "Trương Văn N",
            "phone": "0916789012",
            "role": UserRole.USER,
            "apartment_number": "201",
            "building": "C",
            "is_active": True
        },
        {
            "username": "user_c202",
            "email": "mai.thio@gmail.com",
            "full_name": "Mai Thị O",
            "phone": "0917890123",
            "role": UserRole.USER,
            "apartment_number": "202",
            "building": "C",
            "is_active": True
        },
        
        # Users without apartment assignment
        {
            "username": "user_pending1",
            "email": "pending1@gmail.com",
            "full_name": "Người dùng chưa có căn hộ 1",
            "phone": "0918901234",
            "role": UserRole.USER,
            "apartment_number": None,
            "building": None,
            "is_active": True
        },
        {
            "username": "user_pending2",
            "email": "pending2@gmail.com",
            "full_name": "Người dùng chưa có căn hộ 2",
            "phone": "0919012345",
            "role": UserRole.USER,
            "apartment_number": None,
            "building": None,
            "is_active": True
        },
    ]
    
    with Session(engine) as session:
        # Check if users already exist
        existing_users = session.exec(select(User)).all()
        if existing_users:
            print(f"⚠️  Database already has {len(existing_users)} users.")
            print("ℹ️  This script will only add new users, not delete existing ones.")
            print("ℹ️  To start fresh, please run: python -m scripts.reset_db first")
            print()
        
        # Create new users
        created_count = 0
        for user_data in sample_users:
            # Check if username already exists
            existing = session.exec(
                select(User).where(User.username == user_data["username"])
            ).first()
            
            if existing:
                print(f"⚠️  User {user_data['username']} already exists, skipping...")
                continue
            
            # Create user with hashed password
            user = User(
                **user_data,
                hashed_password=get_password_hash("123456")  # Default password
            )
            session.add(user)
            created_count += 1
            print(f"✅ Created user: {user_data['username']} - {user_data['full_name']}")
        
        session.commit()
        print(f"\n🎉 Successfully created {created_count} users!")
        print("\n📋 Summary:")
        print(f"   - Admin: {len([u for u in sample_users if u['role'] == UserRole.ADMIN])}")
        print(f"   - Manager: {len([u for u in sample_users if u['role'] == UserRole.MANAGER])}")
        print(f"   - User: {len([u for u in sample_users if u['role'] == UserRole.USER])}")
        print(f"   - Building A: {len([u for u in sample_users if u['building'] == 'A'])}")
        print(f"   - Building B: {len([u for u in sample_users if u['building'] == 'B'])}")
        print(f"   - Building C: {len([u for u in sample_users if u['building'] == 'C'])}")
        print(f"   - No apartment: {len([u for u in sample_users if u['apartment_number'] is None])}")
        print(f"   - Active: {len([u for u in sample_users if u['is_active']])}")
        print(f"   - Inactive: {len([u for u in sample_users if not u['is_active']])}")
        print("\n🔑 Default password for all users: 123456")

if __name__ == "__main__":
    print("=" * 60)
    print("  SEED SAMPLE USERS FOR USERS MANAGEMENT MODULE")
    print("=" * 60)
    print()
    
    try:
        create_sample_users()
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
