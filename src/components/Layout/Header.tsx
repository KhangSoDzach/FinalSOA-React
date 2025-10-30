import { Box, Flex, Text, Spacer, IconButton, Menu, MenuButton, MenuList, MenuItem, Avatar } from '@chakra-ui/react'
import { FiBell, FiChevronDown, FiUser, FiSettings, FiLogOut } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleProfile = () => {
    navigate('/profile')
  }

  const handleSettings = () => {
    navigate('/settings')
  }

  return (
    <Box
      bg="white"
      p="4"
      borderBottom="1px solid"
      borderColor="gray.200"
      mb="6"
    >
      <Flex align="center">
        <Text fontSize="2xl" fontWeight="semibold" color="gray.800">
          {title}
        </Text>
        
        <Spacer />
        
        <Flex align="center" gap="4">
          {/* Notifications */}
          <IconButton
            aria-label="Notifications"
            icon={<FiBell />}
            variant="ghost"
            size="lg"
            color="gray.600"
            _hover={{ bg: 'gray.100' }}
          />
          
          {/* User Menu */}
          <Menu>
            <MenuButton
              as={Flex}
              align="center"
              gap="2"
              cursor="pointer"
              p="2"
              borderRadius="md"
              _hover={{ bg: 'gray.50' }}
            >
              <Avatar size="sm" name={user?.full_name || 'User'} />
              <Text fontSize="sm" fontWeight="medium">
                {user?.full_name || 'User'}
              </Text>
              <FiChevronDown />
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiUser />} onClick={handleProfile}>
                Profile
              </MenuItem>
              <MenuItem icon={<FiSettings />} onClick={handleSettings}>
                Settings
              </MenuItem>
              <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
                Sign out
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  )
}