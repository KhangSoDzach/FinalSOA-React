import { Box, VStack, Text, Flex, Icon, useColorModeValue, Badge } from '@chakra-ui/react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  FiHome, 
  FiFileText, 
  FiMessageSquare, 
  FiTruck, 
  FiSettings, 
  FiUser,
  FiTool,
  FiUsers,
  FiBell
} from 'react-icons/fi'
import { BsBuilding } from 'react-icons/bs'
import { useAuth } from '../../contexts/AuthContext'

// Menu items for regular users
const sidebarItems = [
  { name: 'Home', icon: FiHome, path: '/' },
  { name: 'Bills', icon: FiFileText, path: '/bills' },
  { name: 'Notifications', icon: FiBell, path: '/notifications' },
  { name: 'Feedback', icon: FiMessageSquare, path: '/tickets' },
  { name: 'Vehicle Card', icon: FiTruck, path: '/vehicles' },
  { name: 'Utilities', icon: FiTool, path: '/utilities' },
]

// Menu items for Manager (Quản lý) - Full access
const managerItems = [
  { name: 'Dashboard', icon: FiHome, path: '/' },
  { name: 'Apartments', icon: BsBuilding, path: '/apartments' },
  { name: 'Users', icon: FiUsers, path: '/users' },
  { name: 'Staff', icon: FiUsers, path: '/admin/staff' },
]

// Menu items for Accountant (Kế toán) - Finance focused
const accountantItems = [
  { name: 'Dashboard', icon: FiHome, path: '/' },
  { name: 'Bills', icon: FiFileText, path: '/admin/bills' },
]

// Menu items for Receptionist (Lễ tân) - Services & Support focused
const receptionistItems = [
  { name: 'Dashboard', icon: FiHome, path: '/' },
  { name: 'Staff', icon: FiUsers, path: '/admin/staff-view' },
  { name: 'Vehicles', icon: FiTruck, path: '/admin/vehicles' },
  { name: 'Tickets', icon: FiMessageSquare, path: '/admin/tickets' },
  { name: 'Notifications', icon: FiBell, path: '/admin/notifications' },
]

const bottomItems = [
  { name: 'Profile', icon: FiUser, path: '/profile' },
  { name: 'Settings', icon: FiSettings, path: '/settings' },
]

interface MenuItem {
  name: string
  icon: any
  path: string
  badge?: string
}

interface SidebarItemProps {
  item: MenuItem
}

function SidebarItem({ item }: SidebarItemProps) {
  const location = useLocation()
  const { isStaff } = useAuth()
  const isStaffUser = isStaff()
  const isActive = location.pathname === item.path
  
  const activeBg = useColorModeValue(
    isStaffUser ? 'purple.100' : 'blue.100',
    isStaffUser ? 'purple.200' : 'blue.200'
  )
  const activeColor = useColorModeValue(
    isStaffUser ? 'purple.700' : 'blue.700',
    isStaffUser ? 'purple.600' : 'blue.600'
  )
  const hoverBg = useColorModeValue(
    isStaffUser ? 'purple.50' : 'blue.50',
    isStaffUser ? 'purple.100' : 'blue.100'
  )

  return (
    <Box
      as={NavLink}
      to={item.path}
      display="block"
      px="4"
      py="3"
      borderRadius="lg"
      transition="all 0.2s"
      bg={isActive ? activeBg : 'transparent'}
      color={isActive ? activeColor : 'gray.600'}
      fontWeight={isActive ? 'semibold' : 'medium'}
      _hover={{
        bg: hoverBg,
        color: activeColor,
        textDecoration: 'none',
      }}
      borderLeft={isActive ? '3px solid' : '3px solid transparent'}
      borderLeftColor={isActive ? (isStaffUser ? 'purple.500' : 'blue.500') : 'transparent'}
    >
      <Flex align="center" gap="3" justify="space-between">
        <Flex align="center" gap="3">
          <Icon as={item.icon} boxSize="5" />
          <Text fontSize="sm">{item.name}</Text>
        </Flex>
        {item.badge && (
          <Badge size="sm" colorScheme="gray" fontSize="9px">
            {item.badge}
          </Badge>
        )}
      </Flex>
    </Box>
  )
}

export default function AdminSidebar() {
  const { user, isStaff } = useAuth()
  
  // Get role-specific menu items
  const getMenuItems = () => {
    switch (user?.role) {
      case 'manager':
        return managerItems
      case 'accountant':
        return accountantItems
      case 'receptionist':
        return receptionistItems
      default:
        return sidebarItems
    }
  }

  // Get role display name and abbreviation
  const getRoleInfo = () => {
    switch (user?.role) {
      case 'manager':
        return { name: 'QUẢN LÝ', abbr: 'QL', color: 'purple' }
      case 'accountant':
        return { name: 'KẾ TOÁN', abbr: 'KT', color: 'green' }
      case 'receptionist':
        return { name: 'LỄ TÂN', abbr: 'LT', color: 'blue' }
      default:
        return { name: 'RESIDENT', abbr: user?.full_name?.charAt(0)?.toUpperCase() || 'U', color: 'blue' }
    }
  }

  const roleInfo = getRoleInfo()
  const menuItems = getMenuItems()
  const isStaffUser = isStaff()
  
  const sidebarBg = useColorModeValue(
    'white',
    'gray.800'
  )
  
  const gradientBg = isStaffUser 
    ? 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)'
    : 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)'

  return (
    <Box
      w="250px"
      h="100vh"
      bg={sidebarBg}
      backgroundImage={gradientBg}
      borderRight="1px solid"
      borderColor="gray.200"
      position="sticky"
      top="0"
    >
      <VStack spacing="0" h="full" p="4">
        {/* Logo */}
        <Box mb="6" textAlign="center">
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color={isStaffUser ? `${roleInfo.color}.600` : 'blue.600'}
            letterSpacing="-0.5px"
            mb="2"
          >
            SKYHOME
          </Text>
        </Box>

        {/* User Info */}
        <Box
          w="full"
          p="4"
          bg={isStaffUser ? `${roleInfo.color}.50` : 'blue.50'}
          borderRadius="lg"
          mb="6"
          textAlign="center"
        >
          <Box
            w="12"
            h="12"
            borderRadius="full"
            bg={isStaffUser ? `${roleInfo.color}.500` : 'blue.500'}
            color="white"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontWeight="bold"
            fontSize="lg"
            mx="auto"
            mb="3"
          >
            {roleInfo.abbr}
          </Box>
          <Text fontWeight="semibold" fontSize="sm" mb="1">
            {isStaffUser ? user?.full_name : (user?.apartment_number || 'Unit 303A')}
          </Text>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase">
            {roleInfo.name}
          </Text>
        </Box>

        {/* Main Navigation */}
        <VStack spacing="1" flex="1" align="stretch" w="full">
          {menuItems.map((item) => (
            <SidebarItem key={item.path} item={item} />
          ))}
        </VStack>

        {/* Bottom Navigation */}
        <VStack spacing="1" align="stretch" w="full">
          {bottomItems.map((item) => (
            <SidebarItem key={item.path} item={item} />
          ))}
        </VStack>
      </VStack>
    </Box>
  )
}
