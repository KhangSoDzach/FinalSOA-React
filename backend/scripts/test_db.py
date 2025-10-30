#!/usr/bin/env python3
"""
Test database connection with new credentials
"""
import asyncio
from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

def test_database_connection():
    """Test database connection"""
    try:
        print(f"Testing database connection...")
        print(f"Database URL: {settings.database_url}")
        
        # Create engine
        engine = create_engine(settings.database_url, echo=True)
        
        # Test connection
        with Session(engine) as session:
            result = session.exec("SELECT 1 as test").first()
            if result:
                print("✅ Database connection successful!")
                print(f"Test query result: {result}")
                return True
            else:
                print("❌ Database connection failed - no result")
                return False
                
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    success = test_database_connection()
    if success:
        print("\n🎉 Database configuration is correct!")
        print("You can now run: python run.py")
    else:
        print("\n⚠️  Please check your PostgreSQL server and database settings")
        print("Make sure PostgreSQL is running on localhost:5432")
        print("Database: apartment_management")
        print("User: postgres")
        print("Password: 123456")