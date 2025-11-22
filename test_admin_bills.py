"""
Test script cho Admin Bills API
Chạy: python test_admin_bills.py
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"  # Thay đổi theo password thực tế

# Colors for console output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_success(msg):
    print(f"{Colors.OKGREEN}✅ {msg}{Colors.ENDC}")

def print_error(msg):
    print(f"{Colors.FAIL}❌ {msg}{Colors.ENDC}")

def print_info(msg):
    print(f"{Colors.OKCYAN}ℹ️  {msg}{Colors.ENDC}")

def print_header(msg):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}")
    print(f"  {msg}")
    print(f"{'='*60}{Colors.ENDC}\n")

# Global token storage
admin_token = None

def login_as_admin():
    """Login và lấy access token"""
    global admin_token
    print_header("1. LOGIN AS ADMIN")
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        admin_token = data.get("access_token")
        print_success(f"Logged in as admin: {ADMIN_USERNAME}")
        print_info(f"Token: {admin_token[:20]}...")
        return True
    else:
        print_error(f"Login failed: {response.text}")
        return False

def get_headers():
    """Get authorization headers"""
    return {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }

def test_get_all_bills():
    """Test GET /bills/"""
    print_header("2. GET ALL BILLS")
    
    response = requests.get(
        f"{BASE_URL}/bills/",
        headers=get_headers(),
        params={"limit": 10}
    )
    
    if response.status_code == 200:
        bills = response.json()
        print_success(f"Retrieved {len(bills)} bills")
        if bills:
            print_info(f"First bill: {bills[0].get('bill_number')} - {bills[0].get('title')}")
    else:
        print_error(f"Failed: {response.text}")

def test_get_statistics():
    """Test GET /bills/statistics"""
    print_header("3. GET STATISTICS")
    
    response = requests.get(
        f"{BASE_URL}/bills/statistics",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        stats = response.json()
        print_success("Statistics retrieved successfully")
        print_info(f"Total Bills: {stats.get('total_bills')}")
        print_info(f"By Status: {json.dumps(stats.get('bills_by_status'), indent=2)}")
        print_info(f"Total Amount: {stats.get('amounts', {}).get('total_amount'):,.0f} VND")
    else:
        print_error(f"Failed: {response.text}")

def test_create_bill():
    """Test POST /bills/"""
    print_header("4. CREATE NEW BILL")
    
    # Tạo hóa đơn mới
    new_bill = {
        "user_id": 2,  # Thay đổi theo user ID thực tế
        "bill_type": "management_fee",
        "title": f"Phí quản lý tháng {datetime.now().month}/2025",
        "description": "Phí quản lý căn hộ - Test API",
        "amount": 500000,
        "due_date": (datetime.now() + timedelta(days=30)).isoformat()
    }
    
    response = requests.post(
        f"{BASE_URL}/bills/",
        headers=get_headers(),
        json=new_bill
    )
    
    if response.status_code == 200:
        bill = response.json()
        print_success(f"Bill created: {bill.get('bill_number')}")
        print_info(f"Title: {bill.get('title')}")
        print_info(f"Amount: {bill.get('amount'):,.0f} VND")
        print_info(f"Due Date: {bill.get('due_date')}")
        return bill.get('id')
    else:
        print_error(f"Failed: {response.text}")
        return None

def test_update_bill(bill_id):
    """Test PUT /bills/{bill_id}"""
    print_header(f"5. UPDATE BILL {bill_id}")
    
    if not bill_id:
        print_error("No bill ID provided, skipping update test")
        return
    
    update_data = {
        "amount": 600000,
        "description": "Phí quản lý căn hộ - Updated via API"
    }
    
    response = requests.put(
        f"{BASE_URL}/bills/{bill_id}",
        headers=get_headers(),
        json=update_data
    )
    
    if response.status_code == 200:
        bill = response.json()
        print_success(f"Bill updated: {bill.get('bill_number')}")
        print_info(f"New Amount: {bill.get('amount'):,.0f} VND")
    else:
        print_error(f"Failed: {response.text}")

def test_mark_overdue():
    """Test PUT /bills/mark-overdue"""
    print_header("6. MARK OVERDUE BILLS")
    
    response = requests.put(
        f"{BASE_URL}/bills/mark-overdue",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        result = response.json()
        print_success(f"Marked {result.get('updated_count')} bills as overdue")
    else:
        print_error(f"Failed: {response.text}")

def test_send_reminder():
    """Test POST /bills/send-reminder"""
    print_header("7. SEND PAYMENT REMINDERS")
    
    response = requests.post(
        f"{BASE_URL}/bills/send-reminder",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        result = response.json()
        print_success(f"Sent {result.get('notifications_sent')} reminders")
    else:
        print_error(f"Failed: {response.text}")

def test_export_report():
    """Test GET /bills/export-report"""
    print_header("8. EXPORT CSV REPORT")
    
    response = requests.get(
        f"{BASE_URL}/bills/export-report",
        headers=get_headers(),
        params={"status_filter": "pending"}
    )
    
    if response.status_code == 200:
        filename = f"bills_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        with open(filename, 'wb') as f:
            f.write(response.content)
        print_success(f"Report exported to {filename}")
    else:
        print_error(f"Failed: {response.text}")

def test_batch_create():
    """Test POST /bills/batch-create"""
    print_header("9. BATCH CREATE BILLS")
    
    bills_data = [
        {
            "user_id": 2,
            "bill_type": "utility",
            "title": "Tiền điện tháng 11",
            "amount": 300000,
            "due_date": (datetime.now() + timedelta(days=15)).isoformat()
        },
        {
            "user_id": 2,
            "bill_type": "utility",
            "title": "Tiền nước tháng 11",
            "amount": 100000,
            "due_date": (datetime.now() + timedelta(days=15)).isoformat()
        }
    ]
    
    response = requests.post(
        f"{BASE_URL}/bills/batch-create",
        headers=get_headers(),
        json=bills_data
    )
    
    if response.status_code == 200:
        bills = response.json()
        print_success(f"Created {len(bills)} bills in batch")
        for bill in bills:
            print_info(f"  - {bill.get('bill_number')}: {bill.get('title')}")
    else:
        print_error(f"Failed: {response.text}")

def main():
    """Run all tests"""
    print(f"{Colors.HEADER}{Colors.BOLD}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║       ADMIN BILLS API - COMPREHENSIVE TEST SUITE          ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(Colors.ENDC)
    
    # Step 1: Login
    if not login_as_admin():
        print_error("Cannot proceed without admin authentication")
        return
    
    # Step 2: Get all bills
    test_get_all_bills()
    
    # Step 3: Get statistics
    test_get_statistics()
    
    # Step 4: Create a new bill
    new_bill_id = test_create_bill()
    
    # Step 5: Update the bill
    if new_bill_id:
        test_update_bill(new_bill_id)
    
    # Step 6: Mark overdue bills
    test_mark_overdue()
    
    # Step 7: Send reminders
    test_send_reminder()
    
    # Step 8: Export report
    test_export_report()
    
    # Step 9: Batch create
    test_batch_create()
    
    print_header("✅ ALL TESTS COMPLETED")
    print_info("Check the output above for any errors")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_error("\n\nTests interrupted by user")
    except Exception as e:
        print_error(f"\n\nUnexpected error: {str(e)}")
