# Apartment Management Backend API

FastAPI backend cho hệ thống quản lý chung cư với các tính năng:

## Tính năng chính

### 1. Quản lý hóa đơn và thanh toán
- **User**: Xem/tải hóa đơn, thanh toán online/upload chứng từ, xem lịch sử
- **Admin**: Tạo/điều chỉnh hóa đơn, xác thực thanh toán, gửi nhắc nợ, xuất báo cáo thu

### 2. Sổ quỹ (tiền mặt/ngân hàng)
- **User**: Xem biên lai/lịch sử khoản nộp của căn hộ
- **Admin**: Ghi thu/chi, đính kèm chứng từ, đối chiếu sao kê, xuất báo cáo

### 3. Thông báo & tin tức
- **User**: Nhận/đọc thông báo, đăng ký nhận nhóm thông báo, xác nhận/tham dự
- **Admin**: Tạo/lên lịch/đẩy thông báo (push/SMS), phân target, xem thống kê

### 4. Phản ánh/khiếu nại/góp ý (tickets)
- **User**: Tạo ticket (ảnh, vị trí), theo dõi trạng thái, đánh giá khi đóng
- **Admin**: Nhận & phân công, cập nhật trạng thái/log, đóng nghiệm thu, báo KPI

### 5. Quản lý dịch vụ đặt
- **User**: Xem dịch vụ, đặt/hủy, xem lịch & đánh giá
- **Admin**: Quản lý dịch vụ/giá, confirm & giao provider, đối soát thanh toán

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
- `POST /api/v1/bills/{bill_id}/payments` - Tạo thanh toán
- `POST /api/v1/bills/{bill_id}/upload-evidence` - Upload chứng từ thanh toán
- `PUT /api/v1/bills/payments/{payment_id}/confirm` - Xác nhận thanh toán (admin)

### Cash Flow
- `GET /api/v1/cashflow/` - Sổ quỹ (admin)
- `POST /api/v1/cashflow/` - Ghi thu/chi (admin)
- `POST /api/v1/cashflow/reconcile` - Đối chiếu (admin)

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
- `POST /api/v1/services/bookings/{id}/confirm` - Xác nhận đặt chỗ (admin)

## Phân quyền

### User (Cư dân)
- Xem và thanh toán hóa đơn của mình
- Xem lịch sử thanh toán
- Nhận và phản hồi thông báo
- Tạo và theo dõi tickets
- Đặt dịch vụ và đánh giá

### Admin/Manager
- Tất cả quyền của User
- Quản lý hóa đơn và xác nhận thanh toán
- Quản lý sổ quỹ và đối chiếu
- Tạo và gửi thông báo
- Xử lý tickets và phân công
- Quản lý dịch vụ và xác nhận đặt chỗ

## Database Schema

### Bảng chính:
- `users` - Thông tin người dùng
- `bills` - Hóa đơn
- `payments` - Thanh toán
- `cashflow` - Sổ quỹ
- `notifications` - Thông báo
- `tickets` - Phản ánh/khiếu nại
- `services` - Dịch vụ
- `servicebookings` - Đặt dịch vụ

### Bảng phụ:
- `notificationreads` - Theo dõi đọc thông báo
- `notificationresponses` - Phản hồi thông báo
- `ticketattachments` - File đính kèm ticket
- `ticketlogs` - Lịch sử ticket
- `bankstatements` - Sao kê ngân hàng

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