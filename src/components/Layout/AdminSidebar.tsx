import { Box, VStack, Text, Flex, Icon, useColorModeValue } from '@chakra-ui/react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  FiHome, 
  FiFileText, 
  FiMessageSquare, 
  FiTruck, 
  FiSettings, 
  FiUser,
  FiTool,
  FiUsers
} from 'react-icons/fi'
import { BsBuilding } from 'react-icons/bs'
import { useAuth } from '../../contexts/AuthContext'

const sidebarItems = [
  { name: 'Home', icon: FiHome, path: '/' },
  { name: 'Bills', icon: FiFileText, path: '/bills' },
  { name: 'Feedback', icon: FiMessageSquare, path: '/tickets' },
  { name: 'Vehicle Card', icon: FiTruck, path: '/vehicles' },
  { name: 'Utilities', icon: FiTool, path: '/utilities' },
]

const adminItems = [
  { name: 'Home', icon: FiHome, path: '/' },
  { name: 'Apartments', icon: BsBuilding, path: '/apartments' },
  { name: 'Users', icon: FiUsers, path: '/users' },
  { name: 'Bills', icon: FiFileText, path: '/bills' },
  { name: 'Tickets', icon: FiMessageSquare, path: '/tickets' },
]

const bottomItems = [
  { name: 'Profile', icon: FiUser, path: '/profile' },
  { name: 'Settings', icon: FiSettings, path: '/settings' },
]

interface SidebarItemProps {
  item: {
    name: string
    icon: any
    path: string
  }
}

function SidebarItem({ item }: SidebarItemProps) {
  const location = useLocation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isActive = location.pathname === item.path
  
  const activeBg = useColorModeValue(
    isAdmin ? 'purple.100' : 'blue.100',
    isAdmin ? 'purple.200' : 'blue.200'
  )
  const activeColor = useColorModeValue(
    isAdmin ? 'purple.700' : 'blue.700',
    isAdmin ? 'purple.600' : 'blue.600'
  )
  const hoverBg = useColorModeValue(
    isAdmin ? 'purple.50' : 'blue.50',
    isAdmin ? 'purple.100' : 'blue.100'
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
      borderLeftColor={isActive ? (isAdmin ? 'purple.500' : 'blue.500') : 'transparent'}
    >
      <Flex align="center" gap="3">
        <Icon as={item.icon} boxSize="5" />
        <Text fontSize="sm">{item.name}</Text>
      </Flex>
    </Box>
  )
}

export default function AdminSidebar() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  
  const sidebarBg = useColorModeValue(
    'white',
    'gray.800'
  )
  
  const gradientBg = isAdmin 
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
            color={isAdmin ? 'purple.600' : 'blue.600'}
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
          bg={isAdmin ? 'purple.50' : 'blue.50'}
          borderRadius="lg"
          mb="6"
          textAlign="center"
        >
          <Box
            w="12"
            h="12"
            borderRadius="full"
            bg={isAdmin ? 'purple.500' : 'blue.500'}
            color="white"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontWeight="bold"
            fontSize="lg"
            mx="auto"
            mb="3"
          >
            {isAdmin ? 'AD' : user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </Box>
          <Text fontWeight="semibold" fontSize="sm" mb="1">
            {isAdmin ? 'Admin Panel' : (user?.apartment_number || 'Unit 303A')}
          </Text>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase">
            {isAdmin ? 'ADMINISTRATOR' : 'RESIDENT'}
          </Text>
        </Box>

        {/* Main Navigation */}
        <VStack spacing="1" flex="1" align="stretch" w="full">
          {(isAdmin ? adminItems : sidebarItems).map((item) => (
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
