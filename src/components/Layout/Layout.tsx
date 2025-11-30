import { Box, Flex } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import Header from './Header'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/bills': 'Bills & Payments',
  '/tickets': 'Feedback & Support',
  '/vehicles': 'Vehicle Management',
  '/utilities': 'Utility Services',
  '/profile': 'Profile Settings',
  '/settings': 'System Settings',
}

const staffPageTitles: Record<string, string> = {
  // Manager
  '/': 'Manager Dashboard',
  '/apartments': 'Apartments Management',
  '/users': 'Users Management',
  '/admin/vehicles': 'Vehicles Management',
  
  // Accountant
  '/admin/bills': 'Bills Management',
  
  // Receptionist
  '/admin/tickets': 'Tickets Management',
  '/admin/notifications': 'Notifications Management',
  
  // Common
  '/profile': 'Profile Settings',
  '/settings': 'System Settings',
}

export default function Layout() {
  const location = useLocation()
  const { isStaff } = useAuth()
  
  const titles = isStaff() ? staffPageTitles : pageTitles
  const title = titles[location.pathname] || 'Dashboard'

  return (
    <Flex h="100vh">
      <AdminSidebar />
      <Box flex="1" overflow="auto">
        <Header title={title} />
        <Box p="6">
          <Outlet />
        </Box>
      </Box>
    </Flex>
  )
}