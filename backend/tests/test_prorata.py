# 🎯 Testing Pro-rata Calculation

"""
Script để test tính năng Pro-rata
Run: python -m backend.tests.test_prorata
"""

from datetime import date
from decimal import Decimal
import sys
import os

# Add backend directory to path so we can import app modules
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.utils import (
    calculate_prorated_amount,
    is_full_month,
    get_billing_period,
    calculate_metered_consumption,
    calculate_days_in_current_month
)


def test_prorata_full_month():
    """Test: Chuyển vào đầu tháng (01/12) -> Tính full tháng"""
    print("\n" + "="*60)
    print("TEST 1: Chuyển vào đầu tháng (01/12/2024)")
    print("="*60)
    
    monthly_fee = Decimal("2000000")
    billing_date = date(2024, 12, 31)
    move_in_date = date(2024, 12, 1)
    
    amount = calculate_prorated_amount(monthly_fee, billing_date, move_in_date)
    is_full = is_full_month(move_in_date, billing_date)
    
    print(f"📅 Ngày chuyển vào: {move_in_date}")
    print(f"💰 Phí tháng: {monthly_fee:,}đ")
    print(f"✅ Tính full tháng: {is_full}")
    print(f"💵 Số tiền phải trả: {amount:,}đ")
    
    assert amount == monthly_fee, f"Expected {monthly_fee}, got {amount}"
    assert is_full == True
    print("✅ PASS")


def test_prorata_mid_month():
    """Test: Chuyển vào giữa tháng (15/12) -> Pro-rata 17 ngày"""
    print("\n" + "="*60)
    print("TEST 2: Chuyển vào giữa tháng (15/12/2024)")
    print("="*60)
    
    monthly_fee = Decimal("2000000")
    billing_date = date(2024, 12, 31)
    move_in_date = date(2024, 12, 15)
    
    # Số ngày: (31 - 15) + 1 = 17 ngày
    expected_days = 17
    expected_amount = (monthly_fee / Decimal("31")) * Decimal(str(expected_days))
    
    amount = calculate_prorated_amount(monthly_fee, billing_date, move_in_date)
    is_full = is_full_month(move_in_date, billing_date)
    
    print(f"📅 Ngày chuyển vào: {move_in_date}")
    print(f"📊 Số ngày ở: {expected_days}/31 ngày")
    print(f"💰 Phí tháng: {monthly_fee:,}đ")
    print(f"📐 Đơn giá/ngày: {monthly_fee/31:,.2f}đ")
    print(f"✅ Tính full tháng: {is_full}")
    print(f"💵 Số tiền phải trả: {amount:,.2f}đ")
    print(f"🔍 Expected: {expected_amount:,.2f}đ")
    
    assert amount == expected_amount.quantize(Decimal("0.01"))
    assert is_full == False
    print("✅ PASS")


def test_prorata_end_of_month():
    """Test: Chuyển vào cuối tháng (25/12) -> Pro-rata 7 ngày"""
    print("\n" + "="*60)
    print("TEST 3: Chuyển vào cuối tháng (25/12/2024)")
    print("="*60)
    
    monthly_fee = Decimal("2000000")
    billing_date = date(2024, 12, 31)
    move_in_date = date(2024, 12, 25)
    
    # Số ngày: (31 - 25) + 1 = 7 ngày
    expected_days = 7
    expected_amount = (monthly_fee / Decimal("31")) * Decimal(str(expected_days))
    
    amount = calculate_prorated_amount(monthly_fee, billing_date, move_in_date)
    
    print(f"📅 Ngày chuyển vào: {move_in_date}")
    print(f"📊 Số ngày ở: {expected_days}/31 ngày")
    print(f"💰 Phí tháng: {monthly_fee:,}đ")
    print(f"💵 Số tiền phải trả: {amount:,.2f}đ")
    print(f"🔍 Expected: {expected_amount:,.2f}đ")
    
    assert amount == expected_amount.quantize(Decimal("0.01"))
    print("✅ PASS")


def test_prorata_previous_month():
    """Test: Chuyển vào tháng trước (10/11) -> Tính full tháng 12"""
    print("\n" + "="*60)
    print("TEST 4: Chuyển vào tháng trước (10/11/2024)")
    print("="*60)
    
    monthly_fee = Decimal("2000000")
    billing_date = date(2024, 12, 31)
    move_in_date = date(2024, 11, 10)  # Tháng trước
    
    amount = calculate_prorated_amount(monthly_fee, billing_date, move_in_date)
    is_full = is_full_month(move_in_date, billing_date)
    
    print(f"📅 Ngày chuyển vào: {move_in_date}")
    print(f"💰 Phí tháng: {monthly_fee:,}đ")
    print(f"✅ Tính full tháng 12: {is_full}")
    print(f"💵 Số tiền phải trả: {amount:,}đ")
    
    assert amount == monthly_fee, "Should charge full month when moved in before"
    print("✅ PASS")


def test_prorata_future_month():
    """Test: Chuyển vào tháng sau (01/01/2025) -> Không tính tháng 12"""
    print("\n" + "="*60)
    print("TEST 5: Chuyển vào tháng sau (01/01/2025)")
    print("="*60)
    
    monthly_fee = Decimal("2000000")
    billing_date = date(2024, 12, 31)
    move_in_date = date(2025, 1, 1)  # Tháng sau
    
    amount = calculate_prorated_amount(monthly_fee, billing_date, move_in_date)
    
    print(f"📅 Ngày chuyển vào: {move_in_date}")
    print(f"💰 Phí tháng: {monthly_fee:,}đ")
    print(f"💵 Số tiền phải trả: {amount:,}đ")
    
    assert amount == Decimal("0.00"), "Should not charge for future month"
    print("✅ PASS - Không tính tiền cho tháng chưa ở")


def test_february_leap_year():
    """Test: Tháng 2 năm nhuận (2024) -> 29 ngày"""
    print("\n" + "="*60)
    print("TEST 6: Tháng 2 năm nhuận 2024 (29 ngày)")
    print("="*60)
    
    monthly_fee = Decimal("2000000")
    billing_date = date(2024, 2, 29)
    move_in_date = date(2024, 2, 15)
    
    # Số ngày: (29 - 15) + 1 = 15 ngày
    expected_days = 15
    expected_amount = (monthly_fee / Decimal("29")) * Decimal(str(expected_days))
    
    amount = calculate_prorated_amount(monthly_fee, billing_date, move_in_date)
    
    print(f"📅 Ngày chuyển vào: {move_in_date}")
    print(f"📊 Số ngày ở: {expected_days}/29 ngày (năm nhuận)")
    print(f"💰 Phí tháng: {monthly_fee:,}đ")
    print(f"💵 Số tiền phải trả: {amount:,.2f}đ")
    
    assert amount == expected_amount.quantize(Decimal("0.01"))
    print("✅ PASS - Tháng 2 năm nhuận tính đúng")


def test_metered_consumption():
    """Test: Tính tiền điện/nước theo công tơ"""
    print("\n" + "="*60)
    print("TEST 7: Tính tiền điện theo công tơ (KHÔNG Pro-rata)")
    print("="*60)
    
    meter_start = Decimal("1250.00")
    meter_end = Decimal("1300.00")
    unit_price = Decimal("1806")  # 1,806đ/kWh
    
    consumption = meter_end - meter_start
    expected_amount = consumption * unit_price
    
    amount = calculate_metered_consumption(meter_start, meter_end, unit_price)
    
    print(f"⚡ Chỉ số đầu: {meter_start} kWh")
    print(f"⚡ Chỉ số cuối: {meter_end} kWh")
    print(f"📊 Tiêu thụ: {consumption} kWh")
    print(f"💰 Đơn giá: {unit_price:,}đ/kWh")
    print(f"💵 Thành tiền: {amount:,}đ")
    
    assert amount == expected_amount
    print("✅ PASS - Điện/Nước tính theo tiêu thụ, KHÔNG chia ngày")


def test_billing_period():
    """Test: Lấy kỳ hóa đơn (đầu - cuối tháng)"""
    print("\n" + "="*60)
    print("TEST 8: Lấy kỳ hóa đơn")
    print("="*60)
    
    reference_date = date(2024, 12, 15)
    first_day, last_day = get_billing_period(reference_date)
    
    print(f"📅 Ngày tham chiếu: {reference_date}")
    print(f"📆 Kỳ hóa đơn: {first_day} → {last_day}")
    
    assert first_day == date(2024, 12, 1)
    assert last_day == date(2024, 12, 31)
    print("✅ PASS")


def test_days_in_month():
    """Test: Tính số ngày trong tháng"""
    print("\n" + "="*60)
    print("TEST 9: Số ngày trong tháng")
    print("="*60)
    
    test_cases = [
        (date(2024, 1, 15), 31),   # Tháng 1
        (date(2024, 2, 15), 29),   # Tháng 2 năm nhuận
        (date(2025, 2, 15), 28),   # Tháng 2 năm thường
        (date(2024, 4, 15), 30),   # Tháng 4
        (date(2024, 12, 15), 31),  # Tháng 12
    ]
    
    for ref_date, expected_days in test_cases:
        num_days = calculate_days_in_current_month(ref_date)
        print(f"📅 {ref_date.strftime('%B %Y')}: {num_days} ngày")
        assert num_days == expected_days
    
    print("✅ PASS")


def run_all_tests():
    """Chạy tất cả test cases"""
    print("\n" + "🧪 " + "="*58)
    print("🧪  TESTING PRO-RATA CALCULATION SYSTEM")
    print("🧪 " + "="*58)
    
    try:
        test_prorata_full_month()
        test_prorata_mid_month()
        test_prorata_end_of_month()
        test_prorata_previous_month()
        test_prorata_future_month()
        test_february_leap_year()
        test_metered_consumption()
        test_billing_period()
        test_days_in_month()
        
        print("\n" + "🎉 " + "="*58)
        print("🎉  ALL TESTS PASSED!")
        print("🎉 " + "="*58 + "\n")
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}\n")
        raise


if __name__ == "__main__":
    run_all_tests()
