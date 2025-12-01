import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import BillsWrapper from './pages/BillsWrapper'
import Tickets from './pages/Tickets'
import Vehicles from './pages/Vehicles'
import Utilities from './pages/Utilities'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Notifications from './pages/Notifications'
import ApartmentsManagement from './pages/admin/ApartmentsManagement'
import UsersManagement from './pages/admin/UsersManagement'
import VehiclesManagement from './pages/admin/VehiclesManagement'
import TicketsManagement from './pages/admin/TicketsManagement'
import NotificationsManagement from './pages/admin/NotificationsManagement'
import ManagerDashboard from './pages/admin/ManagerDashboard'
import AccountantDashboard from './pages/admin/AccountantDashboard'
import ReceptionistDashboard from './pages/admin/ReceptionistDashboard'
import AccountantBills from './pages/admin/AccountantBills'
import StaffManagement from './pages/admin/StaffManagement'
import StaffView from './pages/admin/StaffView'
import ServicesManagement from './pages/admin/ServicesManagement'
import { ProtectedRoute } from './components/ProtectedRoute'
import RoleBasedRoute from './components/RoleBasedRoute'
import { useAuth } from './contexts/AuthContext'

function DashboardWrapper() {
  const { user, isStaff } = useAuth()
  
  // Staff roles get their specific dashboards
  if (isStaff()) {
    switch (user?.role) {
      case 'manager':
        return <ManagerDashboard />
      case 'accountant':
        return <AccountantDashboard />
      case 'receptionist':
        return <ReceptionistDashboard />
      default:
        return <Dashboard />
    }
  }
  
  // Regular users get normal dashboard
  return <Dashboard />
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
          path="/forgot-password" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />
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
          
          {/* Manager routes */}
          <Route path="apartments" element={
            <RoleBasedRoute allowedRoles={['manager']}>
              <ApartmentsManagement />
            </RoleBasedRoute>
          } />
          <Route path="users" element={
            <RoleBasedRoute allowedRoles={['manager']}>
              <UsersManagement />
            </RoleBasedRoute>
          } />
          <Route path="admin/staff" element={
            <RoleBasedRoute allowedRoles={['manager']}>
              <StaffManagement />
            </RoleBasedRoute>
          } />
          <Route path="admin/vehicles" element={
            <RoleBasedRoute allowedRoles={['receptionist']}>
              <VehiclesManagement />
            </RoleBasedRoute>
          } />
          
          {/* Accountant routes */}
          <Route path="admin/bills" element={
            <RoleBasedRoute allowedRoles={['accountant', 'manager']}>
              <AccountantBills />
            </RoleBasedRoute>
          } />
          
          {/* Receptionist routes */}
          <Route path="admin/staff-view" element={
            <RoleBasedRoute allowedRoles={['receptionist']}>
              <StaffView />
            </RoleBasedRoute>
          } />
          <Route path="admin/tickets" element={
            <RoleBasedRoute allowedRoles={['receptionist']}>
              <TicketsManagement />
            </RoleBasedRoute>
          } />
          <Route path="admin/notifications" element={
            <RoleBasedRoute allowedRoles={['receptionist']}>
              <NotificationsManagement />
            </RoleBasedRoute>
          } />
          <Route path="admin/services" element={
            <RoleBasedRoute allowedRoles={['receptionist']}>
              <ServicesManagement />
            </RoleBasedRoute>
          } />
        </Route>
      </Routes>
    </Box>
  )
}

export default App