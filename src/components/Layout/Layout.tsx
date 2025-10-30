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

const adminPageTitles: Record<string, string> = {
  '/': 'Admin Dashboard',
  '/bills': 'Bills Management (All)',
  '/tickets': 'Feedback Management (All)',
  '/vehicles': 'Vehicle Management (All)',
  '/utilities': 'Utilities Management (All)',
  '/profile': 'Admin Profile',
  '/settings': 'System Settings',
}

export default function Layout() {
  const location = useLocation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  
  const titles = isAdmin ? adminPageTitles : pageTitles
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