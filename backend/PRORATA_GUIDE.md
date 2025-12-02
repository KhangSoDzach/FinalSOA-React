# 📅 Pro-rata Billing System (Tính phí theo tỷ lệ)

## 🎯 Tổng quan

**Pro-rata** là phương pháp tính phí theo tỷ lệ thời gian sử dụng thực tế. Tính năng này CỰC KỲ QUAN TRỌNG trong quản lý tòa nhà vì:

- ✅ Cư dân hiếm khi chuyển vào đúng ngày mùng 1
- ✅ Công bằng: "Ở bao nhiêu ngày, trả bấy nhiêu tiền"
- ✅ Tuân thủ quy định pháp luật về hợp đồng thuê nhà

---

## 📊 Công thức tính toán

### Công thức cơ bản

$$
\text{Tiền phải trả} = \frac{\text{Giá trọn gói 1 tháng}}{\text{Tổng số ngày của tháng}} \times \text{Số ngày sử dụng}
$$

### Chi tiết

**Số ngày sử dụng** = `(Ngày cuối tháng - Ngày chuyển vào) + 1`

> **Lưu ý:** Phải cộng 1 vì tính cả ngày chuyển vào!

### Ví dụ thực tế

**Tình huống:**
- Phí quản lý: 2,000,000đ/tháng
- Cư dân chuyển vào: **20/10/2024**
- Tháng 10 có **31 ngày**

**Tính toán:**
- Số ngày ở: `(31 - 20) + 1 = 12 ngày`
- Đơn giá hàng ngày: `2,000,000 / 31 = 64,516.13đ/ngày`
- Tiền phải đóng: `64,516.13 × 12 = 774,193.55đ`

---

## 🗂️ Phân loại dịch vụ

### 1. Phí cố định (Áp dụng Pro-rata) ✅

| Loại phí | Mô tả | Ví dụ |
|----------|-------|-------|
| **Phí quản lý** | Phí duy trì tòa nhà | 2,000,000đ/tháng |
| **Phí gửi xe** | Vé tháng (ô tô/xe máy/xe đạp) | 1,500,000đ/tháng |
| **Internet** | Gói cáp quang (nếu tòa nhà cung cấp) | 300,000đ/tháng |
| **Tiện ích** | Vé Gym, Hồ bơi tháng | 500,000đ/tháng |

**Nguyên tắc:** Các phí này tính theo THÁNG → Phải chia tỷ lệ nếu chuyển vào giữa tháng.

---

### 2. Phí theo mức tiêu thụ (KHÔNG áp dụng Pro-rata) ❌

| Loại phí | Cách tính | Ghi chú |
|----------|-----------|---------|
| **Điện** | `(Chỉ số cuối - Chỉ số đầu) × Đơn giá` | Tính theo công tơ |
| **Nước** | `(Chỉ số cuối - Chỉ số đầu) × Đơn giá` | Tính theo công tơ |

**Nguyên tắc:** 
- KHÔNG chia ngày, mà tính theo tiêu thụ thực tế
- Khi bàn giao nhà giữa tháng → Ghi lại chỉ số công tơ làm "Chỉ số đầu"
- Cuối tháng → Đọc chỉ số → Tính tiền

---

### 3. Dịch vụ lẻ (Tính 100%) ⚡

| Dịch vụ | Cách tính |
|---------|-----------|
| Dọn dẹp theo giờ | Giá × Số giờ |
| Sửa chữa điện/nước | Giá cố định/vụ |
| Thuê BBQ | Giá × Số giờ |

**Nguyên tắc:** KHÔNG liên quan đến Pro-rata, luôn tính 100%.

---

## 💻 Sử dụng trong Code

### Import module

```python
from app.core.utils import (
    calculate_prorated_amount,
    is_full_month,
    get_billing_period,
    calculate_metered_consumption
)
from app.services.price_calculator import (
    calculate_management_fee,
    calculate_parking_fee
)
```

---

### 1. Tính phí quản lý có Pro-rata

```python
from datetime import date
from decimal import Decimal
from sqlmodel import Session
from app.models.apartment import Apartment
from app.core.utils import calculate_prorated_amount
from app.services.price_calculator import get_current_price
from app.models.price_history import PriceType

def generate_management_fee_bill(session: Session, apartment: Apartment, billing_month: date):
    """
    Tạo hóa đơn phí quản lý (có áp dụng Pro-rata)
    """
    # 1. Lấy đơn giá phí quản lý/m² hiện tại
    unit_price = get_current_price(
        session=session,
        price_type=PriceType.MANAGEMENT_FEE_PER_M2,
        reference_id=None
    )
    # VD: 35,000đ/m²
    
    # 2. Tính phí quản lý trọn gói 1 tháng
    monthly_fee = unit_price * Decimal(str(apartment.area))
    # VD: 35,000 × 65m² = 2,275,000đ
    
    # 3. Áp dụng Pro-rata nếu chuyển vào giữa tháng
    amount = calculate_prorated_amount(
        monthly_fee=monthly_fee,
        billing_date=billing_month,  # VD: date(2024, 12, 31)
        move_in_date=apartment.move_in_date
    )
    
    # 4. Tạo Bill
    from app.models.bill import Bill, BillType
    
    bill = Bill(
        bill_number=f"MF-{apartment.apartment_number}-{billing_month.strftime('%Y%m')}",
        user_id=apartment.resident_id,
        bill_type=BillType.MANAGEMENT_FEE,
        title=f"Phí quản lý tháng {billing_month.month}/{billing_month.year}",
        description=f"Căn hộ {apartment.apartment_number} - {apartment.area}m² × {unit_price:,}đ/m²",
        amount=amount,
        due_date=billing_month + timedelta(days=15),
        status=BillStatus.PENDING
    )
    
    session.add(bill)
    session.commit()
    
    return bill


# ========== VÍ DỤ SỬ DỤNG ==========
apartment = session.get(Apartment, apartment_id)

# Case 1: Chuyển vào đầu tháng (01/12)
apartment.move_in_date = date(2024, 12, 1)
bill = generate_management_fee_bill(session, apartment, date(2024, 12, 31))
# → Tính FULL tháng: 2,275,000đ

# Case 2: Chuyển vào giữa tháng (15/12)
apartment.move_in_date = date(2024, 12, 15)
bill = generate_management_fee_bill(session, apartment, date(2024, 12, 31))
# → Tính 17 ngày: (2,275,000 / 31) × 17 = 1,247,177.42đ

# Case 3: Chuyển vào cuối tháng (25/12)
apartment.move_in_date = date(2024, 12, 25)
bill = generate_management_fee_bill(session, apartment, date(2024, 12, 31))
# → Tính 7 ngày: (2,275,000 / 31) × 7 = 513,709.68đ
```

---

### 2. Tính phí gửi xe có Pro-rata

```python
def generate_parking_fee_bill(
    session: Session,
    apartment: Apartment,
    vehicle_type: str,  # "car", "motorcycle", "bicycle"
    billing_month: date
):
    """
    Tạo hóa đơn phí gửi xe (có áp dụng Pro-rata)
    """
    from app.models.price_history import PriceType
    from app.core.utils import calculate_prorated_amount
    
    # 1. Lấy giá gửi xe tháng
    price_type_map = {
        "car": PriceType.PARKING_CAR,
        "motorcycle": PriceType.PARKING_MOTOR,
        "bicycle": PriceType.PARKING_BICYCLE,
    }
    
    monthly_fee = get_current_price(
        session=session,
        price_type=price_type_map[vehicle_type],
        reference_id=None
    )
    
    # 2. Áp dụng Pro-rata
    amount = calculate_prorated_amount(
        monthly_fee=monthly_fee,
        billing_date=billing_month,
        move_in_date=apartment.move_in_date
    )
    
    # 3. Tạo Bill
    bill = Bill(
        bill_number=f"PK-{vehicle_type.upper()}-{apartment.apartment_number}-{billing_month.strftime('%Y%m')}",
        user_id=apartment.resident_id,
        bill_type=BillType.PARKING,
        title=f"Phí gửi xe {vehicle_type} tháng {billing_month.month}/{billing_month.year}",
        amount=amount,
        due_date=billing_month + timedelta(days=15),
        status=BillStatus.PENDING
    )
    
    session.add(bill)
    session.commit()
    
    return bill


# ========== VÍ DỤ ==========
# Phí gửi ô tô: 1,500,000đ/tháng
# Chuyển vào 20/12 → Ở 12 ngày
bill = generate_parking_fee_bill(
    session,
    apartment,
    vehicle_type="car",
    billing_month=date(2024, 12, 31)
)
# Kết quả: (1,500,000 / 31) × 12 = 580,645.16đ
```

---

### 3. Tính tiền điện/nước (KHÔNG Pro-rata)

```python
from app.core.utils import calculate_metered_consumption

def generate_utility_bill(
    session: Session,
    apartment: Apartment,
    meter_start: Decimal,
    meter_end: Decimal,
    utility_type: str  # "electricity" or "water"
):
    """
    Tạo hóa đơn điện/nước (KHÔNG áp dụng Pro-rata)
    Tính theo chỉ số công tơ thực tế
    """
    # 1. Lấy đơn giá
    price_type = PriceType.ELECTRICITY_TIER_1 if utility_type == "electricity" else PriceType.WATER_TIER_1
    unit_price = get_current_price(session, price_type, None)
    
    # 2. Tính tiền theo tiêu thụ
    amount = calculate_metered_consumption(
        meter_start=meter_start,
        meter_end=meter_end,
        unit_price=unit_price
    )
    
    # 3. Tạo Bill
    unit = "kWh" if utility_type == "electricity" else "m³"
    consumption = meter_end - meter_start
    
    bill = Bill(
        bill_number=f"UT-{utility_type.upper()}-{apartment.apartment_number}-202412",
        user_id=apartment.resident_id,
        bill_type=BillType.UTILITY,
        title=f"Tiền {utility_type} tháng 12/2024",
        description=f"Chỉ số: {meter_start} → {meter_end} ({consumption} {unit}) × {unit_price:,}đ",
        amount=amount,
        due_date=date(2024, 12, 31) + timedelta(days=15),
        status=BillStatus.PENDING
    )
    
    session.add(bill)
    session.commit()
    
    return bill


# ========== VÍ DỤ ==========
# Căn hộ chuyển vào 15/12
apartment.move_in_date = date(2024, 12, 15)
apartment.electricity_meter_start = Decimal("0.00")  # Chỉ số lúc bàn giao

# Cuối tháng đọc chỉ số: 50 kWh
meter_end = Decimal("50.00")

bill = generate_utility_bill(
    session,
    apartment,
    meter_start=apartment.electricity_meter_start,
    meter_end=meter_end,
    utility_type="electricity"
)
# Kết quả: 50 kWh × 1,806đ = 90,300đ
# → KHÔNG chia theo ngày, tính đủ tiêu thụ thực tế!
```

---

### 4. Tạo tất cả hóa đơn tháng (Auto Bill Generation)

```python
from sqlmodel import select

def generate_monthly_bills_for_all(session: Session, billing_month: date):
    """
    Tạo tất cả hóa đơn cho tháng (chạy vào ngày 25 hàng tháng)
    """
    # Lấy tất cả căn hộ đang OCCUPIED
    stmt = select(Apartment).where(Apartment.status == ApartmentStatus.OCCUPIED)
    apartments = session.exec(stmt).all()
    
    bills_created = []
    
    for apt in apartments:
        if apt.resident_id is None:
            continue  # Bỏ qua căn không có cư dân
        
        # 1. Tạo hóa đơn phí quản lý (có Pro-rata)
        mgmt_bill = generate_management_fee_bill(session, apt, billing_month)
        bills_created.append(mgmt_bill)
        
        # 2. Tạo hóa đơn phí gửi xe (nếu có - có Pro-rata)
        # TODO: Kiểm tra cư dân có đăng ký xe không
        
        # 3. Tạo hóa đơn điện/nước (KHÔNG Pro-rata)
        # TODO: Đọc chỉ số công tơ từ thiết bị IoT hoặc nhập tay
    
    print(f"✅ Đã tạo {len(bills_created)} hóa đơn cho tháng {billing_month.month}/{billing_month.year}")
    return bills_created


# ========== CHẠY TỰ ĐỘNG MỖI THÁNG ==========
# Scheduler: Ngày 25 hàng tháng
from datetime import date

billing_month = date(2024, 12, 31)  # Cuối tháng 12
bills = generate_monthly_bills_for_all(session, billing_month)
```

---

## 📋 Quy trình nghiệp vụ

### Khi cư dân chuyển vào

1. **Admin bàn giao nhà** (ngày 15/12/2024):
   ```python
   apartment.status = ApartmentStatus.OCCUPIED
   apartment.resident_id = user.id
   apartment.move_in_date = date(2024, 12, 15)
   apartment.electricity_meter_start = Decimal("1250.00")  # Chỉ số điện
   apartment.water_meter_start = Decimal("85.50")  # Chỉ số nước
   session.commit()
   ```

2. **Hệ thống tự động**:
   - Ngày 25/12 → Tạo hóa đơn phí quản lý (Pro-rata 17 ngày)
   - Ngày 31/12 → Đọc chỉ số điện/nước → Tạo hóa đơn tiện ích

3. **Cư dân nhận hóa đơn**:
   - Phí quản lý: 1,247,177đ (17/31 tháng)
   - Điện: Tính theo tiêu thụ thực tế từ ngày 15-31

### Tháng tiếp theo (Tháng 1/2025)

```python
# Tháng 1: Cư dân đã ở từ tháng trước
apartment.move_in_date = date(2024, 12, 15)  # Giữ nguyên

# Tạo bill tháng 1
bill = generate_management_fee_bill(session, apartment, date(2025, 1, 31))
# → Tính FULL tháng 1 vì move_in_date < 01/01/2025
```

---

## ⚠️ Lưu ý quan trọng

### 1. Số ngày trong tháng KHÔNG CỐ ĐỊNH

```python
# ❌ SAI - Chia cứng cho 30
daily_rate = monthly_fee / 30

# ✅ ĐÚNG - Dùng calendar.monthrange
import calendar
_, num_days = calendar.monthrange(2024, 2)  # Tháng 2/2024 = 29 ngày
daily_rate = monthly_fee / num_days
```

### 2. Nhớ cộng 1 khi tính số ngày

```python
# ❌ SAI
days_used = (last_day - start_date).days

# ✅ ĐÚNG - Tính cả ngày chuyển vào
days_used = (last_day - start_date).days + 1
```

### 3. Điện/Nước KHÔNG chia ngày

```python
# ❌ SAI - Chia Pro-rata cho điện
electricity_bill = calculate_prorated_amount(...)

# ✅ ĐÚNG - Tính theo tiêu thụ
electricity_bill = calculate_metered_consumption(meter_start, meter_end, unit_price)
```

### 4. Làm tròn đúng cách

```python
from decimal import Decimal

# ✅ ĐÚNG - Dùng Decimal và quantize
amount = Decimal("774193.5483870968")
rounded = amount.quantize(Decimal("0.01"))  # 774,193.55
```

---

## 🎨 Hiển thị trên Frontend

### Component hiển thị Bill

```typescript
interface Bill {
  id: number;
  title: string;
  amount: number;
  description: string;
  is_prorated: boolean;  // Có áp dụng Pro-rata không
  billing_period: string; // "Tháng 12/2024"
}

function BillCard({ bill }: { bill: Bill }) {
  return (
    <Card>
      <h3>{bill.title}</h3>
      <p className="amount">{formatCurrency(bill.amount)}</p>
      
      {bill.is_prorated && (
        <Badge color="info">
          ⏱️ Tính theo tỷ lệ (Pro-rata)
        </Badge>
      )}
      
      <p className="description">{bill.description}</p>
    </Card>
  );
}
```

### Tooltip giải thích

```typescript
<Tooltip>
  <TooltipTrigger>
    <InfoIcon /> Tại sao số tiền lẻ?
  </TooltipTrigger>
  <TooltipContent>
    Phí được tính theo tỷ lệ thời gian sử dụng (Pro-rata).
    Bạn chuyển vào ngày 15/12, chỉ phải trả 17/31 tháng.
  </TooltipContent>
</Tooltip>
```

---

## 📊 Bảng tổng hợp các trường hợp

| Ngày chuyển vào | Tháng | Số ngày | Tỷ lệ | Phí quản lý (2tr) | Phí gửi xe (1.5tr) |
|----------------|-------|---------|-------|-------------------|-------------------|
| 01/12/2024 | 12 (31 ngày) | 31/31 | 100% | 2,000,000đ | 1,500,000đ |
| 05/12/2024 | 12 (31 ngày) | 27/31 | 87% | 1,741,935đ | 1,306,452đ |
| 15/12/2024 | 12 (31 ngày) | 17/31 | 55% | 1,096,774đ | 822,581đ |
| 20/12/2024 | 12 (31 ngày) | 12/31 | 39% | 774,194đ | 580,645đ |
| 25/12/2024 | 12 (31 ngày) | 7/31 | 23% | 451,613đ | 338,710đ |

---

## ✅ Checklist triển khai

- [x] Tạo utility function `calculate_prorated_amount()`
- [x] Thêm field `move_in_date` vào bảng `apartments`
- [x] Thêm field `electricity_meter_start`, `water_meter_start`
- [x] Cập nhật seed data với move_in_date khác nhau
- [ ] Tạo API endpoint `/admin/bills/generate-monthly`
- [ ] Tạo Scheduler chạy tự động ngày 25
- [ ] Hiển thị badge "Pro-rata" trên frontend
- [ ] Thêm tooltip giải thích cho người dùng
- [ ] Test case: Tháng 2 (28/29 ngày)
- [ ] Test case: Chuyển vào ngày cuối tháng

---

**✅ Hệ thống Pro-rata đã sẵn sàng!**
