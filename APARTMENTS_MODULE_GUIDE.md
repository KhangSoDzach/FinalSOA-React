# Quản lý Căn hộ - Hướng dẫn sử dụng

## Tổng quan

Module Quản lý Căn hộ cho phép admin quản lý thông tin căn hộ và đăng ký người dùng mới cho căn hộ một cách tự động.

## Tính năng

### 1. Quản lý Căn hộ

#### Thêm căn hộ mới
- Số căn hộ (bắt buộc)
- Tòa nhà (bắt buộc)
- Tầng (bắt buộc)
- Diện tích (m²)
- Số phòng ngủ
- Số phòng tắm
- Mô tả

#### Sửa thông tin căn hộ
- Cập nhật bất kỳ thông tin nào của căn hộ
- Thay đổi trạng thái (Còn trống, Đã có người, Bảo trì)

#### Xóa căn hộ
- Chỉ được xóa căn hộ chưa có cư dân

### 2. Đăng ký Cư dân

#### Tự động tạo tài khoản
Khi đăng ký cư dân mới cho căn hộ:

1. **Username**: Tự động sử dụng số căn hộ
   - VD: Căn hộ "A102" → username là "A102"

2. **Mật khẩu**: 
   - Admin có thể nhập mật khẩu tùy chỉnh
   - Hoặc để trống để hệ thống tự động tạo mật khẩu an toàn (12 ký tự ngẫu nhiên)

3. **Thông tin cư dân**:
   - Họ tên (bắt buộc)
   - Email (bắt buộc, duy nhất)
   - Số điện thoại (tùy chọn)

4. **Sau khi đăng ký thành công**:
   - Hiển thị popup với thông tin đăng nhập
   - Có nút copy để sao chép username và password
   - ⚠️ **Lưu ý**: Đây là lần duy nhất có thể xem mật khẩu, hãy lưu lại và gửi cho cư dân

#### Liên kết tự động
- Căn hộ được liên kết với user
- Trạng thái căn hộ chuyển sang "Đã có người"
- Thông tin căn hộ được cập nhật vào tài khoản user

### 3. Xóa Cư dân
- Xóa liên kết giữa cư dân và căn hộ
- Căn hộ trở về trạng thái "Còn trống"
- Tùy chọn xóa hoặc giữ lại tài khoản user

### 4. Thống kê
Dashboard hiển thị:
- Tổng số căn hộ
- Số căn hộ đã có người
- Số căn hộ còn trống
- Số căn hộ đang bảo trì
- Tỷ lệ lấp đầy (%)

### 5. Bộ lọc
- Lọc theo tòa nhà
- Lọc theo trạng thái

## API Endpoints

### Backend (Python/FastAPI)

#### Apartments
- `GET /api/apartments` - Lấy danh sách căn hộ
- `POST /api/apartments` - Tạo căn hộ mới
- `GET /api/apartments/{id}` - Lấy thông tin căn hộ
- `PUT /api/apartments/{id}` - Cập nhật căn hộ
- `DELETE /api/apartments/{id}` - Xóa căn hộ
- `POST /api/apartments/{id}/register-resident` - Đăng ký cư dân
- `DELETE /api/apartments/{id}/remove-resident` - Xóa cư dân
- `GET /api/apartments/buildings/list` - Lấy danh sách tòa nhà
- `GET /api/apartments/stats/overview` - Thống kê tổng quan

## Cấu trúc Database

### Model Apartment
```python
class Apartment(SQLModel, table=True):
    id: Optional[int]
    apartment_number: str  # Số căn hộ (unique)
    building: str  # Tòa nhà
    floor: int  # Tầng
    area: float  # Diện tích (m²)
    bedrooms: int  # Số phòng ngủ
    bathrooms: int  # Số phòng tắm
    status: ApartmentStatus  # available, occupied, maintenance
    description: Optional[str]  # Mô tả
    resident_id: Optional[int]  # ID cư dân (FK to User)
    created_at: datetime
    updated_at: Optional[datetime]
```

### Relationship với User
- Mỗi căn hộ có thể có 1 cư dân
- User có trường `apartment_number` và `building`
- Relationship: `apartment.resident` ↔ `user.apartment`

## Quy trình Đăng ký Cư dân Mới

### Frontend (React/Chakra UI)
1. Admin chọn căn hộ còn trống
2. Click nút "Đăng ký cư dân" (icon UserPlus)
3. Điền form:
   - Họ tên
   - Email
   - Số điện thoại (tùy chọn)
   - Mật khẩu (tùy chọn)
4. Submit

### Backend Processing
1. Kiểm tra căn hộ:
   - Tồn tại
   - Chưa có người ở
2. Kiểm tra email chưa được đăng ký
3. Tạo username = số căn hộ
4. Tạo/hash mật khẩu
5. Tạo User mới:
   - Username = apartment_number
   - Email, full_name, phone
   - Role = USER
   - apartment_number, building
6. Cập nhật Apartment:
   - resident_id = user.id
   - status = OCCUPIED
7. Trả về thông tin đăng nhập

### Frontend Response
1. Hiển thị modal với credentials
2. Cho phép copy username và password
3. Hiển thị cảnh báo lưu thông tin
4. Refresh danh sách căn hộ

## Bảo mật

### Mật khẩu tự động
- Độ dài: 12 ký tự
- Bao gồm: chữ hoa, chữ thường, số, ký tự đặc biệt
- Sử dụng `secrets` module để đảm bảo tính ngẫu nhiên

### Hash Password
- Sử dụng bcrypt qua `passlib`
- Salt rounds tự động

### Validation
- Email phải unique
- Username (apartment_number) phải unique
- Căn hộ chỉ được đăng ký khi status = available

## Ví dụ Sử dụng

### Tạo căn hộ mới
```
Số căn hộ: A102
Tòa nhà: A
Tầng: 1
Diện tích: 85.5 m²
Phòng ngủ: 2
Phòng tắm: 2
Mô tả: Căn góc, view đẹp
```

### Đăng ký cư dân
```
Căn hộ: A102
Họ tên: Nguyễn Văn A
Email: nguyenvana@email.com
SĐT: 0901234567
Mật khẩu: (để trống - tự động tạo)

→ Kết quả:
Username: A102
Password: aB3!xY9@zK5#
```

### Gửi thông tin cho cư dân
```
Kính chào Quý cư dân,

Thông tin đăng nhập hệ thống quản lý căn hộ:
- Tài khoản: A102
- Mật khẩu: aB3!xY9@zK5#
- Website: https://...

Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu.

Trân trọng,
Ban Quản lý
```

## Lưu ý

1. **Mật khẩu**: Chỉ hiển thị 1 lần, không thể xem lại
2. **Username**: Không thể thay đổi (gắn với số căn hộ)
3. **Email**: Phải unique trong hệ thống
4. **Xóa căn hộ**: Chỉ được xóa khi chưa có cư dân
5. **Xóa cư dân**: Có thể chọn xóa hoặc giữ tài khoản

## Troubleshooting

### Lỗi: "Apartment already exists"
→ Số căn hộ đã tồn tại trong hệ thống

### Lỗi: "Email already registered"
→ Email đã được sử dụng cho tài khoản khác

### Lỗi: "Username already exists"
→ Đã có user với username trùng với số căn hộ

### Lỗi: "Apartment is already occupied"
→ Căn hộ đã có cư dân, không thể đăng ký thêm

### Lỗi: "Cannot delete apartment with resident"
→ Phải xóa cư dân trước khi xóa căn hộ
