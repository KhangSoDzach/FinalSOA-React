# Admin Bills Management - Hướng dẫn sử dụng

## Tổng quan
Module quản lý hóa đơn dành cho Admin cung cấp đầy đủ các tính năng để tạo, điều chỉnh, xác thực thanh toán, gửi nhắc nợ và xuất báo cáo thu.

## Tính năng chính

### 1. Dashboard Thống kê
- **Tổng số hóa đơn**: Hiển thị tổng số hóa đơn trong hệ thống và tổng giá trị
- **Hóa đơn chờ thanh toán**: Số lượng và tổng giá trị hóa đơn đang pending
- **Hóa đơn đã thanh toán**: Số lượng và tổng giá trị đã thu được
- **Hóa đơn quá hạn**: Số lượng hóa đơn cần xử lý khẩn cấp
- **Tỷ lệ thu**: Phần trăm số tiền đã thu so với tổng số tiền phải thu

### 2. Tạo hóa đơn mới
**Endpoint**: `POST /api/v1/bills`

**Các trường thông tin**:
- Cư dân (user_id): Chọn từ danh sách cư dân
- Loại hóa đơn (bill_type):
  - Management Fee: Phí quản lý
  - Utility: Tiện ích (điện, nước, gas)
  - Parking: Phí đỗ xe
  - Service: Dịch vụ khác
  - Other: Khác
- Tiêu đề (title): Mô tả ngắn gọn
- Mô tả (description): Chi tiết về hóa đơn
- Số tiền (amount): Giá trị bằng VND
- Ngày đến hạn (due_date): Hạn thanh toán

**Chức năng**:
- Hệ thống tự động tạo mã hóa đơn duy nhất (format: BILL-YYYYMMDD-XXXXXXXX)
- Trạng thái mặc định: Pending

### 3. Tạo hóa đơn hàng loạt
**Endpoint**: `POST /api/v1/bills/batch-create`

Cho phép tạo nhiều hóa đơn cùng lúc (ví dụ: phí quản lý hàng tháng cho tất cả cư dân).

### 4. Điều chỉnh hóa đơn
**Endpoint**: `PUT /api/v1/bills/{bill_id}`

**Có thể điều chỉnh**:
- Tiêu đề
- Mô tả
- Số tiền
- Ngày đến hạn
- Trạng thái (Pending, Paid, Overdue, Cancelled)

**Lưu ý**: Không thể thay đổi người nhận hóa đơn sau khi đã tạo.

### 5. Xác thực thanh toán
**Endpoint**: `PUT /api/v1/bills/payments/{payment_id}/confirm`

**Quy trình**:
1. Cư dân tải lên chứng từ thanh toán
2. Admin xem xét chứng từ
3. Admin xác nhận hoặc từ chối thanh toán
4. Nếu xác nhận: Hóa đơn chuyển sang trạng thái Paid

**Các trạng thái thanh toán**:
- Pending: Chờ xác nhận
- Completed: Đã xác nhận
- Failed: Thất bại
- Cancelled: Đã hủy

### 6. Gửi nhắc nợ
**Endpoint**: `POST /api/v1/bills/send-reminder`

**Chức năng**:
- Gửi nhắc nợ cho tất cả hóa đơn pending/overdue
- Gửi nhắc nợ cho các hóa đơn được chọn
- Tự động tạo thông báo trong hệ thống cho cư dân
- Mức độ ưu tiên:
  - Overdue: Urgent (priority 4)
  - Pending: High (priority 3)

### 7. Đánh dấu hóa đơn quá hạn
**Endpoint**: `PUT /api/v1/bills/mark-overdue`

**Chức năng**:
- Tự động quét tất cả hóa đơn Pending có due_date < ngày hiện tại
- Chuyển trạng thái sang Overdue
- Gửi thông báo khẩn cấp cho cư dân

**Khuyến nghị**: Chạy hàng ngày hoặc tự động hóa qua cron job.

### 8. Xuất báo cáo thu
**Endpoint**: `GET /api/v1/bills/export-report`

**Định dạng**: CSV file

**Các thông tin trong báo cáo**:
- Mã hóa đơn
- Loại hóa đơn
- Tiêu đề và mô tả
- Số tiền
- Ngày đến hạn
- Trạng thái
- Ngày tạo
- Ngày thanh toán
- Thông tin cư dân (ID, tên, email, số điện thoại, căn hộ, tòa nhà)

**Bộ lọc**:
- Khoảng thời gian (start_date, end_date)
- Trạng thái (status_filter)
- Loại hóa đơn (bill_type_filter)

### 9. Thống kê chi tiết
**Endpoint**: `GET /api/v1/bills/statistics`

**Thông tin trả về**:
```json
{
  "date_range": {
    "start_date": "2024-10-01T00:00:00",
    "end_date": "2024-11-03T00:00:00"
  },
  "total_bills": 150,
  "bills_by_status": {
    "pending": 45,
    "paid": 95,
    "overdue": 8,
    "cancelled": 2
  },
  "amounts": {
    "total_amount": 350000000,
    "paid_amount": 285000000,
    "pending_amount": 65000000,
    "collection_rate": 81.43
  },
  "bills_by_type": {
    "management_fee": {
      "count": 100,
      "total_amount": 250000000
    },
    "utility": {
      "count": 30,
      "total_amount": 50000000
    },
    "parking": {
      "count": 20,
      "total_amount": 50000000
    }
  }
}
```

### 10. Tìm kiếm và lọc
**Chức năng frontend**:
- Tìm kiếm theo: Mã hóa đơn, tiêu đề, tên cư dân, căn hộ
- Lọc theo trạng thái: All, Pending, Paid, Overdue, Cancelled
- Lọc theo loại: All, Management Fee, Utility, Parking, Service, Other

### 11. Xóa hóa đơn
**Endpoint**: `DELETE /api/v1/bills/{bill_id}`

**Lưu ý**: 
- Chỉ Admin mới có quyền xóa
- Xóa hóa đơn sẽ xóa cả các thanh toán liên quan
- Cần xác nhận trước khi xóa

## Workflow hoàn chỉnh

### Quy trình tạo và thu hóa đơn hàng tháng:

1. **Đầu tháng**: 
   - Admin tạo hóa đơn hàng loạt cho tất cả cư dân (batch-create)
   - Hệ thống gửi thông báo tự động cho cư dân

2. **Trong tháng**:
   - Cư dân xem hóa đơn và thực hiện thanh toán
   - Cư dân tải chứng từ thanh toán lên hệ thống
   - Admin xác nhận thanh toán và cập nhật trạng thái

3. **Gần đến hạn** (3-5 ngày trước):
   - Admin gửi nhắc nợ cho các hóa đơn còn pending

4. **Sau hạn thanh toán**:
   - Chạy chức năng "Mark Overdue" để đánh dấu quá hạn
   - Gửi thông báo khẩn cấp cho cư dân

5. **Cuối tháng**:
   - Xuất báo cáo thu để đối chiếu
   - Xem thống kê tỷ lệ thu
   - Xử lý các trường hợp quá hạn

## Quyền hạn

**Admin**:
- Tạo, sửa, xóa hóa đơn
- Xác nhận thanh toán
- Gửi nhắc nợ
- Xuất báo cáo
- Xem tất cả hóa đơn của mọi cư dân

**User (Cư dân)**:
- Xem hóa đơn của mình
- Tải chứng từ thanh toán
- Tạo yêu cầu thanh toán

## API Security

Tất cả các endpoint Bills đều yêu cầu authentication thông qua JWT token:
- Header: `Authorization: Bearer <token>`
- Các endpoint admin yêu cầu role: `admin` hoặc `manager`

## Best Practices

1. **Tạo hóa đơn đúng hạn**: Tạo hóa đơn ít nhất 7-10 ngày trước hạn thanh toán
2. **Nhắc nợ kịp thời**: Gửi nhắc nợ 2-3 lần trước khi quá hạn
3. **Xác nhận thanh toán nhanh**: Xác nhận trong vòng 24h để cư dân yên tâm
4. **Backup dữ liệu**: Xuất báo cáo định kỳ để lưu trữ
5. **Kiểm tra quá hạn hàng ngày**: Chạy mark-overdue mỗi sáng

## Testing

### Test tạo hóa đơn:
```bash
curl -X POST http://localhost:8000/api/v1/bills \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "title": "Management Fee - November 2024",
    "bill_type": "management_fee",
    "amount": 2500000,
    "due_date": "2024-11-30T00:00:00"
  }'
```

### Test gửi nhắc nợ:
```bash
curl -X POST http://localhost:8000/api/v1/bills/send-reminder \
  -H "Authorization: Bearer <admin_token>"
```

### Test xuất báo cáo:
```bash
curl -X GET "http://localhost:8000/api/v1/bills/export-report?start_date=2024-11-01&end_date=2024-11-30" \
  -H "Authorization: Bearer <admin_token>" \
  --output bill_report.csv
```

## Troubleshooting

### Lỗi thường gặp:

1. **401 Unauthorized**: Kiểm tra token đã hết hạn chưa
2. **403 Forbidden**: User không có quyền admin
3. **404 Not Found**: Bill ID không tồn tại
4. **422 Validation Error**: Thiếu hoặc sai format dữ liệu đầu vào

### Debug:
- Kiểm tra logs trong terminal backend
- Sử dụng browser DevTools để xem network requests
- Kiểm tra database để verify dữ liệu

## Support

Nếu gặp vấn đề, liên hệ:
- Email: support@apartment.com
- Slack: #bills-support
- Documentation: /docs/bills
