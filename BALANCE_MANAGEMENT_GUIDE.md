# Hướng Dẫn Quản Lý Số Dư (Balance Management)

## Tổng Quan

Hệ thống đã được tích hợp tính năng quản lý số dư cho người dùng, cho phép:
- Người dùng nạp tiền vào tài khoản
- Admin quản lý số dư của người dùng (nạp/trừ tiền)
- Thanh toán hóa đơn tự động trừ từ số dư
- Kiểm tra số dư trước khi thanh toán

## Cấu Trúc Database

### Model User
```python
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str
    email: str
    full_name: str
    balance: Decimal = Field(default=Decimal("0.00"))  # SỐ DƯ
    # ... các trường khác
```

### Schema
```python
class BalanceUpdate(BaseModel):
    amount: float  # Số tiền cần thay đổi

class BalanceResponse(BaseModel):
    user_id: int
    balance: float
    message: str
```

## API Endpoints

### 1. Nạp Tiền (User)
**Endpoint:** `POST /api/users/top-up`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "amount": 500000
}
```

**Response:**
```json
{
  "user_id": 1,
  "balance": 500000.0,
  "message": "Nạp tiền thành công 500,000 VNĐ"
}
```

**Validation:**
- Số tiền phải > 0
- Yêu cầu đăng nhập

### 2. Cập Nhật Số Dư (Admin)
**Endpoint:** `POST /api/users/{user_id}/update-balance`

**Headers:**
```
Authorization: Bearer {admin_access_token}
```

**Request Body:**
```json
{
  "amount": 100000  // Số dương: nạp tiền, Số âm: trừ tiền
}
```

**Response:**
```json
{
  "user_id": 5,
  "balance": 600000.0,
  "message": "Nạp 100,000 VNĐ thành công. Số dư mới: 600,000 VNĐ"
}
```

**Validation:**
- Chỉ Admin mới được sử dụng
- Số dư sau khi cập nhật không được âm
- User phải tồn tại

### 3. Xem Số Dư Hiện Tại
**Endpoint:** `GET /api/users/me`

**Response:**
```json
{
  "id": 1,
  "username": "user123",
  "email": "user@example.com",
  "full_name": "Nguyễn Văn A",
  "balance": 500000.0,  // SỐ DƯ HIỆN TẠI
  // ... các trường khác
}
```

## Quy Trình Thanh Toán Hóa Đơn

### Bước 1: Request Thanh Toán
```http
POST /api/bills/request-pay
{
  "bill_id": 1
}
```

**Kiểm tra:**
- ✅ Hóa đơn tồn tại
- ✅ User sở hữu hóa đơn
- ✅ Hóa đơn ở trạng thái PENDING
- ✅ **Số dư >= Số tiền hóa đơn**
- ✅ Email tồn tại để gửi OTP

### Bước 2: Xác Thực OTP
```http
POST /api/bills/verify-otp
{
  "payment_id": 1,
  "otp": "123456"
}
```

**Xử lý:**
1. Kiểm tra OTP hợp lệ
2. Kiểm tra số dư còn đủ
3. **Trừ số dư:** `user.balance -= bill.amount`
4. Cập nhật hóa đơn: `bill.status = PAID`
5. Cập nhật payment: `payment.status = COMPLETED`

## Tính Năng Tự Động

### Tạo Hóa Đơn Hàng Tháng
**Endpoint:** `POST /api/bills/generate-monthly-fees`

**Chức năng:**
- Tự động tạo hóa đơn phí quản lý cho người thuê (RENTER)
- Dựa trên `apartment.monthly_fee`
- Kiểm tra không tạo trùng lặp theo tháng/năm

**Lưu ý:** 
- Chỉ tạo cho user có `occupier = RENTER`
- Hóa đơn được tạo với trạng thái `PENDING`
- User cần đủ số dư để thanh toán

## Testing

### Test Nạp Tiền
```python
import requests

# Login
login_response = requests.post(
    "http://localhost:8000/api/auth/login",
    json={"username": "user123", "password": "password"}
)
token = login_response.json()["access_token"]

# Nạp tiền
top_up_response = requests.post(
    "http://localhost:8000/api/users/top-up",
    headers={"Authorization": f"Bearer {token}"},
    json={"amount": 500000}
)
print(top_up_response.json())
```

### Test Admin Cập Nhật Số Dư
```python
# Admin login
admin_login = requests.post(
    "http://localhost:8000/api/auth/login",
    json={"username": "admin", "password": "admin_password"}
)
admin_token = admin_login.json()["access_token"]

# Cập nhật số dư user
update_response = requests.post(
    "http://localhost:8000/api/users/5/update-balance",
    headers={"Authorization": f"Bearer {admin_token}"},
    json={"amount": 1000000}  # Nạp 1 triệu
)
print(update_response.json())

# Trừ tiền
deduct_response = requests.post(
    "http://localhost:8000/api/users/5/update-balance",
    headers={"Authorization": f"Bearer {admin_token}"},
    json={"amount": -50000}  # Trừ 50k
)
print(deduct_response.json())
```

### Test Thanh Toán
```python
# 1. Nạp tiền trước
requests.post(
    "http://localhost:8000/api/users/top-up",
    headers={"Authorization": f"Bearer {token}"},
    json={"amount": 1000000}
)

# 2. Request thanh toán
payment_request = requests.post(
    "http://localhost:8000/api/bills/request-pay",
    headers={"Authorization": f"Bearer {token}"},
    json={"bill_id": 1}
)
payment_id = payment_request.json()["payment_id"]

# 3. Verify OTP (check email để lấy OTP)
verify_response = requests.post(
    "http://localhost:8000/api/bills/verify-otp",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "payment_id": payment_id,
        "otp": "123456"  # OTP từ email
    }
)
print(verify_response.json())

# 4. Kiểm tra số dư sau thanh toán
user_info = requests.get(
    "http://localhost:8000/api/users/me",
    headers={"Authorization": f"Bearer {token}"}
)
print(f"Số dư còn lại: {user_info.json()['balance']}")
```

## Error Handling

### Lỗi Thường Gặp

1. **Số dư không đủ khi request payment:**
```json
{
  "detail": "Số dư không đủ để thanh toán"
}
```

2. **Số dư âm khi admin update:**
```json
{
  "detail": "Số dư không thể âm. Số dư hiện tại: 100,000, Thay đổi: -200,000"
}
```

3. **Số tiền nạp không hợp lệ:**
```json
{
  "detail": "Số tiền nạp phải lớn hơn 0"
}
```

## Best Practices

### 1. Kiểm Tra Số Dư Trước Khi Thao Tác
```python
# Lấy thông tin user trước
user = session.get(User, user_id)
if user.balance < bill.amount:
    raise HTTPException(400, "Số dư không đủ")
```

### 2. Sử Dụng Decimal Cho Tiền Tệ
```python
from decimal import Decimal

# ✅ ĐÚNG
user.balance = Decimal("500000.00")

# ❌ SAI - Float có thể gây lỗi làm tròn
user.balance = 500000.00
```

### 3. Transaction Safety
```python
# Đảm bảo atomic operation
try:
    user.balance -= bill.amount
    bill.status = BillStatus.PAID
    session.add(user)
    session.add(bill)
    session.commit()
except Exception as e:
    session.rollback()
    raise e
```

## Frontend Integration (Đề xuất)

### Component hiển thị số dư
```tsx
interface BalanceDisplayProps {
  balance: number;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ balance }) => {
  return (
    <Box>
      <Typography variant="h6">Số dư tài khoản</Typography>
      <Typography variant="h4" color="primary">
        {balance.toLocaleString('vi-VN')} VNĐ
      </Typography>
    </Box>
  );
};
```

### Form nạp tiền
```tsx
const TopUpForm: React.FC = () => {
  const [amount, setAmount] = useState(0);
  
  const handleTopUp = async () => {
    try {
      const response = await api.post('/users/top-up', { amount });
      alert(response.data.message);
    } catch (error) {
      alert('Lỗi nạp tiền');
    }
  };
  
  return (
    <Box>
      <TextField
        label="Số tiền nạp"
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <Button onClick={handleTopUp}>Nạp tiền</Button>
    </Box>
  );
};
```

## Migration Notes

Nếu database đã tồn tại mà chưa có trường balance:

```sql
-- Thêm cột balance vào bảng user (nếu cần)
ALTER TABLE user ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0.00;

-- Hoặc set giá trị mặc định cho users hiện có
UPDATE user SET balance = 0.00 WHERE balance IS NULL;
```

## Kết Luận

Hệ thống quản lý số dư đã được tích hợp đầy đủ với:
- ✅ Model và Schema
- ✅ API Endpoints (User & Admin)
- ✅ Validation và Error Handling
- ✅ Integration với Payment Flow
- ✅ Auto-generate Monthly Bills

**Các bước tiếp theo:**
1. Tích hợp UI Frontend để hiển thị số dư
2. Tạo trang nạp tiền cho user
3. Tạo trang quản lý số dư cho admin
4. Thêm lịch sử giao dịch (transaction history)
5. Tích hợp payment gateway thực tế (VNPay, Momo, etc.)
