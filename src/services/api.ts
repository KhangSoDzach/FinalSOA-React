import axios from 'axios'

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },
  
  register: async (userData: {
    username: string
    email: string
    password: string
    full_name: string
    phone?: string
    apartment_number?: string
    occupier?: string
  }) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/users/me')
    return response.data
  },

  changePassword: async (passwords: {
    old_password: string
    new_password: string
  }) => {
    const response = await api.post('/users/change-password', passwords) 
    return response.data
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', null, {
      params: { email }
    })
    return response.data
  },

  verifyResetOtp: async (email: string, otp: string) => {
    const response = await api.post('/auth/verify-reset-otp', null, {
      params: { email, otp }
    })
    return response.data
  },

  resetPassword: async (email: string, otp: string, new_password: string) => {
    const response = await api.post('/auth/reset-password', null, {
      params: { email, otp, new_password }
    })
    return response.data
  },
}

export const usersAPI = {
  getAll: async (params?: {
    skip?: number
    limit?: number
    building?: string
    role?: string
    occupier?: string
  }) => {
    const response = await api.get('/users', { params })
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },
  
  create: async (userData: {
    username: string
    email: string
    password: string
    full_name: string
    phone?: string
    apartment_number?: string
    building?: string
    role?: string
    occupier?: string
  }) => {
    const response = await api.post('/users', userData)
    return response.data
  },
  
  updateCurrentUser: async (userData: {
    full_name?: string
    email?: string
    phone?: string
  }) => {
    const response = await api.put('/users/me', userData)
    return response.data
  },
  
  update: async (id: number, userData: any) => {
    const response = await api.put(`/users/${id}`, userData)
    return response.data
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },
  
  getStats: async () => {
    const response = await api.get('/users/stats/overview')
    return response.data
  }
}

export const billsAPI = {
  requestPayment: async (billId: number) => {
    const response = await api.post('/bills/request-pay', { bill_id: billId })
    return response.data
  },
  
  verifyOTP: async (paymentId: number, otp: string) => {
    const response = await api.post('/bills/verify-otp', { payment_id: paymentId, otp: otp })
    return response.data
  },
  
  resendOTP: async (billId: number) => {
    const response = await api.post('/bills/resend-otp', { bill_id: billId })
    return response.data
  },
  
  payBill: async (billId: number) => {
    return billsAPI.requestPayment(billId);
  },

  getAll: async (params?: {
    skip?: number
    limit?: number
    user_id?: number
    status?: string
    building?: string
  }) => {
    const response = await api.get('/bills', { params })
    return response.data
  },
  getMyBills: async (status?: string) => {
    const response = await api.get('/bills/my-bills', {
      params: { status },
    });
    return response.data;
  },
  
  getAllBills: async (status?: string) => {
    const response = await api.get('/bills', {
      params: { status },
    });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/bills/${id}`)
    return response.data
  },
  
  create: async (billData: any) => {
    const response = await api.post('/bills', billData)
    return response.data
  },
  
  batchCreate: async (billsData: any[]) => {
    const response = await api.post('/bills/batch-create', billsData)
    return response.data
  },
  
  update: async (id: number, billData: any) => {
    const response = await api.put(`/bills/${id}`, billData)
    return response.data
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/bills/${id}`)
    return response.data
  },
  
  sendReminder: async (billIds?: number[]) => {
    const response = await api.post('/bills/send-reminder', billIds || null)
    return response.data
  },
  
  getStatistics: async (startDate?: string, endDate?: string) => {
    const params: any = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    const response = await api.get('/bills/statistics', { params })
    return response.data
  },
  
  exportReport: async (params?: {
    start_date?: string
    end_date?: string
    status_filter?: string
    bill_type_filter?: string
  }) => {
    const response = await api.get('/bills/export-report', {
      params,
      responseType: 'blob'
    })
    return response.data
  },
  
  markOverdue: async () => {
    const response = await api.put('/bills/mark-overdue')
    return response.data
  },
  
  confirmPayment: async (paymentId: number, data: any) => {
    const response = await api.put(`/bills/payments/${paymentId}/confirm`, data)
    return response.data
  },
  
  getPayments: async (billId: number) => {
    const response = await api.get(`/bills/${billId}/payments`)
    return response.data
  },
  
  generateMonthlyFees: async (month?: number, year?: number) => {
    const params: any = {}
    if (month) params.month = month
    if (year) params.year = year
    const response = await api.post('/bills/generate-monthly-fees', null, { params })
    return response.data
  }
}

export const ticketsAPI = {
  getAll: async (params?: {
    skip?: number
    limit?: number
    status?: string
    category?: string
    assigned_to?: number
  }) => {
    const response = await api.get('/tickets', { params })
    return response.data
  },
  getMyTickets: async (status?: string) => {
    const response = await api.get('/tickets/my-tickets', {
      params: { status },
    });
    return response.data;
  },
  
  getTicketDetails: async (id: number) => {
    const response = await api.get(`/tickets/${id}`)
    return response.data
  },
  
  create: async (ticketData: any) => {
    const response = await api.post('/tickets', ticketData)
    return response.data
  },
  
  update: async (id: number, ticketData: any) => {
    const response = await api.put(`/tickets/${id}`, ticketData)
    return response.data
  },
  
  assignTicket: async (id: number, assignData: { assigned_name: string; assigned_role: string; status?: string }) => {
    const response = await api.post(`/tickets/${id}/assign`, assignData)
    return response.data
  },
  
  resolveTicket: async (id: number, resolution_notes: string) => {
    const response = await api.post(`/tickets/${id}/resolve`, { resolution_notes })
    return response.data
  },
  
  uploadAttachment: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/tickets/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  getAttachments: async (id: number) => {
    const response = await api.get(`/tickets/${id}/attachments`);
    return response.data;
  },
  
  getLogs: async (id: number) => {
    const response = await api.get(`/tickets/${id}/logs`);
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/tickets/stats/overview');
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/tickets/${id}`)
    return response.data
  }
}

export const servicesAPI = {
  getAllServices: async () => {
    const response = await api.get('/services')
    return response.data
  },
  
  getMyBookings: async (status?: string) => {
    const response = await api.get('/services/bookings/my-bookings', { params: { status }})
    return response.data
  },

  bookService: async (serviceId: number, bookingData: any) => {
    const response = await api.post(`/services/${serviceId}/book`, bookingData)
    return response.data
  },

  cancelBooking: async (bookingId: number) => {
    const response = await api.post(`/services/bookings/${bookingId}/cancel`)
    return response.data
  },

  // Admin endpoints
  getAllServicesAdmin: async (params?: { category?: string; status?: string }) => {
    const response = await api.get('/services/admin/all', { params })
    return response.data
  },

  getAllBookingsAdmin: async (params?: { 
    status?: string
    service_id?: number
    user_id?: number
    skip?: number
    limit?: number
  }) => {
    const response = await api.get('/services/admin/bookings/all', { params })
    return response.data
  },

  confirmBooking: async (bookingId: number, data: { status: string; notes?: string }) => {
    const response = await api.post(`/services/admin/bookings/${bookingId}/confirm`, data)
    return response.data
  },

  completeBooking: async (bookingId: number) => {
    const response = await api.put(`/services/admin/bookings/${bookingId}/complete`)
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get(`/services/${id}`)
    return response.data
  },
  
  create: async (serviceData: any) => {
    const response = await api.post('/services/admin', serviceData)
    return response.data
  },
  
  update: async (id: number, serviceData: any) => {
    const response = await api.put(`/services/admin/${id}`, serviceData)
    return response.data
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/services/admin/${id}`)
    return response.data
  }
}

export const apartmentsAPI = {
  getAll: async (params?: {
    skip?: number
    limit?: number
    building?: string
    status?: string
  }) => {
    const response = await api.get('/apartments', { params })
    return response.data
  },
  getStatistics: async () => {
    const response = await api.get('/apartments/stats/overview')
    return response.data
  },
}

export const notificationsAPI = {
  getAll: async () => {
    const response = await api.get('/notifications')
    return response.data
  },
  
  markAsRead: async (id: number) => {
    const response = await api.put(`/notifications/${id}/read`)
    return response.data
  },
  
  create: async (notificationData: any) => {
    const response = await api.post('/notifications', notificationData)
    return response.data
  }
}

// 🌟 MỚI: Thêm vehiclesAPI
export const vehiclesAPI = {
  getMyVehicles: async () => {
    const response = await api.get('/vehicles/my-vehicles')
    return response.data
  },

  create: async (vehicleData: any) => {
    const response = await api.post('/vehicles/', vehicleData)
    return response.data
  },

  update: async (id: number, vehicleData: any) => {
    const response = await api.put(`/vehicles/${id}`, vehicleData)
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/vehicles/${id}`)
    return response.data
  }
}

export default api