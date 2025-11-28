import { Box, Flex, Text, Spacer, IconButton, Menu, MenuButton, MenuList, MenuItem, Avatar, Badge, VStack, HStack, Divider } from '@chakra-ui/react'
import { FiBell, FiChevronDown, FiUser, FiSettings, FiLogOut } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'

interface HeaderProps {
  title: string
}

interface Notification {
  id: number
  title: string
  content: string
  type: string
  priority: number
  created_at: string
}

export default function Header({ title }: HeaderProps) {
  const { user, logout, token } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (token) {
      fetchUnreadNotifications()
    }
  }, [token])

  const fetchUnreadNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/notifications/', {
        headers: { Authorization: `Bearer ${token}` },
        params: { unread_only: true, limit: 5 }
      })
      setRecentNotifications(response.data)
      setUnreadCount(response.data.length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

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

  const handleNotificationClick = async (notificationId: number) => {
    try {
      await axios.post(
        `http://localhost:8000/api/v1/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchUnreadNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
    navigate('/notifications')
  }

  const handleViewAllNotifications = () => {
    navigate('/notifications')
  }

  const getNotificationIcon = (priority: number) => {
    return priority === 4 ? '🚨' : priority === 3 ? '⚠️' : '📢'
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
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Notifications"
              icon={
                <Box position="relative">
                  <FiBell />
                  {unreadCount > 0 && (
                    <Badge
                      position="absolute"
                      top="-8px"
                      right="-8px"
                      colorScheme="red"
                      borderRadius="full"
                      fontSize="xs"
                      minW="18px"
                      h="18px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Box>
              }
              variant="ghost"
              size="lg"
              color="gray.600"
              _hover={{ bg: 'gray.100' }}
            />
            <MenuList maxW="400px" maxH="500px" overflowY="auto">
              <Box px={4} py={2} borderBottomWidth="1px">
                <HStack justify="space-between">
                  <Text fontWeight="bold" fontSize="sm">
                    Thông báo
                  </Text>
                  {unreadCount > 0 && (
                    <Badge colorScheme="red" borderRadius="full">
                      {unreadCount} mới
                    </Badge>
                  )}
                </HStack>
              </Box>

              {recentNotifications.length === 0 ? (
                <Box py={8} textAlign="center">
                  <Text color="gray.500" fontSize="sm">
                    Không có thông báo mới
                  </Text>
                </Box>
              ) : (
                <>
                  {recentNotifications.map((notification, index) => (
                    <Box key={notification.id}>
                      <MenuItem
                        onClick={() => handleNotificationClick(notification.id)}
                        py={3}
                        _hover={{ bg: 'blue.50' }}
                      >
                        <VStack align="stretch" spacing={1} w="full">
                          <HStack spacing={2}>
                            <Text fontSize="lg">
                              {getNotificationIcon(notification.priority)}
                            </Text>
                            <Text fontWeight="semibold" fontSize="sm" noOfLines={1} flex={1}>
                              {notification.title}
                            </Text>
                          </HStack>
                          <Text fontSize="xs" color="gray.600" noOfLines={2} pl={7}>
                            {notification.content}
                          </Text>
                          <Text fontSize="xs" color="gray.400" pl={7}>
                            {new Date(notification.created_at).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </VStack>
                      </MenuItem>
                      {index < recentNotifications.length - 1 && <Divider />}
                    </Box>
                  ))}
                  <Divider />
                  <MenuItem
                    onClick={handleViewAllNotifications}
                    textAlign="center"
                    justifyContent="center"
                    color="blue.500"
                    fontWeight="semibold"
                    fontSize="sm"
                  >
                    Xem tất cả thông báo
                  </MenuItem>
                </>
              )}
            </MenuList>
          </Menu>

          {/* Balance Display */}
          <Box
            px="4"
            py="2"
            bg="green.50"
            borderRadius="md"
            borderWidth="1px"
            borderColor="green.200"
          >
            <VStack spacing="0" align="flex-end">
              <Text fontSize="xs" color="gray.600">
                Số dư
              </Text>
              <Text fontSize="md" fontWeight="bold" color="green.600">
                {(user?.balance || 0).toLocaleString('vi-VN')} VNĐ
              </Text>
            </VStack>
          </Box>
          
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