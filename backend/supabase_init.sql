-- ============================================
-- APARTMENT MANAGEMENT SYSTEM - DATABASE SCHEMA
-- For Supabase PostgreSQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING TABLES (if any)
-- ============================================
DROP TABLE IF EXISTS service_bookings CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS vehicle_registrations CASCADE;
DROP TABLE IF EXISTS ticket_comments CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS residents CASCADE;
DROP TABLE IF EXISTS apartments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop ENUMs
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS occupier_type CASCADE;
DROP TYPE IF EXISTS apartment_status CASCADE;
DROP TYPE IF EXISTS bill_type CASCADE;
DROP TYPE IF EXISTS bill_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS ticket_category CASCADE;
DROP TYPE IF EXISTS ticket_priority CASCADE;
DROP TYPE IF EXISTS vehicle_type CASCADE;
DROP TYPE IF EXISTS vehicle_status CASCADE;
DROP TYPE IF EXISTS service_category CASCADE;
DROP TYPE IF EXISTS service_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS notification_status CASCADE;

-- ============================================
-- CREATE ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('resident', 'manager', 'accountant', 'receptionist');
CREATE TYPE occupier_type AS ENUM ('owner', 'renter');
CREATE TYPE apartment_status AS ENUM ('available', 'occupied', 'maintenance');
CREATE TYPE bill_type AS ENUM ('management_fee', 'utility', 'parking', 'service', 'other');
CREATE TYPE bill_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_category AS ENUM ('maintenance', 'noise', 'cleaning', 'suggestion', 'other');
CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE vehicle_type AS ENUM ('car', 'motorcycle', 'bicycle');
CREATE TYPE vehicle_status AS ENUM ('pending', 'active', 'rejected', 'expired');
CREATE TYPE service_category AS ENUM ('cleaning', 'repair', 'delivery', 'moving', 'other');
CREATE TYPE service_status AS ENUM ('active', 'inactive');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('maintenance', 'bill_reminder', 'event', 'announcement', 'system');
CREATE TYPE notification_status AS ENUM ('draft', 'scheduled', 'sent', 'cancelled');

-- ============================================
-- CREATE TABLES
-- ============================================

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role user_role DEFAULT 'resident',
    apartment_number VARCHAR(20),
    building VARCHAR(10),
    occupier occupier_type DEFAULT 'owner',
    balance DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    reset_otp VARCHAR(10),
    reset_otp_created_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Apartments table
CREATE TABLE apartments (
    id SERIAL PRIMARY KEY,
    apartment_number VARCHAR(20) UNIQUE NOT NULL,
    building VARCHAR(10) NOT NULL,
    floor INTEGER NOT NULL,
    area DECIMAL(10, 2) NOT NULL,
    bedrooms INTEGER DEFAULT 1,
    bathrooms INTEGER DEFAULT 1,
    monthly_fee DECIMAL(10, 2) NOT NULL,
    status apartment_status DEFAULT 'available',
    resident_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Residents table (liên kết users với apartments - optional)
CREATE TABLE residents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    apartment_id INTEGER REFERENCES apartments(id) ON DELETE CASCADE,
    occupier_type occupier_type DEFAULT 'owner',
    move_in_date DATE NOT NULL,
    move_out_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, apartment_id)
);

-- Bills table
CREATE TABLE bills (
    id SERIAL PRIMARY KEY,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    bill_type bill_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    due_date TIMESTAMP NOT NULL,
    status bill_status DEFAULT 'pending',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    otp VARCHAR(10),
    otp_created_at TIMESTAMP,
    otp_verified BOOLEAN DEFAULT false,
    status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'balance',
    transaction_id VARCHAR(100) UNIQUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets table
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category ticket_category NOT NULL,
    priority ticket_priority DEFAULT 'normal',
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status ticket_status DEFAULT 'open',
    image_url VARCHAR(500),
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ticket Comments table
CREATE TABLE ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_staff_reply BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Registrations table
CREATE TABLE vehicle_registrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type vehicle_type NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(50),
    model VARCHAR(50),
    color VARCHAR(30),
    parking_spot VARCHAR(20),
    registration_image VARCHAR(500),
    status vehicle_status DEFAULT 'pending',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category service_category NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    status service_status DEFAULT 'active',
    available_days VARCHAR(50) DEFAULT '[0,1,2,3,4,5,6]',
    available_time_start TIME,
    available_time_end TIME,
    advance_booking_hours INTEGER DEFAULT 24,
    max_booking_days INTEGER DEFAULT 30,
    provider_name VARCHAR(100),
    provider_contact VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Bookings table
CREATE TABLE service_bookings (
    id SERIAL PRIMARY KEY,
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMP NOT NULL,
    scheduled_time_start TIME NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_amount DECIMAL(10, 2) NOT NULL,
    status booking_status DEFAULT 'pending',
    notes TEXT,
    confirmed_at TIMESTAMP,
    completed_at TIMESTAMP,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type notification_type NOT NULL,
    priority INTEGER DEFAULT 1,
    target_audience VARCHAR(50) DEFAULT 'all',
    status notification_status DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    push_notification BOOLEAN DEFAULT false,
    sms BOOLEAN DEFAULT false,
    email BOOLEAN DEFAULT true,
    event_date TIMESTAMP,
    event_location VARCHAR(200),
    requires_response BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_apartment ON users(apartment_number);
CREATE INDEX idx_apartments_number ON apartments(apartment_number);
CREATE INDEX idx_apartments_building ON apartments(building);
CREATE INDEX idx_apartments_status ON apartments(status);
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_due_date ON bills(due_date);
CREATE INDEX idx_payments_bill_id ON payments(bill_id);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_vehicles_user_id ON vehicle_registrations(user_id);
CREATE INDEX idx_vehicles_status ON vehicle_registrations(status);
CREATE INDEX idx_bookings_user_id ON service_bookings(user_id);
CREATE INDEX idx_bookings_service_id ON service_bookings(service_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Insert sample users (password: 123456 for all)
INSERT INTO users (username, email, hashed_password, full_name, phone, role, balance, occupier) VALUES
('manager', 'manager@apartment.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYG8K8w8Z6G', 'Nguyễn Văn Quản Lý', '0901234567', 'manager', 2000000, 'owner'),
('accountant', 'accountant@apartment.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYG8K8w8Z6G', 'Trần Thị Kế Toán', '0901234568', 'accountant', 2500000, 'owner'),
('receptionist', 'receptionist@apartment.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYG8K8w8Z6G', 'Lê Thị Lễ Tân', '0901234569', 'receptionist', 1800000, 'owner'),
('user001', 'vamila2710@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYG8K8w8Z6G', 'Nguyễn Văn A', '0901234567', 'resident', 5000000, 'owner'),
('user002', 'lexa61313@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYG8K8w8Z6G', 'Đặng Bảo Khang', '0901234568', 'resident', 50000000, 'owner'),
('user003', 'user003@apartment.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYG8K8w8Z6G', 'Lê Văn C', '0901234569', 'resident', 1250000, 'owner'),
('user004', 'user004@apartment.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYG8K8w8Z6G', 'Phạm Thị D', '0901234570', 'resident', 0, 'renter'),
('user005', 'user005@apartment.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYG8K8w8Z6G', 'Hoàng Đình E', '0901234571', 'resident', 7800000, 'owner'),
('user006', 'user006@apartment.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYG8K8w8Z6G', 'Võ Văn F', '0901234572', 'resident', 300000, 'renter');

-- Update apartment_number and building for users
UPDATE users SET apartment_number = 'A101', building = 'A' WHERE username = 'user001';
UPDATE users SET apartment_number = 'B101', building = 'B' WHERE username = 'user002';
UPDATE users SET apartment_number = 'A202', building = 'A' WHERE username = 'user003';
UPDATE users SET apartment_number = 'A305', building = 'A' WHERE username = 'user004';
UPDATE users SET apartment_number = 'B203', building = 'B' WHERE username = 'user005';
UPDATE users SET apartment_number = 'B404', building = 'B' WHERE username = 'user006';

-- Insert sample apartments (50 apartments: 2 buildings x 5 floors x 5 rooms)
INSERT INTO apartments (apartment_number, building, floor, area, bedrooms, bathrooms, monthly_fee, status, description) VALUES
-- Building A, Floor 1
('A101', 'A', 1, 55.0, 1, 1, 1800000, 'occupied', 'Căn góc, view đẹp'),
('A102', 'A', 1, 65.0, 2, 1, 2300000, 'available', NULL),
('A103', 'A', 1, 75.0, 2, 2, 2800000, 'available', NULL),
('A104', 'A', 1, 85.0, 3, 2, 3200000, 'available', NULL),
('A105', 'A', 1, 100.0, 3, 3, 3800000, 'available', NULL),
-- Building A, Floor 2
('A201', 'A', 2, 55.0, 1, 1, 1900000, 'available', NULL),
('A202', 'A', 2, 65.0, 2, 1, 2400000, 'occupied', NULL),
('A203', 'A', 2, 75.0, 2, 2, 2900000, 'available', NULL),
('A204', 'A', 2, 85.0, 3, 2, 3300000, 'available', NULL),
('A205', 'A', 2, 100.0, 3, 3, 3900000, 'available', NULL),
-- Building A, Floor 3
('A301', 'A', 3, 55.0, 1, 1, 2000000, 'available', NULL),
('A302', 'A', 3, 65.0, 2, 1, 2500000, 'available', NULL),
('A303', 'A', 3, 75.0, 2, 2, 3000000, 'available', NULL),
('A304', 'A', 3, 85.0, 3, 2, 3400000, 'available', NULL),
('A305', 'A', 3, 100.0, 3, 3, 4000000, 'occupied', NULL),
-- Building B, Floor 1
('B101', 'B', 1, 55.0, 1, 1, 1800000, 'occupied', 'Căn góc, view đẹp'),
('B102', 'B', 1, 65.0, 2, 1, 2300000, 'available', NULL),
('B103', 'B', 1, 75.0, 2, 2, 2800000, 'available', NULL),
('B104', 'B', 1, 85.0, 3, 2, 3200000, 'available', NULL),
('B105', 'B', 1, 100.0, 3, 3, 3800000, 'available', NULL),
-- Building B, Floor 2
('B201', 'B', 2, 55.0, 1, 1, 1900000, 'available', NULL),
('B202', 'B', 2, 65.0, 2, 1, 2400000, 'available', NULL),
('B203', 'B', 2, 75.0, 2, 2, 2900000, 'occupied', NULL),
('B204', 'B', 2, 85.0, 3, 2, 3300000, 'available', NULL),
('B205', 'B', 2, 100.0, 3, 3, 3900000, 'available', NULL),
-- Building B, Floor 4
('B401', 'B', 4, 55.0, 1, 1, 2100000, 'available', NULL),
('B402', 'B', 4, 65.0, 2, 1, 2600000, 'available', NULL),
('B403', 'B', 4, 75.0, 2, 2, 3100000, 'available', NULL),
('B404', 'B', 4, 85.0, 3, 2, 3500000, 'occupied', NULL),
('B405', 'B', 4, 100.0, 3, 3, 4100000, 'available', NULL);

-- Link apartments to residents
UPDATE apartments SET resident_id = (SELECT id FROM users WHERE username = 'user001') WHERE apartment_number = 'A101';
UPDATE apartments SET resident_id = (SELECT id FROM users WHERE username = 'user003') WHERE apartment_number = 'A202';
UPDATE apartments SET resident_id = (SELECT id FROM users WHERE username = 'user004') WHERE apartment_number = 'A305';
UPDATE apartments SET resident_id = (SELECT id FROM users WHERE username = 'user002') WHERE apartment_number = 'B101';
UPDATE apartments SET resident_id = (SELECT id FROM users WHERE username = 'user005') WHERE apartment_number = 'B203';
UPDATE apartments SET resident_id = (SELECT id FROM users WHERE username = 'user006') WHERE apartment_number = 'B404';

-- Insert sample bills
INSERT INTO bills (bill_number, user_id, bill_type, title, description, amount, due_date, status) VALUES
('HD202401001', (SELECT id FROM users WHERE username = 'user001'), 'management_fee', 'Phí quản lý tháng 1/2025', 'Phí quản lý chung cư cho căn hộ A101', 2000000, '2025-02-15', 'pending'),
('HD202401002', (SELECT id FROM users WHERE username = 'user002'), 'utility', 'Tiền điện nước tháng 1/2024', 'Tiền điện nước cho căn hộ B101', 1500000, '2025-02-20', 'pending'),
('HD202401003', (SELECT id FROM users WHERE username = 'user001'), 'parking', 'Phí gửi xe tháng 1/2024', 'Phí gửi xe ô tô và xe máy', 800000, '2025-02-10', 'paid'),
('HD202401004', (SELECT id FROM users WHERE username = 'user001'), 'parking', 'Phí gửi xe', 'Phí gửi xe', 2000000, '2025-02-15', 'pending');

-- Insert sample tickets
INSERT INTO tickets (user_id, category, priority, title, description, status, assigned_to, resolution_notes, resolved_by, resolved_at) VALUES
((SELECT id FROM users WHERE username = 'user001'), 'maintenance', 'urgent', 'Sửa chữa vòi nước bị rò rỉ khẩn cấp', 'Vòi nước trong nhà vệ sinh căn hộ A101 bị rò rỉ lớn, cần thợ đến ngay lập tức.', 'open', NULL, NULL, NULL, NULL),
((SELECT id FROM users WHERE username = 'user001'), 'noise', 'high', 'Phản ánh tiếng ồn từ căn hộ B202', 'Căn hộ B202 thường xuyên gây tiếng ồn lớn vào ban đêm sau 10 giờ tối.', 'in_progress', (SELECT id FROM users WHERE username = 'receptionist'), NULL, NULL, NULL),
((SELECT id FROM users WHERE username = 'user001'), 'cleaning', 'low', 'Yêu cầu vệ sinh hành lang Tầng 1', 'Hành lang tầng 1 tòa nhà A có vết bẩn, cần được dọn dẹp.', 'resolved', (SELECT id FROM users WHERE username = 'receptionist'), 'Đã cử nhân viên vệ sinh dọn dẹp và xác nhận hoàn thành.', (SELECT id FROM users WHERE username = 'receptionist'), CURRENT_TIMESTAMP),
((SELECT id FROM users WHERE username = 'user001'), 'suggestion', 'normal', 'Đề xuất lắp đặt thêm ghế đá công viên', 'Khu vực công viên cần thêm ghế đá để cư dân có thể ngồi nghỉ ngơi thoải mái hơn.', 'open', NULL, NULL, NULL, NULL),
((SELECT id FROM users WHERE username = 'user002'), 'maintenance', 'high', 'Lỗi khóa cửa ra vào', 'Khóa cửa căn hộ B101 bị kẹt, không thể mở được.', 'closed', (SELECT id FROM users WHERE username = 'receptionist'), 'Đã thay thế ổ khóa mới, cư dân xác nhận hoạt động bình thường.', (SELECT id FROM users WHERE username = 'receptionist'), CURRENT_TIMESTAMP - INTERVAL '3 days');

-- Insert sample services
INSERT INTO services (name, description, category, price, unit, status, provider_name) VALUES
('Dọn dẹp căn hộ', 'Dịch vụ dọn dẹp vệ sinh tiêu chuẩn: quét, lau sàn, lau bụi, vệ sinh toilet.', 'cleaning', 150000, 'giờ', 'active', 'CleanPro'),
('Sửa chữa điện lạnh', 'Bảo dưỡng máy lạnh, sửa tủ lạnh, máy giặt.', 'repair', 250000, 'lần', 'active', 'Điện Lạnh 24h');

-- Insert sample service bookings
INSERT INTO service_bookings (booking_number, service_id, user_id, scheduled_date, scheduled_time_start, unit_price, quantity, total_amount, status) VALUES
('BK-PENDING-01', 1, (SELECT id FROM users WHERE username = 'user001'), CURRENT_DATE + INTERVAL '2 days', '09:00', 150000, 2, 300000, 'pending'),
('BK-COMPLETED-01', 2, (SELECT id FROM users WHERE username = 'user001'), CURRENT_DATE - INTERVAL '10 days', '14:00', 250000, 1, 250000, 'completed');

-- Insert sample vehicles
INSERT INTO vehicle_registrations (user_id, license_plate, make, model, color, vehicle_type, status, parking_spot, registered_at, expires_at, approved_at, approved_by) VALUES
((SELECT id FROM users WHERE username = 'user001'), '30A-123.45', 'Toyota', 'Camry', 'Trắng', 'car', 'active', 'P1-23', CURRENT_TIMESTAMP - INTERVAL '180 days', CURRENT_TIMESTAMP + INTERVAL '185 days', CURRENT_TIMESTAMP - INTERVAL '175 days', (SELECT id FROM users WHERE username = 'manager')),
((SELECT id FROM users WHERE username = 'user001'), '29X-999.88', 'Honda', 'SH Mode', 'Đỏ mận', 'motorcycle', 'pending', NULL, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '363 days', NULL, NULL),
((SELECT id FROM users WHERE username = 'user001'), '30F-555.66', 'VinFast', 'VF e34', 'Xanh lam', 'car', 'rejected', NULL, CURRENT_TIMESTAMP - INTERVAL '5 days', NULL, NULL, NULL);

-- Insert sample notifications
INSERT INTO notifications (title, content, type, priority, target_audience, status, scheduled_at, sent_at, push_notification, email, created_by) VALUES
('Thông báo bảo trì thang máy', 'Thang máy tòa A sẽ được bảo trì vào ngày 15/02/2025 từ 8:00 đến 17:00. Vui lòng sử dụng cầu thang bộ.', 'maintenance', 2, 'building_A', 'sent', '2025-02-10 08:00:00', '2025-02-10 08:00:00', true, true, (SELECT id FROM users WHERE username = 'receptionist')),
('Nhắc nhở thanh toán hóa đơn', 'Kính gửi cư dân, hóa đơn phí quản lý tháng 1/2025 sẽ đến hạn thanh toán vào ngày 15/02/2025.', 'bill_reminder', 1, 'all', 'sent', '2025-02-05 09:00:00', '2025-02-05 09:00:00', true, true, (SELECT id FROM users WHERE username = 'manager')),
('Sự kiện Tết Nguyên Đán 2025', 'Chung cư tổ chức tiệc Tết Nguyên Đán vào ngày 10/02/2025 tại sảnh tầng 1. Mời các gia đình tham gia.', 'event', 1, 'all', 'scheduled', '2025-02-01 10:00:00', NULL, true, true, (SELECT id FROM users WHERE username = 'receptionist'));

-- ============================================
-- COMPLETE!
-- ============================================
SELECT 'Database schema created successfully!' as message;
SELECT 'Test accounts - Password: 123456 for all' as info;
SELECT 'Manager: manager@apartment.com' as account1;
SELECT 'Accountant: accountant@apartment.com' as account2;
SELECT 'Receptionist: receptionist@apartment.com' as account3;
SELECT 'User001: vamila2710@gmail.com' as account4;
SELECT 'User002: lexa61313@gmail.com' as account5;