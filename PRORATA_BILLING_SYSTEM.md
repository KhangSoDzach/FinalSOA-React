# 📅 Hệ thống Pro-rata Bill Generation - Hoàn thiện

## 🎯 Tổng quan

Hệ thống tự động tạo hóa đơn hàng tháng với tính năng **Pro-rata** (tính theo tỷ lệ) cho cư dân chuyển vào giữa tháng.

---

## ✅ Các tính năng đã hoàn thiện

### 1️⃣ **Service Layer** (`app/services/bill_service.py`)

**Chức năng:**
- Tạo hóa đơn phí quản lý (Management Fee)
- Tạo hóa đơn phí gửi xe (Parking Fee)
- Tạo hàng loạt hóa đơn cho tất cả căn hộ

**Functions:**

#### `generate_management_fee_bill()`
```python
def generate_management_fee_bill(
    session: Session,
    apartment: Apartment,
    billing_month: date,
    commit: bool = True
) -> Bill
```
- Tính phí quản lý = `unit_price × apartment.area`
- Áp dụng Pro-rata nếu `move_in_date` giữa tháng
- Đánh dấu `is_prorated = True` nếu cần
- Tạo description chi tiết kèm ngày chuyển vào

**Ví dụ:**
```python
# Căn A202 - 60m² - Chuyển vào 15/12/2024
# Unit price: 50,000đ/m²
# Tháng 12 có 31 ngày
# → Tổng phí = 50,000 × 60 = 3,000,000đ
# → Days used = (31 - 15) + 1 = 17 ngày
# → Pro-rata = (3,000,000 / 31) × 17 = 1,645,161đ ✅
```

#### `generate_parking_fee_bill()`
```python
def generate_parking_fee_bill(
    session: Session,
    apartment: Apartment,
    vehicle: Vehicle,
    billing_month: date,
    commit: bool = True
) -> Bill
```
- Lấy giá gửi xe theo loại (car/motorcycle/bicycle)
- Áp dụng Pro-rata theo `move_in_date`
- Tạo bill_number theo format: `PK-{TYPE}-{APT}-{YYYYMM}`

#### `generate_monthly_bills_for_all()`
```python
def generate_monthly_bills_for_all(
    session: Session,
    billing_month: Optional[date] = None,
    include_parking: bool = True
) -> Dict[str, any]
```
- Tạo bills cho tất cả căn OCCUPIED
- Trả về statistics:
  - `total_apartments`: Tổng số căn
  - `management_bills_created`: Số bill phí quản lý
  - `parking_bills_created`: Số bill gửi xe
  - `total_amount`: Tổng tiền
  - `errors`: Danh sách lỗi (nếu có)

---

### 2️⃣ **API Endpoints** (`app/api/routes/bills.py`)

#### 🔹 `POST /api/v1/bills/admin/generate-monthly`
**Tạo tất cả hóa đơn tự động cho tháng**

**Request:**
```json
{
  "month": 12,        // Optional, default = current month
  "year": 2024,       // Optional, default = current year
  "include_parking": true  // Optional, default = true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã tạo hóa đơn tháng 12/2024",
  "statistics": {
    "total_apartments": 50,
    "management_bills_created": 50,
    "parking_bills_created": 35,
    "total_amount": 150000000,
    "errors": []
  }
}
```

**Yêu cầu:** Accountant/Manager role

---

#### 🔹 `POST /api/v1/bills/admin/generate-for-apartment/{apartment_id}`
**Tạo hóa đơn cho 1 căn hộ cụ thể**

**Path Parameter:**
- `apartment_id`: ID căn hộ

**Query Parameters:**
```
?month=12&year=2024
```

**Response:**
```json
[
  {
    "id": 123,
    "bill_number": "MF-A202-202412",
    "title": "Phí quản lý tháng 12/2024",
    "amount": 1645161.29,
    "is_prorated": true,
    "description": "Căn hộ A202 - 60m² × 50,000đ/m²\n⏱️ Tính theo tỷ lệ: Chuyển vào 15/12/2024",
    ...
  },
  {
    "id": 124,
    "bill_number": "PK-MOTORCYCLE-A202-202412",
    "title": "Phí gửi xe tháng 12/2024",
    "amount": 290322.58,
    "is_prorated": true,
    ...
  }
]
```

**Yêu cầu:** Accountant/Manager role

---

### 3️⃣ **Scheduler** (`app/core/scheduler.py`)

**APScheduler - Tự động chạy ngày 25 hàng tháng**

#### Cấu hình:
```python
scheduler.add_job(
    monthly_bill_generation_job,
    trigger=CronTrigger(day=25, hour=0, minute=0),
    id="monthly_bill_generation",
    name="Tạo hóa đơn tháng tự động"
)
```

#### Job Logic:
1. **Ngày 25** → Tạo hóa đơn cho **tháng tiếp theo**
2. Ví dụ: 25/12/2024 → Tạo bill cho tháng 1/2025
3. Gọi `generate_monthly_bills_for_all()` với `billing_month = cuối tháng tiếp theo`
4. Log kết quả vào console

#### Manual Trigger (Testing):
```python
from app.core.scheduler import run_job_manually
run_job_manually()
```

#### Khởi động Scheduler:
```python
# Trong app/main.py
@app.on_event("startup")
async def startup_event():
    await init_db()
    from app.core.scheduler import start_scheduler
    start_scheduler()

@app.on_event("shutdown")
async def shutdown_event():
    from app.core.scheduler import stop_scheduler
    stop_scheduler()
```

---

### 4️⃣ **Database Schema** (`app/models/bill.py`)

**Thêm field `is_prorated`:**

```python
class Bill(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    bill_number: str = Field(index=True, unique=True)
    user_id: int = Field(foreign_key="user.id")
    bill_type: BillType
    title: str
    description: Optional[str] = None
    amount: Decimal = Field(decimal_places=2)
    due_date: datetime
    status: BillStatus = Field(default=BillStatus.PENDING)
    paid_at: Optional[datetime] = None
    is_prorated: bool = Field(default=False)  # ✅ NEW FIELD
```

**Schema Response:**
```python
class BillResponse(BillBase):
    id: int
    bill_number: str
    user_id: int
    status: BillStatus
    is_prorated: bool = False  # ✅ Badge hiển thị Pro-rata
    created_at: Optional[datetime] = None 
    updated_at: Optional[datetime] = None 
    paid_at: Optional[datetime] = None
```

---

### 5️⃣ **Frontend Badge** (`src/components/ProRataBadge.tsx`)

**React Component với Material-UI:**

```tsx
import { Chip, Tooltip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export const ProRataBadge: React.FC<ProRataBadgeProps> = ({
  tooltipText = "Hóa đơn được tính theo tỷ lệ số ngày ở thực tế",
  size = 'small',
}) => {
  return (
    <Tooltip title={tooltipText} arrow>
      <StyledChip
        icon={<AccessTimeIcon />}
        label="Pro-rata"
        size={size}
        variant="filled"
      />
    </Tooltip>
  );
};
```

**Sử dụng trong Bills.tsx:**
```tsx
import ProRataBadge from '../components/ProRataBadge';

{bill.is_prorated && (
  <ProRataBadge 
    tooltipText="Hóa đơn được tính theo tỷ lệ số ngày ở thực tế" 
  />
)}
```

**Cập nhật Interface:**
```typescript
interface Bill {
  id: number; 
  title: string;
  type: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'unpaid' | 'overdue' | 'cancelled';
  description: string;
  is_prorated?: boolean;  // ✅ NEW FIELD
}
```

---

## 📦 Dependencies

**Backend (`requirements.txt`):**
```txt
APScheduler==3.10.4  # ✅ Thêm mới
```

**Install:**
```bash
pip install APScheduler
```

---

## 🚀 Cách sử dụng

### 1. Tạo hóa đơn thủ công (Admin)

**Tạo tất cả bills cho tháng hiện tại:**
```bash
POST http://localhost:8000/api/v1/bills/admin/generate-monthly
Content-Type: application/json
Authorization: Bearer <admin_token>

{}
```

**Tạo bill cho tháng cụ thể:**
```bash
POST http://localhost:8000/api/v1/bills/admin/generate-monthly
Content-Type: application/json

{
  "month": 1,
  "year": 2025,
  "include_parking": true
}
```

**Tạo bill cho 1 căn hộ:**
```bash
POST http://localhost:8000/api/v1/bills/admin/generate-for-apartment/5
Content-Type: application/json

{
  "month": 12,
  "year": 2024
}
```

---

### 2. Tự động tạo bills (Scheduler)

**Scheduler tự động chạy:**
- **Thời điểm:** 00:00 ngày 25 hàng tháng
- **Hành động:** Tạo bills cho tháng tiếp theo
- **Log:** Check console để xem kết quả

**Kiểm tra scheduler status:**
```python
from app.core.scheduler import scheduler
print(scheduler.running)  # True/False
print(scheduler.get_jobs())  # List all jobs
```

---

### 3. Frontend - Hiển thị Badge

**Bills.tsx (Resident):**
```tsx
<HStack spacing="3" mb="2">
  <Text fontWeight="semibold" fontSize="lg">
    {bill.title}
  </Text>
  <Badge colorScheme={getStatusColor(bill.status)}>
    {bill.status.toUpperCase()}
  </Badge>
  {bill.is_prorated && (
    <ProRataBadge 
      tooltipText="Hóa đơn được tính theo tỷ lệ số ngày ở thực tế" 
    />
  )}
</HStack>
```

**AdminBills.tsx / AccountantBills.tsx:**
- Interface đã có field `is_prorated?: boolean`
- Có thể thêm badge tương tự trong table cells

---

## 🧪 Testing

### Test Case 1: Chuyển vào đầu tháng
```python
# Apartment A101 - move_in_date = 2024-12-01
# Monthly fee = 3,000,000đ
# Tháng 12 có 31 ngày
# → Full month → Amount = 3,000,000đ
# → is_prorated = False ✅
```

### Test Case 2: Chuyển vào giữa tháng
```python
# Apartment A202 - move_in_date = 2024-12-15
# Monthly fee = 3,000,000đ
# Days used = (31 - 15) + 1 = 17 ngày
# → Amount = (3,000,000 / 31) × 17 = 1,645,161.29đ
# → is_prorated = True ✅
```

### Test Case 3: Chuyển vào cuối tháng
```python
# Apartment A305 - move_in_date = 2024-12-25
# Monthly fee = 3,000,000đ
# Days used = (31 - 25) + 1 = 7 ngày
# → Amount = (3,000,000 / 31) × 7 = 677,419.35đ
# → is_prorated = True ✅
```

---

## 📊 Database Migration (Nếu cần)

**Thêm column `is_prorated` vào table `bill`:**

```sql
ALTER TABLE bill 
ADD COLUMN is_prorated BOOLEAN DEFAULT FALSE;
```

**Update existing bills (Optional):**
```sql
UPDATE bill
SET is_prorated = FALSE
WHERE is_prorated IS NULL;
```

---

## 🔍 Troubleshooting

### Issue 1: Scheduler không chạy
**Kiểm tra:**
```python
from app.core.scheduler import scheduler
print(scheduler.running)  # Phải là True
```

**Restart app:**
```bash
uvicorn app.main:app --reload
```

---

### Issue 2: Bills không có is_prorated
**Kiểm tra:**
1. Database có column `is_prorated` chưa?
2. Service layer có set `is_prorated=True` chưa?
3. Schema có return field này chưa?

**Test API:**
```bash
GET http://localhost:8000/api/v1/bills/my-bills
```

---

### Issue 3: Pro-rata amount không đúng
**Debug:**
```python
from app.core.utils import calculate_prorated_amount
from datetime import date

result = calculate_prorated_amount(
    monthly_fee=3000000,
    billing_date=date(2024, 12, 31),
    move_in_date=date(2024, 12, 15)
)
print(result)  # Should be 1645161.29
```

---

## 📝 Tài liệu liên quan

1. **PRORATA_GUIDE.md** - Hướng dẫn chi tiết về Pro-rata calculation
2. **PRICE_CALCULATION_GUIDE.md** - Hướng dẫn tính giá dịch vụ
3. **app/core/utils.py** - Utility functions
4. **tests/test_prorata.py** - Test suite

---

## 🎉 Kết luận

Hệ thống Pro-rata Bill Generation đã hoàn thiện với:

✅ Service layer cho bill generation  
✅ API endpoints cho admin  
✅ Scheduler tự động chạy ngày 25  
✅ Database schema với is_prorated field  
✅ Frontend Badge component  
✅ Documentation đầy đủ  

**Ready for production! 🚀**
