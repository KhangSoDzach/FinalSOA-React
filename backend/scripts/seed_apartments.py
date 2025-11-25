"""
Script to seed apartments data with resident assignments
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.core.database import engine
from app.models.apartment import Apartment, ApartmentStatus
from app.models.user import User

def seed_apartments():
    """Seed apartments data and link with existing users"""
    with Session(engine) as session:
        # Check if apartments already exist
        statement = select(Apartment)
        existing = session.exec(statement).first()
        
        if existing:
            print("Apartments already exist, skipping seed...")
            return
        
        # Create sample apartments
        apartments = [
            # Tòa A
            Apartment(
                apartment_number="A101",
                building="A",
                floor=1,
                area=65.5,
                bedrooms=2,
                bathrooms=1,
                monthly_fee=2500000,
                status=ApartmentStatus.AVAILABLE,
                description="Căn góc, view công viên"
            ),
            Apartment(
                apartment_number="A102",
                building="A",
                floor=1,
                area=58.0,
                bedrooms=2,
                bathrooms=1,
                monthly_fee=2200000,
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="A201",
                building="A",
                floor=2,
                area=65.5,
                bedrooms=2,
                bathrooms=1,
                monthly_fee=2600000,
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="A202",
                building="A",
                floor=2,
                area=58.0,
                bedrooms=2,
                bathrooms=1,
                monthly_fee=2300000,
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="A301",
                building="A",
                floor=3,
                area=85.5,
                bedrooms=3,
                bathrooms=2,
                monthly_fee=3500000,
                status=ApartmentStatus.AVAILABLE,
                description="Căn penthouse, 3 phòng ngủ"
            ),
            # Tòa B
            Apartment(
                apartment_number="B101",
                building="B",
                floor=1,
                area=70.0,
                bedrooms=2,
                bathrooms=2,
                monthly_fee=2800000,
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="B102",
                building="B",
                floor=1,
                area=70.0,
                bedrooms=2,
                bathrooms=2,
                monthly_fee=2800000,
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="B201",
                building="B",
                floor=2,
                area=70.0,
                bedrooms=2,
                bathrooms=2,
                monthly_fee=2900000,
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="B202",
                building="B",
                floor=2,
                area=70.0,
                bedrooms=2,
                bathrooms=2,
                monthly_fee=2900000,
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="B301",
                building="B",
                floor=3,
                area=95.0,
                bedrooms=3,
                bathrooms=2,
                monthly_fee=4000000,
                status=ApartmentStatus.AVAILABLE,
                description="Căn duplex, view sông"
            ),
            # Tòa C
            Apartment(
                apartment_number="C101",
                building="C",
                floor=1,
                area=55.0,
                bedrooms=1,
                bathrooms=1,
                monthly_fee=1800000,
                status=ApartmentStatus.AVAILABLE,
                description="Studio, phù hợp 1-2 người"
            ),
            Apartment(
                apartment_number="C102",
                building="C",
                floor=1,
                area=55.0,
                bedrooms=1,
                bathrooms=1,
                monthly_fee=1800000,
                status=ApartmentStatus.MAINTENANCE,
                description="Đang sửa chữa"
            ),
            Apartment(
                apartment_number="C201",
                building="C",
                floor=2,
                area=75.0,
                bedrooms=2,
                bathrooms=2,
                monthly_fee=3000000,
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="C202",
                building="C",
                floor=2,
                area=75.0,
                bedrooms=2,
                bathrooms=2,
                monthly_fee=3000000,
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="C301",
                building="C",
                floor=3,
                area=100.0,
                bedrooms=3,
                bathrooms=3,
                monthly_fee=4500000,
                status=ApartmentStatus.AVAILABLE,
                description="Căn hộ cao cấp, full nội thất"
            ),
        ]
        
        for apartment in apartments:
            session.add(apartment)
        
        session.commit()
        
        # Now link apartments with users
        print("\nLinking apartments with users...")
        
        # Mapping apartment_number to user info
        apartment_user_mapping = {
            "A101": "user_a101",
            "A102": "user_a102",
            "A201": "user_a201",
            "A202": "user_a202",
            "A301": "user_a301",
            "B101": "user_b101",
            "B102": "user_b102",
            "B201": "user_b201",
            "B202": "user_b202",
            "B301": "user_b301",
            "C101": "user_c101",
            "C201": "user_c201",
            "C202": "user_c202",
        }
        
        for apt_number, username in apartment_user_mapping.items():
            # Find apartment
            apartment = session.exec(
                select(Apartment).where(Apartment.apartment_number == apt_number)
            ).first()
            
            # Find user
            user = session.exec(
                select(User).where(User.username == username)
            ).first()
            
            if apartment and user:
                # Link them
                apartment.resident_id = user.id
                apartment.status = ApartmentStatus.OCCUPIED
                session.add(apartment)
                print(f"  ✅ Linked {apt_number} with {user.full_name} ({user.occupier})")
            elif apartment:
                print(f"  ⚠️  User {username} not found for apartment {apt_number}")
            else:
                print(f"  ⚠️  Apartment {apt_number} not found")
        
        session.commit()
        
        # Print summary
        total_apartments = session.exec(select(Apartment)).all()
        occupied = [a for a in total_apartments if a.status == ApartmentStatus.OCCUPIED]
        available = [a for a in total_apartments if a.status == ApartmentStatus.AVAILABLE]
        maintenance = [a for a in total_apartments if a.status == ApartmentStatus.MAINTENANCE]
        
        print(f"\n✅ Created {len(apartments)} apartments successfully!")
        print(f"\n📊 Summary:")
        print(f"   - Total: {len(total_apartments)}")
        print(f"   - Occupied: {len(occupied)}")
        print(f"   - Available: {len(available)}")
        print(f"   - Maintenance: {len(maintenance)}")
        print(f"   - Building A: {len([a for a in total_apartments if a.building == 'A'])}")
        print(f"   - Building B: {len([a for a in total_apartments if a.building == 'B'])}")
        print(f"   - Building C: {len([a for a in total_apartments if a.building == 'C'])}")

if __name__ == "__main__":
    print("Seeding apartments data...")
    seed_apartments()
    print("Done!")
