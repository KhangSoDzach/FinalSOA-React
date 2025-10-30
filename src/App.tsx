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
import { ProtectedRoute } from './components/ProtectedRoute'
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
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Box>
  )
}

export default App