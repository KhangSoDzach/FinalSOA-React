"""
Script to seed all data in correct order
Run: python -m scripts.seed_all
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.seed_users import create_sample_users
from scripts.seed_apartments import seed_apartments

def seed_all():
    """Seed all data in the correct order"""
    print("=" * 70)
    print("  SEEDING ALL DATA")
    print("=" * 70)
    print()
    
    print("📝 Step 1: Creating users...")
    print("-" * 70)
    try:
        create_sample_users()
    except Exception as e:
        print(f"❌ Error creating users: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    print()
    print("🏢 Step 2: Creating apartments and linking with users...")
    print("-" * 70)
    try:
        seed_apartments()
    except Exception as e:
        print(f"❌ Error creating apartments: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    print()
    print("=" * 70)
    print("✅ ALL DATA SEEDED SUCCESSFULLY!")
    print("=" * 70)
    print()
    print("💡 You can now:")
    print("   - Login with admin/123456")
    print("   - Check apartments in admin panel")
    print("   - Generate monthly fees for renters")
    print()

if __name__ == "__main__":
    seed_all()
