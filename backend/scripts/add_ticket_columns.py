"""
Script to add assigned_name and assigned_role columns to ticket table
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import engine

def add_ticket_columns():
    """Add assigned_name and assigned_role columns to ticket table"""
    
    sql_statements = [
        "ALTER TABLE ticket ADD COLUMN IF NOT EXISTS assigned_name VARCHAR(255);",
        "ALTER TABLE ticket ADD COLUMN IF NOT EXISTS assigned_role VARCHAR(255);"
    ]
    
    try:
        with engine.connect() as conn:
            for sql in sql_statements:
                print(f"Executing: {sql}")
                conn.execute(text(sql))
                conn.commit()
            print("✓ Migration completed successfully!")
            print("  - Added column: assigned_name (VARCHAR 255)")
            print("  - Added column: assigned_role (VARCHAR 255)")
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Starting database migration...")
    print("=" * 60)
    success = add_ticket_columns()
    print("=" * 60)
    
    if success:
        print("Migration completed successfully!")
        sys.exit(0)
    else:
        print("Migration failed!")
        sys.exit(1)
