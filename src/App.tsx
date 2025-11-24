import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import BillsWrapper from './pages/BillsWrapper'
import Tickets from './pages/Tickets'
import Vehicles from './pages/Vehicles'
import Utilities from './pages/Utilities'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Notifications from './pages/Notifications'
import ApartmentsManagement from './pages/admin/ApartmentsManagement'
import UsersManagement from './pages/admin/UsersManagement'
import VehiclesManagement from './pages/admin/VehiclesManagement'
import TicketsManagement from './pages/admin/TicketsManagement'
import NotificationsManagement from './pages/admin/NotificationsManagement'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { useAuth } from './contexts/AuthContext'

function DashboardWrapper() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  
  return isAdmin ? <AdminDashboard /> : <Dashboard />
}

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Box minH="100vh">
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          } 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardWrapper />} />
          <Route path="bills" element={<BillsWrapper />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="utilities" element={<Utilities />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="apartments" element={<AdminRoute><ApartmentsManagement /></AdminRoute>} />
          <Route path="users" element={<AdminRoute><UsersManagement /></AdminRoute>} />
          <Route path="admin/vehicles" element={<AdminRoute><VehiclesManagement /></AdminRoute>} />
          <Route path="admin/tickets" element={<AdminRoute><TicketsManagement /></AdminRoute>} />
          <Route path="admin/notifications" element={<AdminRoute><NotificationsManagement /></AdminRoute>} />
        </Route>
      </Routes>
    </Box>
  )
}

export default App