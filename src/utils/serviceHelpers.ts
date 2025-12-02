/**
 * Helper functions for Service-related formatting
 */

/**
 * Map service unit enum to Vietnamese display text
 */
export const getServiceUnitText = (unit: string): string => {
  const unitMap: Record<string, string> = {
    'per_hour': 'Giờ',
    'per_m2': 'M²',
    'per_month': 'Tháng',
    'per_job': 'Lần',
    'per_package': 'Gói',
    'per_slot': 'Slot',
    'per_vehicle': 'Xe',
    'per_unit': 'Đơn vị'
  }
  
  return unitMap[unit] || unit
}

/**
 * Map service category to Vietnamese text
 */
export const getServiceCategoryText = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'cleaning': 'Dọn dẹp',
    'maintenance': 'Bảo trì',
    'repair': 'Sửa chữa',
    'room_booking': 'Đặt phòng',
    'vehicle_service': 'Dịch vụ xe',
    'delivery': 'Giao hàng',
    'other': 'Khác'
  }
  
  return categoryMap[category] || category
}

/**
 * Map service status to Vietnamese text
 */
export const getServiceStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'active': 'Hoạt động',
    'inactive': 'Ngừng hoạt động',
    'maintenance': 'Bảo trì'
  }
  
  return statusMap[status] || status
}

/**
 * Map booking status to Vietnamese text
 */
export const getBookingStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Chờ xác nhận',
    'confirmed': 'Đã xác nhận',
    'in_progress': 'Đang thực hiện',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy',
    'no_show': 'Không đến'
  }
  
  return statusMap[status] || status
}
