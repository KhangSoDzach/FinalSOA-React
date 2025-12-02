# 📊 Hướng dẫn tính toán giá dịch vụ

## 🎯 Tổng quan

Hệ thống đã được chuẩn hóa để tính tiền dịch vụ theo **thực tế nghiệp vụ**, sử dụng bảng `price_histories` để lưu giá linh hoạt theo thời gian.

---

## 📋 Các đơn vị tính (ServiceUnit Enum)

| Enum Value | Tên tiếng Việt | Ứng dụng | Công thức |
|-----------|---------------|----------|-----------|
| `PER_HOUR` | Theo giờ | Dọn dẹp, Thuê BBQ, Pet Sitting | `Giá × Số giờ` |
| `PER_M2` | Theo m² | Phí quản lý | `Giá × Diện tích căn hộ` |
| `PER_MONTH` | Theo tháng | Vé Gym, Vé hồ bơi, Parking | `Giá × Số tháng` |
| `PER_JOB` | Theo vụ việc | Sửa chữa điện/nước/khóa | `Giá cố định` |
| `PER_PACKAGE` | Theo gói | Dọn dẹp theo số phòng ngủ | `Giá × Số gói` |
| `PER_SLOT` | Theo khung giờ | Thuê phòng họp (4h/slot) | `Giá × Số slot` |
| `PER_VEHICLE` | Theo xe | Phí gửi xe tháng | `Giá × Số xe` |
| `PER_UNIT` | Theo đơn vị | Bình nước, kg giặt, bộ sofa | `Giá × Số lượng` |

---

## 🔧 Cách sử dụng trong code

### 1. Import module tính giá

```python
from app.services.price_calculator import (
    calculate_service_price,
    calculate_parking_fee,
    calculate_management_fee,
    get_current_price
)
```

### 2. Tính giá dịch vụ theo booking

```python
from sqlmodel import Session
from app.models.service import Service
from decimal import Decimal

def create_booking_example(session: Session):
    # Lấy service
    service = session.get(Service, service_id)
    
    # Case 1: Dọn dẹp theo giờ (unit = PER_HOUR)
    total = calculate_service_price(
        service=service,
        quantity=3,  # 3 giờ
        session=session
    )
    # Kết quả: 80,000đ/giờ × 3 = 240,000đ
    
    # Case 2: Gói dọn 2PN (unit = PER_PACKAGE)
    total = calculate_service_price(
        service=service_package,
        quantity=1,  # 1 gói
        session=session
    )
    # Kết quả: 350,000đ (giá cố định cho gói 2PN)
    
    # Case 3: Sửa chữa điện lạnh (unit = PER_JOB)
    total = calculate_service_price(
        service=service_repair,
        quantity=1,  # Luôn = 1
        session=session
    )
    # Kết quả: 200,000đ (phí nhân công, chưa bao gồm vật tư)
```

### 3. Tính phí quản lý

```python
from app.models.apartment import Apartment

def generate_monthly_management_bill(session: Session):
    apartment = session.get(Apartment, apartment_id)
    
    total = calculate_management_fee(
        session=session,
        apartment=apartment
    )
    # Kết quả: 35,000đ/m² × 65m² = 2,275,000đ
```

### 4. Tính phí gửi xe

```python
def generate_parking_bill(session: Session):
    # Phí xe ô tô
    car_fee = calculate_parking_fee(
        session=session,
        vehicle_type="car",
        quantity=1
    )
    # Kết quả: 1,500,000đ/tháng (theo giá hiện tại)
    
    # Phí xe máy (có 2 xe)
    motor_fee = calculate_parking_fee(
        session=session,
        vehicle_type="motorcycle",
        quantity=2
    )
    # Kết quả: 120,000đ × 2 = 240,000đ
```

---

## 💡 Ví dụ thực tế

### Kịch bản 1: Cư dân đặt dọn dẹp theo giờ

**Nghiệp vụ:**
- Dịch vụ: "Dọn dẹp căn hộ theo giờ"
- Đơn giá: 80,000đ/giờ (từ price_histories)
- Cư dân đặt: 3 giờ

**Code:**
```python
service = session.exec(
    select(Service).where(Service.name == "Dọn dẹp căn hộ theo giờ")
).first()

total = calculate_service_price(
    service=service,
    quantity=3,
    session=session
)

booking = ServiceBooking(
    service_id=service.id,
    user_id=user.id,
    quantity=3,
    unit_price=Decimal("80000"),  # Lưu lại giá tại thời điểm đặt
    total_amount=total,  # 240,000đ
    ...
)
```

---

### Kịch bản 2: Tạo hóa đơn phí quản lý hàng tháng

**Nghiệp vụ:**
- Căn hộ B101: 55m²
- Đơn giá quản lý: 35,000đ/m² (áp dụng từ 01/12/2024)

**Code:**
```python
from app.models.bill import Bill, BillType

apartment = session.exec(
    select(Apartment).where(Apartment.apartment_number == "B101")
).first()

total = calculate_management_fee(
    session=session,
    apartment=apartment
)

bill = Bill(
    bill_number=f"MF-{apartment.apartment_number}-202412",
    user_id=apartment.resident_id,
    bill_type=BillType.MANAGEMENT_FEE,
    title=f"Phí quản lý tháng 12/2024 - Căn {apartment.apartment_number}",
    amount=total,  # 55m² × 35,000đ = 1,925,000đ
    due_date=datetime(2024, 12, 15),
    ...
)
```

---

### Kịch bản 3: Gói dọn dẹp theo số phòng ngủ

**Nghiệp vụ:**
- Dịch vụ: "Gói Dọn dẹp Căn 2PN"
- Giá trọn gói: 350,000đ
- **KHÔNG** tính theo m² hay giờ

**Code:**
```python
service = session.exec(
    select(Service).where(Service.name == "Gói Dọn dẹp Căn 2PN")
).first()

# Quantity luôn = 1 vì đây là gói
total = calculate_service_price(
    service=service,
    quantity=1,
    session=session
)
# Kết quả: 350,000đ
```

---

### Kịch bản 4: Sửa chữa điện lạnh (Vật tư tính riêng)

**Nghiệp vụ:**
- Phí nhân công cố định: 200,000đ/lần
- Vật tư (gas, linh kiện): Tính riêng sau khi thợ kiểm tra

**Code:**
```python
service = session.exec(
    select(Service).where(Service.name == "Sửa chữa điện lạnh")
).first()

# Booking ban đầu chỉ tính phí nhân công
booking = ServiceBooking(
    service_id=service.id,
    quantity=1,
    unit_price=Decimal("200000"),
    total_amount=Decimal("200000"),  # Chỉ phí nhân công
    notes="Vật tư sẽ tính sau khi kiểm tra",
    ...
)

# Sau khi hoàn thành, admin thêm bill vật tư riêng
material_bill = Bill(
    bill_type=BillType.SERVICE,
    title="Vật tư sửa điện lạnh - Căn A101",
    description="Gas R32: 1 bình × 300k, Linh kiện: 150k",
    amount=Decimal("450000"),
    ...
)
```

---

## 📊 Quản lý giá theo thời gian

### Cấu trúc bảng price_histories

```sql
CREATE TABLE price_histories (
    id SERIAL PRIMARY KEY,
    type price_type NOT NULL,        -- 'service', 'parking_car', 'management_fee_per_m2', etc.
    reference_id INTEGER,             -- service.id nếu type = 'service'
    price DECIMAL(10, 2) NOT NULL,    -- Giá trị
    description VARCHAR(200),         -- Lý do thay đổi
    effective_from TIMESTAMP,         -- Ngày bắt đầu áp dụng
    created_by INTEGER,
    created_at TIMESTAMP
);
```

### Lấy giá hiện tại (tự động chọn giá mới nhất)

```python
from app.models.price_history import PriceType
from app.services.price_calculator import get_current_price

# Lấy giá phí quản lý hiện tại
current_mgmt_fee = get_current_price(
    session=session,
    price_type=PriceType.MANAGEMENT_FEE_PER_M2,
    reference_id=None
)
# Kết quả: 35,000đ (giá mới nhất có effective_from <= now)

# Lấy giá dịch vụ ID=1
current_price = get_current_price(
    session=session,
    price_type=PriceType.SERVICE,
    reference_id=1  # service_id
)
```

### Lấy giá tại thời điểm cụ thể

```python
from datetime import datetime

# Xem giá dịch vụ vào ngày 10/12/2024
price_at_date = get_current_price(
    session=session,
    price_type=PriceType.SERVICE,
    reference_id=service_id,
    effective_date=datetime(2024, 12, 10)
)
```

---

## ⚠️ Lưu ý quan trọng

### 1. Đơn vị `PER_M2` BẮT BUỘC có `apartment_area`

```python
# ✅ ĐÚNG
total = calculate_service_price(
    service=management_service,  # unit = PER_M2
    quantity=1,
    session=session,
    apartment_area=Decimal("65.0")
)

# ❌ SAI - Thiếu apartment_area
total = calculate_service_price(
    service=management_service,
    quantity=1,
    session=session
)
# → ValueError: Dịch vụ tính theo m² nhưng không có thông tin diện tích
```

### 2. Đơn vị `PER_JOB` thường có `quantity = 1`

```python
# Sửa chữa điện/nước/khóa luôn tính 1 lần (trừ khi khách yêu cầu sửa nhiều vị trí)
total = calculate_service_price(
    service=repair_service,  # unit = PER_JOB
    quantity=1,
    session=session
)
```

### 3. Giá trong `ServiceBooking` phải lưu lại tại thời điểm đặt

```python
# Lưu unit_price để đảm bảo giá không thay đổi sau khi booking
booking = ServiceBooking(
    service_id=service.id,
    unit_price=current_price,  # Giá tại thời điểm đặt
    quantity=3,
    total_amount=current_price * 3,
    ...
)
```

### 4. Không tạo `ServiceBooking` cho phí quản lý/parking

Phí quản lý và parking là **hóa đơn định kỳ (Bill)**, KHÔNG phải booking:

```python
# ❌ SAI - Không tạo ServiceBooking cho phí quản lý
booking = ServiceBooking(
    service_id=management_service.id,  # Sai!!!
    ...
)

# ✅ ĐÚNG - Tạo Bill trực tiếp
bill = Bill(
    bill_type=BillType.MANAGEMENT_FEE,
    amount=calculate_management_fee(session, apartment),
    ...
)
```

---

## 🎨 Frontend Integration

### Hiển thị giá dịch vụ

```typescript
// services/api.ts
export const getServicePrice = async (serviceId: number) => {
  const response = await api.get(`/services/${serviceId}/current-price`);
  return response.data;
};

// Component
function ServiceCard({ service }) {
  const [price, setPrice] = useState(null);
  
  useEffect(() => {
    getServicePrice(service.id).then(setPrice);
  }, [service.id]);
  
  return (
    <div>
      <h3>{service.name}</h3>
      <p>{formatCurrency(price)} / {getUnitLabel(service.unit)}</p>
    </div>
  );
}

function getUnitLabel(unit: string) {
  const labels = {
    'per_hour': 'giờ',
    'per_m2': 'm²',
    'per_month': 'tháng',
    'per_job': 'lần',
    'per_package': 'gói',
    'per_slot': 'slot',
    'per_vehicle': 'xe',
    'per_unit': 'đơn vị'
  };
  return labels[unit] || unit;
}
```

---

## 📝 Tóm tắt

| Nghiệp vụ | Đơn vị tính | Công thức | Ví dụ |
|----------|-------------|-----------|-------|
| Dọn dẹp theo giờ | `PER_HOUR` | `Giá × Giờ` | 80k × 3h = 240k |
| Gói dọn 2PN | `PER_PACKAGE` | `Giá × 1` | 350k |
| Sửa điện lạnh | `PER_JOB` | `Giá` | 200k (+ vật tư) |
| Phí quản lý | `PER_M2` | `Giá × m²` | 35k × 65m² = 2,275k |
| Vé Gym tháng | `PER_MONTH` | `Giá × Tháng` | 500k/tháng |
| Thuê BBQ | `PER_HOUR` | `Giá × Giờ` | 200k × 4h = 800k |
| Thuê phòng họp | `PER_SLOT` | `Giá × Slot` | 300k/slot (4h) |
| Gửi xe ô tô | `PER_VEHICLE` | `Giá × Xe` | 1.5tr/xe |
| Giặt ủi | `PER_UNIT` | `Giá × kg` | 25k × 5kg = 125k |

---

**✅ Hệ thống đã sẵn sàng để sử dụng!**
