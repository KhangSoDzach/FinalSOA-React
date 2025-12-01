# Apartment Management Backend API

FastAPI backend cho hệ thống quản lý chung cư với các tính năng:

## Tính năng chính

### 1. Quản lý hóa đơn và thanh toán
- **User**: Xem/tải hóa đơn, thanh toán online với OTP qua email, xem lịch sử
- **Admin**: Tạo/điều chỉnh hóa đơn, xác thực thanh toán, gửi nhắc nợ, xuất báo cáo thu

### 2. Thông báo & tin tức
- **Admin**: Nhận/đọc thông báo, đăng ký nhận nhóm thông báo, xác nhận/tham dự
- **Admin**: Tạo/lên lịch/đẩy thông báo, phân target, xem thống kê

### 3. Phản ánh/khiếu nại/góp ý (tickets)
- **User**: Tạo ticket (ảnh, vị trí), theo dõi trạng thái, đánh giá khi đóng
- **Admin**: Nhận & phân công, cập nhật trạng thái/log, đóng nghiệm thu, báo KPI

### 4. Quản lý dịch vụ đặt
- **User**: Xem dịch vụ, đặt/hủy, xem lịch & đánh giá
- **Admin**: Quản lý dịch vụ/giá, confirm & giao provider, đối soát thanh toán

### 5. Quản lý phương tiện (xe)
- **User**: Đăng ký xe, xem thẻ xe, cập nhật thông tin
- **Admin**: Duyệt/từ chối đăng ký xe, quản lý thẻ xe, xem thống kê

### 6. Quản lý căn hộ & cư dân
- **User**: Xem thông tin căn hộ của mình
- **Admin**: Quản lý căn hộ, gán cư dân vào căn hộ, xem thống kê

## Tech Stack

- **FastAPI**: Python web framework
- **SQLModel**: Python SQL database interactions (ORM)
- **Pydantic**: Data validation and settings management
- **PostgreSQL**: SQL database
- **JWT**: Authentication
- **Uvicorn**: ASGI server

## Cài đặt và chạy

### 1. Sử dụng Docker Compose (Khuyến nghị)

```bash
cd backend
docker-compose up -d
```

### 2. Cài đặt thủ công

```bash
cd backend

# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Cài đặt dependencies
pip install -r requirements.txt

# Tạo file .env từ template
cp .env.example .env
# Chỉnh sửa .env với thông tin database

# Chạy server
python run.py
```

## API Documentation

Sau khi chạy server, truy cập:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Cấu trúc thư mục

```
backend/
├── app/
│   ├── api/
│   │   ├── routes/          # API endpoints
│   │   └── dependencies.py  # Authentication dependencies
│   ├── core/
│   │   ├── config.py        # Configuration settings
│   │   ├── database.py      # Database connection
│   │   └── security.py      # JWT & password handling
│   ├── models/              # SQLModel database models
│   ├── schemas/             # Pydantic request/response schemas
│   └── main.py             # FastAPI application
├── requirements.txt
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/register` - Đăng ký

### Users
- `GET /api/v1/users/me` - Thông tin user hiện tại
- `PUT /api/v1/users/me` - Cập nhật thông tin
- `GET /api/v1/users/` - Danh sách users (admin)

### Bills & Payments
- `GET /api/v1/bills/my-bills` - Hóa đơn của user
- `POST /api/v1/bills/request-pay` - Yêu cầu thanh toán (gửi OTP)
- `POST /api/v1/bills/verify-otp` - Xác thực OTP và thanh toán
- `POST /api/v1/bills/resend-otp` - Gửi lại OTP
- `POST /api/v1/bills/batch-create` - Tạo hóa đơn hàng loạt (admin)
- `GET /api/v1/bills/statistics` - Thống kê hóa đơn (admin)

### Notifications
- `GET /api/v1/notifications/` - Thông báo của user
- `POST /api/v1/notifications/` - Tạo thông báo (admin)
- `POST /api/v1/notifications/{id}/read` - Đánh dấu đã đọc
- `POST /api/v1/notifications/{id}/respond` - Phản hồi thông báo

### Tickets
- `GET /api/v1/tickets/my-tickets` - Tickets của user
- `POST /api/v1/tickets/` - Tạo ticket
- `POST /api/v1/tickets/{id}/assign` - Phân công (admin)
- `POST /api/v1/tickets/{id}/resolve` - Giải quyết (admin)
- `POST /api/v1/tickets/{id}/feedback` - Đánh giá

### Services
- `GET /api/v1/services/` - Danh sách dịch vụ
- `POST /api/v1/services/{id}/book` - Đặt dịch vụ
- `GET /api/v1/services/bookings/my-bookings` - Đặt chỗ của user
- `POST /api/v1/services/bookings/{id}/cancel` - Hủy đặt chỗ
- `GET /api/v1/services/admin/all` - Tất cả dịch vụ (admin)
- `GET /api/v1/services/admin/bookings/all` - Tất cả đặt chỗ (admin)
- `POST /api/v1/services/admin/bookings/{id}/confirm` - Xác nhận đặt chỗ (admin)
- `PUT /api/v1/services/admin/bookings/{id}/complete` - Hoàn thành dịch vụ (admin)

### Vehicles
- `GET /api/v1/vehicles/my-vehicles` - Xe của user
- `POST /api/v1/vehicles/` - Đăng ký xe mới
- `PUT /api/v1/vehicles/{id}` - Cập nhật thông tin xe
- `DELETE /api/v1/vehicles/{id}` - Xóa xe
- `GET /api/v1/vehicles/admin/all` - Tất cả xe (admin)
- `POST /api/v1/vehicles/admin/{id}/approve` - Duyệt xe (admin)
- `GET /api/v1/vehicles/stats` - Thống kê xe (admin)

### Apartments
- `GET /api/v1/apartments/` - Danh sách căn hộ
- `GET /api/v1/apartments/{id}` - Chi tiết căn hộ
- `GET /api/v1/apartments/stats/overview` - Thống kê căn hộ (admin)

## Phân quyền

### Resident (Cư dân)
- Xem và thanh toán hóa đơn với OTP qua email
- Xem lịch sử thanh toán
- Nhận và phản hồi thông báo
- Tạo và theo dõi tickets
- Đặt và hủy dịch vụ
- Đăng ký và quản lý xe

### Manager (Quản lý)
- Tất cả quyền của Resident
- Quản lý căn hộ và cư dân
- Quản lý nhân viên (staff)
- Xem tất cả báo cáo và thống kê

### Accountant (Kế toán)
- Quản lý hóa đơn (tạo, sửa, xóa)
- Tạo hóa đơn hàng loạt
- Gửi nhắc nợ
- Xuất báo cáo thu chi
- Xem thống kê tài chính

### Receptionist (Lễ tân)
- Quản lý tickets (nhận, phân công, xử lý)
- Quản lý dịch vụ và xác nhận đặt chỗ
- Quản lý đăng ký xe (duyệt/từ chối)
- Tạo và gửi thông báo
- Xem thông tin nhân viên

## Database Schema

### Bảng chính:
- `user` - Thông tin người dùng (cư dân và staff)
- `apartment` - Căn hộ
- `bill` - Hóa đơn
- `payment` - Thanh toán
- `notification` - Thông báo
- `ticket` - Phản ánh/khiếu nại
- `service` - Dịch vụ
- `servicebooking` - Đặt dịch vụ
- `vehicle` - Phương tiện (xe)

### Bảng phụ:
- `notificationread` - Theo dõi đọc thông báo
- `notificationresponse` - Phản hồi thông báo
- `ticketattachment` - File đính kèm ticket
- `ticketlog` - Lịch sử ticket
- `ticketcomment` - Bình luận ticket

## Development

### Thêm endpoint mới:
1. Tạo model in `app/models/`
2. Tạo schema in `app/schemas/`
3. Tạo route in `app/api/routes/`
4. Thêm route vào `app/api/main.py`

### Testing:
```bash
# Cài đặt test dependencies
pip install pytest pytest-asyncio httpx

# Chạy tests (cần implement)
pytest
```

## Production Deployment

1. Cấu hình environment variables
2. Sử dụng production database
3. Cấu hình reverse proxy (nginx)
4. SSL/TLS certificates
5. Monitoring và logging