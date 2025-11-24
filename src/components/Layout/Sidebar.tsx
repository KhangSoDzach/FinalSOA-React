import { Box, VStack, Text, Button } from '@chakra-ui/react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  FiHome, 
  FiFileText, 
  FiMessageSquare, 
  FiTruck, 
  FiSettings, 
  FiUser,
  FiTool,
  FiBell
} from 'react-icons/fi'

const sidebarItems = [
  { name: 'Home', icon: FiHome, path: '/' },
  { name: 'Bills', icon: FiFileText, path: '/bills' },
  { name: 'Notifications', icon: FiBell, path: '/notifications' },
  { name: 'Feedback', icon: FiMessageSquare, path: '/tickets' },
  { name: 'Vehicle Card', icon: FiTruck, path: '/vehicles' },
  { name: 'Utilities', icon: FiTool, path: '/utilities' },
]

const bottomItems = [
  { name: 'Profile', icon: FiUser, path: '/profile' },
  { name: 'Settings', icon: FiSettings, path: '/settings' },
]

export default function Sidebar() {
  const location = useLocation()

  const SidebarItem = ({ item }: { item: typeof sidebarItems[0] }) => {
    const isActive = location.pathname === item.path
    const Icon = item.icon

    return (
      <Button
        as={NavLink}
        to={item.path}
        variant="ghost"
        leftIcon={<Icon />}
        justifyContent="flex-start"
        w="full"
        h="12"
        fontSize="md"
        fontWeight={isActive ? 'semibold' : 'medium'}
        color={isActive ? 'brand.500' : 'gray.700'}
        bg={isActive ? 'brand.50' : 'transparent'}
        borderLeft={isActive ? '4px solid' : 'none'}
        borderColor={isActive ? 'brand.500' : 'transparent'}
        borderRadius={isActive ? '0 md md 0' : 'md'}
        _hover={{
          bg: isActive ? 'brand.50' : 'gray.100',
          color: isActive ? 'brand.500' : 'brand.500',
        }}
        _activeLink={{
          bg: 'brand.50',
          color: 'brand.500',
        }}
      >
        {item.name}
      </Button>
    )
  }

  return (
    <Box
      w="260px"
      h="100vh"
      bg="white"
      boxShadow="2px 0 10px rgba(0, 0, 0, 0.05)"
      position="sticky"
      top="0"
      p="5"
    >
      <VStack spacing="6" align="stretch" h="full">
        {/* Logo */}
        <Text
          fontSize="xl"
          fontWeight="bold"
          color="brand.500"
          letterSpacing="-0.5px"
          mb="4"
        >
          SKYHOME
        </Text>

        {/* Unit Info */}
        <Box borderBottom="1px solid" borderColor="gray.200" pb="4">
          <Text fontWeight="semibold" fontSize="lg">
            Unit 303A
          </Text>
          <Text fontSize="sm" color="gray.500">
            RESIDENT
          </Text>
        </Box>

        {/* Main Navigation */}
        <VStack spacing="1" flex="1" align="stretch">
          {sidebarItems.map((item) => (
            <SidebarItem key={item.path} item={item} />
          ))}
        </VStack>

        {/* Bottom Navigation */}
        <VStack spacing="1" align="stretch">
          {bottomItems.map((item) => (
            <SidebarItem key={item.path} item={item} />
          ))}
        </VStack>
      </VStack>
    </Box>
  )
}