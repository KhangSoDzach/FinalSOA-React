#!/usr/bin/env python3
"""
Reset database - Drop and recreate all tables
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from sqlmodel import SQLModel, create_engine, text
from app.core.config import settings
from app.models import *  # Import all models

async def reset_database():
    """Reset database by dropping and recreating all tables"""
    
    print(f"Connecting to database: {settings.database_url}")
    engine = create_engine(settings.database_url, echo=True)
    
    try:
        # Drop all tables and types
        with engine.begin() as conn:
            print("🗑️  Dropping all tables and types...")
            
            # Drop all enums first
            conn.execute(text("DROP TYPE IF EXISTS userrole CASCADE;"))
            conn.execute(text("DROP TYPE IF EXISTS billtype CASCADE;"))
            conn.execute(text("DROP TYPE IF EXISTS billstatus CASCADE;"))
            conn.execute(text("DROP TYPE IF EXISTS paymentmethod CASCADE;"))
            conn.execute(text("DROP TYPE IF EXISTS paymentstatus CASCADE;"))
            conn.execute(text("DROP TYPE IF EXISTS cashflowtype CASCADE;"))
            conn.execute(text("DROP TYPE IF EXISTS cashflowcategory CASCADE;"))
            conn.execute(text("DROP TYPE IF EXISTS notificationtype CASCADE;"))
            conn.execute(text("DROP TYPE IF EXISTS notificationstatus CASCADE;"))
            conn.execute(text("DROP TYPE IF EXISTS responsetype CASCADE;"))
            conn.execute(text("DROP TYPE IF EXISTS ticketstatus CASCADE;"))
            conn.execute(text("DROP TYPE IF EXISTS ticketpriority CASCADE;"))
            conn.execute(text("DROP TYPE IF EXISTS ticketcategory CASCADE;"))
            conn.execute(text("DROP TYPE IF EXISTS servicestatus CASCADE;"))
            conn.execute(text("DROP TYPE IF EXISTS servicecategory CASCADE;"))
            conn.execute(text("DROP TYPE IF EXISTS bookingstatus CASCADE;"))
            
            # Drop all tables
            conn.execute(text("DROP SCHEMA public CASCADE;"))
            conn.execute(text("CREATE SCHEMA public;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
            
        print("✅ All tables and types dropped successfully!")
        
        # Create all tables
        print("🔨 Creating all tables...")
        SQLModel.metadata.create_all(engine)
        print("✅ All tables created successfully!")
        
        print("\n🎉 Database reset completed!")
        print("You can now run:")
        print("1. python scripts/seed_db.py  # To add sample data")
        print("2. python run.py              # To start the server")
        
        return True
        
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(reset_database())