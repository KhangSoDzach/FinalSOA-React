"""
Utility Functions for Apartment Management System
Bao gồm: Pro-rata calculation, Bill generation helpers, Date utilities
"""
from datetime import date, datetime, timedelta
from decimal import Decimal
import calendar
from typing import Optional, Tuple


# ============================================
# PRO-RATA CALCULATION (Tính phí theo tỷ lệ)
# ============================================

def calculate_prorated_amount(
    monthly_fee: Decimal,
    billing_date: date,
    move_in_date: Optional[date] = None
) -> Decimal:
    """
    Tính phí theo tỷ lệ thời gian sử dụng (Pro-rata)
    
    Công thức: (Giá tháng / Số ngày trong tháng) × Số ngày sử dụng
    
    Args:
        monthly_fee: Phí trọn gói 1 tháng (VD: Phí quản lý, Phí gửi xe)
        billing_date: Ngày chốt sổ (thường là ngày cuối tháng hoặc ngày 1 tháng sau)
        move_in_date: Ngày cư dân chuyển vào (None = tính full tháng)
    
    Returns:
        Decimal: Số tiền phải trả (đã làm tròn 2 số thập phân)
    
    Examples:
        >>> # Phí quản lý 2,000,000đ/tháng
        >>> # Khách vào ngày 20/10/2024 (tháng 10 có 31 ngày)
        >>> fee = calculate_prorated_amount(
        ...     monthly_fee=Decimal("2000000"),
        ...     billing_date=date(2024, 10, 31),
        ...     move_in_date=date(2024, 10, 20)
        ... )
        >>> # Số ngày ở: (31-20)+1 = 12 ngày
        >>> # Kết quả: (2,000,000 / 31) × 12 = 774,193.55đ
    """
    # Nếu không có ngày chuyển vào -> Tính full tháng
    if move_in_date is None:
        return monthly_fee
    
    # 1. Xác định tháng và số ngày trong tháng
    year = billing_date.year
    month = billing_date.month
    _, num_days_in_month = calendar.monthrange(year, month)
    
    first_day_of_month = date(year, month, 1)
    last_day_of_month = date(year, month, num_days_in_month)
    
    # 2. Xác định ngày bắt đầu tính tiền
    # Nếu khách vào trước ngày 1 tháng này -> Tính full tháng
    # Nếu khách vào trong tháng này -> Tính từ ngày move_in_date
    start_date = max(first_day_of_month, move_in_date)
    
    # 3. Nếu khách chuyển vào SAU tháng này -> Không tính (0 đồng)
    if start_date > last_day_of_month:
        return Decimal("0.00")
    
    # 4. Tính số ngày sử dụng thực tế
    # Công thức: (Cuối - Đầu) + 1 (cộng 1 vì tính cả ngày chuyển vào)
    days_used = (last_day_of_month - start_date).days + 1
    
    # 5. Nếu ở full tháng -> Trả về giá trọn gói
    if days_used == num_days_in_month:
        return monthly_fee
    
    # 6. Tính tiền lẻ (Pro-rata)
    daily_rate = monthly_fee / Decimal(num_days_in_month)
    amount = daily_rate * Decimal(days_used)
    
    # 7. Làm tròn 2 số thập phân
    return amount.quantize(Decimal("0.01"))


def calculate_days_in_current_month(reference_date: Optional[date] = None) -> int:
    """
    Tính số ngày trong tháng
    
    Args:
        reference_date: Ngày tham chiếu (mặc định là hôm nay)
    
    Returns:
        int: Số ngày trong tháng (28-31)
    """
    if reference_date is None:
        reference_date = date.today()
    
    _, num_days = calendar.monthrange(reference_date.year, reference_date.month)
    return num_days


def is_full_month(move_in_date: date, billing_date: date) -> bool:
    """
    Kiểm tra xem cư dân có ở full tháng hay không
    
    Args:
        move_in_date: Ngày chuyển vào
        billing_date: Ngày chốt sổ
    
    Returns:
        bool: True nếu ở full tháng, False nếu ở lẻ ngày
    """
    year = billing_date.year
    month = billing_date.month
    first_day = date(year, month, 1)
    
    # Ở full tháng nếu chuyển vào trước hoặc đúng ngày 1
    return move_in_date <= first_day


def get_billing_period(reference_date: Optional[date] = None) -> Tuple[date, date]:
    """
    Lấy kỳ hóa đơn (đầu tháng - cuối tháng)
    
    Args:
        reference_date: Ngày tham chiếu (mặc định là hôm nay)
    
    Returns:
        Tuple[date, date]: (first_day, last_day)
    
    Example:
        >>> get_billing_period(date(2024, 10, 15))
        (date(2024, 10, 1), date(2024, 10, 31))
    """
    if reference_date is None:
        reference_date = date.today()
    
    year = reference_date.year
    month = reference_date.month
    _, num_days = calendar.monthrange(year, month)
    
    first_day = date(year, month, 1)
    last_day = date(year, month, num_days)
    
    return (first_day, last_day)


# ============================================
# METERED SERVICE CALCULATION (Điện/Nước)
# ============================================

def calculate_metered_consumption(
    meter_start: Decimal,
    meter_end: Decimal,
    unit_price: Decimal
) -> Decimal:
    """
    Tính tiền điện/nước theo chỉ số công tơ
    
    QUAN TRỌNG: Điện/Nước KHÔNG tính pro-rata theo ngày,
    mà tính theo chỉ số tiêu thụ thực tế.
    
    Args:
        meter_start: Chỉ số đầu (khi bàn giao hoặc đầu tháng)
        meter_end: Chỉ số cuối (cuối tháng)
        unit_price: Đơn giá (VD: 1,806đ/kWh cho điện)
    
    Returns:
        Decimal: Tổng tiền
    
    Example:
        >>> # Điện: Đầu 1250 kWh, Cuối 1300 kWh, Giá 1,806đ/kWh
        >>> calculate_metered_consumption(
        ...     meter_start=Decimal("1250"),
        ...     meter_end=Decimal("1300"),
        ...     unit_price=Decimal("1806")
        ... )
        >>> # Kết quả: (1300 - 1250) × 1,806 = 90,300đ
    """
    if meter_end < meter_start:
        raise ValueError(f"Chỉ số cuối ({meter_end}) không thể nhỏ hơn chỉ số đầu ({meter_start})")
    
    consumption = meter_end - meter_start
    total = consumption * unit_price
    
    return total.quantize(Decimal("0.01"))


def calculate_tiered_price(
    consumption: Decimal,
    tier_prices: list[Tuple[int, Decimal]]
) -> Decimal:
    """
    Tính tiền theo bậc thang (VD: Điện/Nước bậc 1, 2, 3...)
    
    Args:
        consumption: Số lượng tiêu thụ (kWh cho điện, m³ cho nước)
        tier_prices: Danh sách (threshold, price)
            VD: [(50, 1806), (100, 1866), (200, 2167), (300, 2729), (400, 3050), (float('inf'), 3151)]
    
    Returns:
        Decimal: Tổng tiền
    
    Example:
        >>> # Tiêu thụ 150 kWh
        >>> tiers = [
        ...     (50, Decimal("1806")),
        ...     (100, Decimal("1866")),
        ...     (float('inf'), Decimal("2167"))
        ... ]
        >>> calculate_tiered_price(Decimal("150"), tiers)
        >>> # 50 kWh đầu: 50 × 1,806 = 90,300
        >>> # 50 kWh tiếp: 50 × 1,866 = 93,300
        >>> # 50 kWh cuối: 50 × 2,167 = 108,350
        >>> # Tổng: 291,950đ
    """
    total = Decimal("0.00")
    remaining = consumption
    prev_threshold = 0
    
    for threshold, price in tier_prices:
        # Số lượng trong bậc này
        tier_amount = min(remaining, Decimal(threshold - prev_threshold))
        
        if tier_amount <= 0:
            break
        
        # Tính tiền bậc này
        total += tier_amount * price
        remaining -= tier_amount
        prev_threshold = threshold
        
        if remaining <= 0:
            break
    
    return total.quantize(Decimal("0.01"))


# ============================================
# DATE UTILITIES
# ============================================

def get_month_range(year: int, month: int) -> Tuple[datetime, datetime]:
    """
    Lấy datetime đầu và cuối tháng (00:00:00 - 23:59:59)
    
    Args:
        year: Năm
        month: Tháng (1-12)
    
    Returns:
        Tuple[datetime, datetime]: (start_datetime, end_datetime)
    """
    _, num_days = calendar.monthrange(year, month)
    
    start = datetime(year, month, 1, 0, 0, 0)
    end = datetime(year, month, num_days, 23, 59, 59)
    
    return (start, end)


def days_between(start_date: date, end_date: date, inclusive: bool = True) -> int:
    """
    Tính số ngày giữa 2 ngày
    
    Args:
        start_date: Ngày bắt đầu
        end_date: Ngày kết thúc
        inclusive: True = tính cả 2 ngày đầu/cuối, False = không tính
    
    Returns:
        int: Số ngày
    """
    delta = (end_date - start_date).days
    return delta + 1 if inclusive else delta


# ============================================
# FORMATTING UTILITIES
# ============================================

def format_currency(amount: Decimal, symbol: str = "đ") -> str:
    """
    Format số tiền theo định dạng Việt Nam
    
    Args:
        amount: Số tiền
        symbol: Ký hiệu tiền tệ
    
    Returns:
        str: VD: "2,000,000đ"
    """
    return f"{amount:,.0f}{symbol}"


def format_billing_period(year: int, month: int) -> str:
    """
    Format kỳ hóa đơn
    
    Args:
        year: Năm
        month: Tháng
    
    Returns:
        str: VD: "Tháng 10/2024"
    """
    return f"Tháng {month:02d}/{year}"
