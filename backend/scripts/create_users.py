"""
Simple script to create admin user for testing
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlmodel import Session, create_engine, select
from app.core.config import settings
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from datetime import datetime

def create_admin_user():
    try:
        # Create engine
        engine = create_engine(str(settings.database_url))
        
        with Session(engine) as session:
            # Check if admin already exists
            admin_exists = session.exec(select(User).where(User.username == "admin")).first()
            
            if admin_exists:
                print("✅ Admin user already exists!")
                print("Username: admin")
                print("Password: admin123")
            else:
                # Create admin user
                admin_user = User(
                    username="admin",
                    email="admin@apartment.com",
                    hashed_password=get_password_hash("admin123"),
                    full_name="System Administrator",
                    role=UserRole.ADMIN,
                    is_active=True,
                    is_admin=True,
                    created_at=datetime.now()
                )
                
                session.add(admin_user)
                session.commit()
                print("✅ Admin user created successfully!")
                print("Username: admin")
                print("Password: admin123")
            
            # Check if regular user exists
            user_exists = session.exec(select(User).where(User.username == "user001")).first()
            
            if user_exists:
                print("✅ Regular user already exists!")
                print("Username: user001")
                print("Password: user123")
            else:
                # Create regular user
                regular_user = User(
                    username="user001",
                    email="user001@apartment.com",
                    hashed_password=get_password_hash("user123"),
                    full_name="Nguyễn Văn A",
                    phone="0901234567",
                    role=UserRole.USER,
                    apartment_number="A101",
                    building="A",
                    is_active=True,
                    is_admin=False,
                    created_at=datetime.now()
                )
                
                session.add(regular_user)
                session.commit()
                print("✅ Regular user created successfully!")
                print("Username: user001")
                print("Password: user123")
            
            print("\n🎉 Database seeding completed!")
            print("\n📝 You can now login with:")
            print("Admin: admin / admin123")
            print("User: user001 / user123")
            
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_admin_user()