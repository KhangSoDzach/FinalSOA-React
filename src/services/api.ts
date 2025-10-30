import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
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

// Response interceptor to handle auth errors
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

// Auth API
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
  }) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  }
}

// Users API
export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/users')
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },
  
  update: async (id: number, userData: any) => {
    const response = await api.put(`/users/${id}`, userData)
    return response.data
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  }
}

// Bills API
export const billsAPI = {
  getAll: async () => {
    const response = await api.get('/bills')
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/bills/${id}`)
    return response.data
  },
  
  create: async (billData: any) => {
    const response = await api.post('/bills', billData)
    return response.data
  },
  
  update: async (id: number, billData: any) => {
    const response = await api.put(`/bills/${id}`, billData)
    return response.data
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/bills/${id}`)
    return response.data
  }
}

// Tickets API
export const ticketsAPI = {
  getAll: async () => {
    const response = await api.get('/tickets')
    return response.data
  },
  
  getById: async (id: number) => {
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
  
  delete: async (id: number) => {
    const response = await api.delete(`/tickets/${id}`)
    return response.data
  }
}

// Services API
export const servicesAPI = {
  getAll: async () => {
    const response = await api.get('/services')
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/services/${id}`)
    return response.data
  },
  
  create: async (serviceData: any) => {
    const response = await api.post('/services', serviceData)
    return response.data
  },
  
  update: async (id: number, serviceData: any) => {
    const response = await api.put(`/services/${id}`, serviceData)
    return response.data
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/services/${id}`)
    return response.data
  }
}

// Notifications API
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

// Cashflow API
export const cashflowAPI = {
  getAll: async () => {
    const response = await api.get('/cashflow')
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/cashflow/${id}`)
    return response.data
  },
  
  create: async (cashflowData: any) => {
    const response = await api.post('/cashflow', cashflowData)
    return response.data
  },
  
  update: async (id: number, cashflowData: any) => {
    const response = await api.put(`/cashflow/${id}`, cashflowData)
    return response.data
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/cashflow/${id}`)
    return response.data
  }
}

export default api