# SkyHome - Apartment Management System

Hệ thống quản lý chung cư được xây dựng bằng React TypeScript với Chakra UI.

## Tính năng chính

### Dành cho cư dân:
- **Thanh toán hóa đơn**: Xem/tải hóa đơn, thanh toán online/upload chứng từ, xem lịch sử
- **Sổ quỹ**: Xem biên lai/lịch sử khoản nộp của căn hộ
- **Thông báo & tin tức**: Nhận/đọc thông báo, đăng ký nhận nhóm thông báo
- **Phản ánh/khiếu nại**: Tạo ticket (ảnh, vị trí), theo dõi trạng thái, đánh giá
- **Quản lý dịch vụ**: Xem dịch vụ, đặt/hủy, xem lịch & đánh giá
- **Quản lý xe**: Đăng ký thẻ xe, quản lý chỗ đậu

### Dành cho admin:
- **Quản lý hóa đơn**: Tạo/điều chỉnh hóa đơn, xác thực thanh toán, gửi nhắc nợ
- **Sổ quỹ**: Ghi thu/chi, đính kèm chứng từ, đối chiếu sao kê
- **Thông báo**: Tạo/lên lịch/đẩy thông báo, phân target, xem thống kê
- **Xử lý ticket**: Nhận & phân công, cập nhật trạng thái, đóng nghiệm thu
- **Quản lý dịch vụ**: Quản lý dịch vụ/giá, confirm & giao provider

## Công nghệ sử dụng

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Chakra UI
- **Routing**: React Router Dom
- **State Management**: React Query (TanStack Query)
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: React Icons (Feather Icons)
- **Testing**: Playwright (E2E)

## Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js (v16 trở lên)
- Python 3.8+
- PostgreSQL (cho backend)

### 1. Cài đặt Frontend Dependencies

```bash
npm install
```

### 2. Cài đặt Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 3. Thiết lập Database

```bash
cd backend
python scripts/reset_db.py
cd ..
```

### 4. Chạy Development Server

**Cách 1: Tự động (Khuyến nghị)** - Backend tự động khởi động cùng Frontend

```bash
npm run dev
```

hoặc

```bash
npm start
```

**Cách 2: Chạy riêng biệt**

Terminal 1 - Backend:
```bash
npm run backend
```

Terminal 2 - Frontend:
```bash
npm run frontend
```

**Cách 3: Chạy song song với Concurrently**

```bash
npm run dev:full
```

### Truy cập ứng dụng

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`

### 5. Build cho production

```bash
npm run build
```

### 4. Preview production build

```bash
npm run preview
```

### 5. Chạy tests

```bash
npm run test
```

## Cấu trúc dự án

```
src/
├── components/          # Components tái sử dụng
│   └── Layout/         # Layout components (Sidebar, Header)
├── pages/              # Các trang chính
│   ├── Dashboard.tsx   # Trang chủ
│   ├── Bills.tsx       # Quản lý hóa đơn
│   ├── Tickets.tsx     # Phản ánh/khiếu nại
│   ├── Vehicles.tsx    # Quản lý xe
│   ├── Utilities.tsx   # Dịch vụ tiện ích
│   ├── Profile.tsx     # Hồ sơ cá nhân
│   ├── Settings.tsx    # Cài đặt
│   └── Login.tsx       # Đăng nhập
├── theme/              # Chakra UI theme customization
├── App.tsx             # App component chính
└── main.tsx           # Entry point
```

## Tính năng đã triển khai

### ✅ Hoàn thành:
- Layout responsive với Sidebar navigation
- Dashboard với quick access và overview
- Quản lý hóa đơn với tabs (unpaid/paid/receipts)
- Hệ thống ticket với form tạo mới và theo dõi trạng thái
- Đăng ký và quản lý phương tiện
- Đặt dịch vụ tiện ích
- Hồ sơ cá nhân với thông tin chi tiết
- Cài đặt thông báo và quyền riêng tư
- Login form

### 🚧 Cần phát triển:
- Backend API integration
- Authentication & Authorization
- Real-time notifications
- File upload functionality
- Payment gateway integration
- Admin dashboard
- Database design and implementation

## Scripts có sẵn

- `npm run dev` - Chạy development server
- `npm run build` - Build cho production
- `npm run preview` - Preview production build
- `npm run lint` - Chạy ESLint

## Lưu ý

Đây là bản frontend prototype. Để có ứng dụng hoàn chỉnh, cần:

1. **Backend API**: Node.js/Express hoặc .NET Core API
2. **Database**: PostgreSQL hoặc MongoDB
3. **Authentication**: JWT tokens hoặc OAuth
4. **File Storage**: AWS S3 hoặc local storage
5. **Payment Integration**: VNPay, MoMo, hoặc banking APIs
6. **Real-time Features**: Socket.io hoặc WebSockets

## Liên hệ

Để có thêm thông tin về việc phát triển backend và triển khai, vui lòng liên hệ team phát triển.