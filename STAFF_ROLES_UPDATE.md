# Cập nhật Hệ thống Vai trò Cán bộ

## Tổng quan

Hệ thống đã được cập nhật hoàn toàn để thay thế vai trò **ADMIN** bằng 3 vai trò cán bộ chuyên môn:

### 🎯 Các vai trò mới

1. **Manager (Quản lý)** - `manager/manager123`
   - Quyền truy cập toàn bộ hệ thống
   - Quản lý căn hộ, tòa nhà, người dùng, phương tiện
   - Thay thế hoàn toàn vai trò Admin trước đây

2. **Accountant (Kế toán)** - `accountant/accountant123`
   - Quản lý hóa đơn (CRUD)
   - Tạo phí quản lý hàng tháng tự động
   - Gửi nhắc nhở thanh toán
   - Xem báo cáo tài chính và thống kê

3. **Receptionist (Lễ tân)** - `receptionist/receptionist123`
   - Quản lý yêu cầu hỗ trợ (tickets)
   - Quản lý thông báo
   - Hỗ trợ cư dân

---

## 📋 Các thay đổi Backend

### 1. Models (`backend/app/models/user.py`)

```python
class UserRole(str, Enum):
    USER = "user"
    MANAGER = "manager"         # Quản lý - Full access
    ACCOUNTANT = "accountant"   # Kế toán - Bills & Finance
    RECEPTIONIST = "receptionist"  # Lễ tân - Services & Support
    # ❌ ADMIN role đã bị xóa
```

### 2. Dependencies (`backend/app/api/dependencies.py`)

Các function kiểm tra quyền đã được cập nhật:

- `get_current_manager()` - Chỉ Manager
- `get_current_accountant()` - Accountant hoặc Manager
- `get_current_receptionist()` - Receptionist hoặc Manager
- `get_current_staff()` - Bất kỳ vai trò cán bộ nào
- `get_current_admin_user()` - **Deprecated**, trỏ tới Manager

### 3. API Routes - Phân quyền theo vai trò

#### 📊 Bills & Cashflow (Kế toán)
- `backend/app/api/routes/bills.py` → `get_current_accountant`
- `backend/app/api/routes/cashflow.py` → `get_current_accountant`

#### 🏢 Apartments, Users, Vehicles (Quản lý)
- `backend/app/api/routes/apartments.py` → `get_current_manager`
- `backend/app/api/routes/users.py` → `get_current_manager`
- `backend/app/api/routes/vehicles.py` → `get_current_manager`

#### 🎫 Tickets & Services (Lễ tân)
- `backend/app/api/routes/tickets.py` → `get_current_receptionist`
- `backend/app/api/routes/services.py` → `get_current_receptionist`
- `backend/app/api/routes/notifications.py` → `get_current_receptionist`

### 4. Seed Data (`backend/scripts/seed_db.py`)

```python
# Staff accounts (ADMIN account đã bị xóa)
manager/manager123       # Nguyễn Văn Quản Lý
accountant/accountant123 # Trần Thị Kế Toán
receptionist/receptionist123 # Lê Thị Lễ Tân
```

---

## 🎨 Các thay đổi Frontend

### 1. Authentication Context (`src/contexts/AuthContext.tsx`)

```typescript
// Role checking functions
isManager() → user?.role === 'manager'
isAccountant() → user?.role === 'accountant'
isReceptionist() → user?.role === 'receptionist'
isStaff() → ['manager', 'accountant', 'receptionist']
isAdmin() → Deprecated, kept for compatibility
```

### 2. Routing (`src/App.tsx`)

```typescript
// Dashboard routing theo role
DashboardWrapper:
  - Manager → ManagerDashboard
  - Accountant → AccountantDashboard
  - Receptionist → ReceptionistDashboard
  - User → Dashboard

// Role-based routes
/apartments → RoleBasedRoute(['manager'])
/users → RoleBasedRoute(['manager'])
/admin/vehicles → RoleBasedRoute(['manager'])
/admin/bills → RoleBasedRoute(['accountant'])
/admin/tickets → RoleBasedRoute(['receptionist'])
/admin/notifications → RoleBasedRoute(['receptionist'])
```

### 3. Components

#### `src/components/RoleBasedRoute.tsx`
- Route protection component
- Kiểm tra `allowedRoles` prop
- Redirect nếu không có quyền

#### `src/components/Layout/AdminSidebar.tsx`
- Menu items theo vai trò
- Badge hiển thị vai trò (QL/KT/LT)
- Màu sắc khác nhau cho mỗi role

### 4. Pages mới

#### 📊 `src/pages/admin/AccountantBills.tsx`
Trang quản lý hóa đơn dành cho Kế toán với các tính năng:

##### Chức năng chính:
- ✅ **CRUD Hóa đơn**: Tạo, sửa, xóa hóa đơn
- ✅ **Thống kê tài chính**: 
  - Tổng doanh thu
  - Số tiền chờ thanh toán
  - Số tiền quá hạn
  - Hóa đơn đã thanh toán
- ✅ **Tìm kiếm & Lọc**:
  - Theo mã HĐ, cư dân, căn hộ
  - Theo trạng thái (pending/paid/overdue/cancelled)
  - Theo tòa nhà

##### Tính năng đặc biệt:
1. **🔔 Gửi nhắc nhở thanh toán**
   - Tự động phát hiện hóa đơn sắp đến hạn (7 ngày)
   - Gửi thông báo nhắc nhở hàng loạt
   - Hiển thị số lượng HĐ cần nhắc

2. **📅 Tạo phí quản lý hàng tháng**
   - Chọn tháng/năm
   - Tự động tạo HĐ cho tất cả cư dân renter
   - Dựa trên phí quản lý của căn hộ

3. **⏰ Cập nhật trạng thái quá hạn**
   - Tự động đánh dấu HĐ quá hạn
   - Cập nhật hàng loạt

##### API Endpoints sử dụng:
```typescript
// Bills CRUD
GET /api/bills/admin/all
POST /api/bills/admin/
PUT /api/bills/admin/{id}
DELETE /api/bills/admin/{id}

// Special features
GET /api/bills/admin/statistics
POST /api/bills/admin/generate-monthly-fees?month=11&year=2025
POST /api/bills/admin/send-reminder
POST /api/bills/admin/mark-overdue
```

#### 📈 `src/pages/admin/ManagerDashboard.tsx`
Dashboard cho Quản lý với tổng quan hệ thống

#### 💰 `src/pages/admin/AccountantDashboard.tsx`
Dashboard cho Kế toán với thống kê tài chính

#### 🎫 `src/pages/admin/ReceptionistDashboard.tsx`
Dashboard cho Lễ tân với yêu cầu hỗ trợ

### 5. Layout Updates

#### `src/components/Layout/Layout.tsx`
```typescript
// Page titles theo role
staffPageTitles = {
  '/': 'Manager/Accountant/Receptionist Dashboard',
  '/admin/bills': 'Bills Management',
  '/apartments': 'Apartments Management',
  ...
}
```

#### `src/pages/BillsWrapper.tsx`
```typescript
// Chuyển hướng theo role
isAccountant() ? <AccountantBills /> : <Bills />
```

---

## 🎨 UI/UX Changes

### Sidebar
- **Manager**: Màu tím (purple) - Badge "QL"
- **Accountant**: Màu xanh lá (green) - Badge "KT"  
- **Receptionist**: Màu xanh dương (blue) - Badge "LT"
- **User**: Màu xanh nhạt - Badge với chữ cái đầu tên

### Menu Items
- Manager: Buildings, Apartments, Users, Vehicles
- Accountant: Bills (chỉ 1 menu item)
- Receptionist: Tickets, Notifications

### Page Titles
- Tự động thay đổi theo role
- Manager Dashboard / Accountant Dashboard / Receptionist Dashboard

---

## 🚀 Cách sử dụng

### 1. Đăng nhập với tài khoản cán bộ

```
Quản lý:     manager / manager123
Kế toán:     accountant / accountant123
Lễ tân:      receptionist / receptionist123
```

### 2. Quy trình làm việc của Kế toán

1. **Đăng nhập** với `accountant/accountant123`
2. Vào trang **Dashboard** → Xem tổng quan tài chính
3. Vào **Bills** (menu sidebar) → Trang quản lý hóa đơn

#### Tạo phí quản lý hàng tháng:
1. Click nút **"Tạo phí tháng"** (màu tím)
2. Chọn tháng và năm
3. Xác nhận → Hệ thống tự tạo HĐ cho tất cả cư dân

#### Gửi nhắc nhở thanh toán:
1. Kiểm tra số lượng HĐ sắp đến hạn (hiển thị trên nút)
2. Click nút **"Gửi nhắc nhở"** (màu cam)
3. Xác nhận → Gửi thông báo cho tất cả cư dân có HĐ sắp đến hạn

#### Quản lý hóa đơn:
- **Tạo mới**: Nút "Tạo hóa đơn" → Điền form → Lưu
- **Sửa**: Click menu (⋮) → Sửa
- **Xóa**: Click menu (⋮) → Xóa
- **Tìm kiếm**: Dùng thanh tìm kiếm và bộ lọc

### 3. Permissions Matrix

| Chức năng | Manager | Accountant | Receptionist | User |
|-----------|---------|------------|--------------|------|
| Apartments | ✅ | ❌ | ❌ | ❌ |
| Users | ✅ | ❌ | ❌ | ❌ |
| Vehicles (Admin) | ✅ | ❌ | ❌ | ❌ |
| Bills (CRUD) | ✅ | ✅ | ❌ | View own |
| Generate Monthly Fees | ✅ | ✅ | ❌ | ❌ |
| Send Reminders | ✅ | ✅ | ❌ | ❌ |
| Tickets (Admin) | ✅ | ❌ | ✅ | Create own |
| Notifications | ✅ | ❌ | ✅ | View own |
| Services | ✅ | ❌ | ✅ | Book |

---

## 📝 Migration Notes

### Files đã xóa/deprecated:
- ❌ `src/pages/AdminBills.tsx` → Thay bằng `AccountantBills.tsx`
- ❌ `src/pages/AdminDashboard.tsx` → Thay bằng role-specific dashboards
- ❌ `src/components/AdminRoute.tsx` → Thay bằng `RoleBasedRoute.tsx`

### Files cần reset database:
Sau khi cập nhật, cần reset database để xóa ADMIN role:

```bash
# Backend
cd backend
python scripts/reset_db.py
python scripts/seed_db.py

# Hoặc
python scripts/seed_all.py
```

### Breaking Changes:
- Tài khoản `admin/admin123` không còn hoạt động
- API endpoints không còn chấp nhận `role: "admin"`
- Frontend kiểm tra `isAdmin()` được giữ lại nhưng luôn trả về false

---

## 🔍 Testing Checklist

### Backend:
- [ ] Login với manager/accountant/receptionist thành công
- [ ] Manager có quyền truy cập tất cả endpoints
- [ ] Accountant chỉ truy cập được bills/cashflow endpoints
- [ ] Receptionist chỉ truy cập được tickets/services endpoints
- [ ] User không thể truy cập admin endpoints

### Frontend:
- [ ] Sidebar hiển thị đúng menu theo role
- [ ] Dashboard routing theo role
- [ ] AccountantBills page:
  - [ ] CRUD hóa đơn
  - [ ] Generate monthly fees
  - [ ] Send reminders
  - [ ] Statistics hiển thị đúng
  - [ ] Filters hoạt động
- [ ] RoleBasedRoute redirect khi không có quyền
- [ ] Page titles hiển thị đúng

---

## 🎯 Kết luận

Hệ thống đã được chuyển đổi hoàn toàn từ mô hình **single admin** sang **role-based staff system** với 3 vai trò chuyên môn:

- ✅ Manager thay thế Admin với full access
- ✅ Accountant chuyên về quản lý tài chính, hóa đơn
- ✅ Receptionist chuyên về hỗ trợ cư dân, dịch vụ

Hệ thống hiện tại phân quyền rõ ràng, dễ quản lý và mở rộng.

**Ngày cập nhật**: 2025-01-XX  
**Phiên bản**: 2.0.0
