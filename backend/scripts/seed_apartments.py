"""
Script to seed apartments data
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.core.database import engine
from app.models.apartment import Apartment, ApartmentStatus

def seed_apartments():
    """Seed apartments data"""
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
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="A201",
                building="A",
                floor=2,
                area=65.5,
                bedrooms=2,
                bathrooms=1,
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="A202",
                building="A",
                floor=2,
                area=58.0,
                bedrooms=2,
                bathrooms=1,
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="A301",
                building="A",
                floor=3,
                area=85.5,
                bedrooms=3,
                bathrooms=2,
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
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="B102",
                building="B",
                floor=1,
                area=70.0,
                bedrooms=2,
                bathrooms=2,
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="B201",
                building="B",
                floor=2,
                area=70.0,
                bedrooms=2,
                bathrooms=2,
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="B202",
                building="B",
                floor=2,
                area=70.0,
                bedrooms=2,
                bathrooms=2,
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="B301",
                building="B",
                floor=3,
                area=95.0,
                bedrooms=3,
                bathrooms=2,
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
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="C202",
                building="C",
                floor=2,
                area=75.0,
                bedrooms=2,
                bathrooms=2,
                status=ApartmentStatus.AVAILABLE,
            ),
            Apartment(
                apartment_number="C301",
                building="C",
                floor=3,
                area=100.0,
                bedrooms=3,
                bathrooms=3,
                status=ApartmentStatus.AVAILABLE,
                description="Căn hộ cao cấp, full nội thất"
            ),
        ]
        
        for apartment in apartments:
            session.add(apartment)
        
        session.commit()
        print(f"✅ Created {len(apartments)} apartments successfully!")

if __name__ == "__main__":
    print("Seeding apartments data...")
    seed_apartments()
    print("Done!")
