import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  useToast,
  Spinner,
  Center,
  Icon,
  Flex,
  Spacer,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react'
import { FiBell, FiClock, FiMapPin, FiCheck, FiAlertCircle } from 'react-icons/fi'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

interface Notification {
  id: number
  title: string
  content: string
  type: string
  priority: number
  target_audience: string
  target_user_id?: number
  status: string
  created_at: string
  sent_at?: string
  event_date?: string
  event_location?: string
  requires_response: boolean
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const { token } = useAuth()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const [allResponse, unreadResponse] = await Promise.all([
        axios.get('http://localhost:8000/api/v1/notifications/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:8000/api/v1/notifications/', {
          headers: { Authorization: `Bearer ${token}` },
          params: { unread_only: true }
        })
      ])
      
      setNotifications(allResponse.data)
      setUnreadNotifications(unreadResponse.data)
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách thông báo',
        status: 'error',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    setSelectedNotification(notification)
    onOpen()
    
    // Mark as read
    try {
      await axios.post(
        `http://localhost:8000/api/v1/notifications/${notification.id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      general: 'Thông báo chung',
      bill_reminder: 'Nhắc nhở hóa đơn',
      payment_confirmation: 'Xác nhận thanh toán',
      maintenance: 'Bảo trì',
      event: 'Sự kiện',
      urgent: 'Khẩn cấp'
    }
    return types[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      general: 'blue',
      bill_reminder: 'orange',
      payment_confirmation: 'green',
      maintenance: 'yellow',
      event: 'purple',
      urgent: 'red'
    }
    return colors[type] || 'gray'
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'gray'
      case 2: return 'blue'
      case 3: return 'orange'
      case 4: return 'red'
      default: return 'gray'
    }
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Thấp'
      case 2: return 'Bình thường'
      case 3: return 'Cao'
      case 4: return 'Khẩn cấp'
      default: return 'N/A'
    }
  }

  const isUnread = (notification: Notification) => {
    return unreadNotifications.some(n => n.id === notification.id)
  }

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const unread = isUnread(notification)
    
    return (
      <Box
        p={4}
        bg={unread ? 'blue.50' : 'white'}
        borderRadius="lg"
        shadow="sm"
        borderWidth="1px"
        borderColor={unread ? 'blue.200' : 'gray.200'}
        cursor="pointer"
        _hover={{ shadow: 'md', borderColor: 'blue.300' }}
        onClick={() => handleNotificationClick(notification)}
        position="relative"
      >
        {unread && (
          <Box
            position="absolute"
            top={2}
            right={2}
            w={2}
            h={2}
            bg="blue.500"
            borderRadius="full"
          />
        )}
        
        <VStack align="stretch" spacing={2}>
          <HStack>
            <Icon
              as={notification.priority === 4 ? FiAlertCircle : FiBell}
              color={notification.priority === 4 ? 'red.500' : 'blue.500'}
              boxSize={5}
            />
            <Text fontWeight="bold" fontSize="lg" flex={1}>
              {notification.title}
            </Text>
            <Badge colorScheme={getPriorityColor(notification.priority)} fontSize="xs">
              {getPriorityLabel(notification.priority)}
            </Badge>
          </HStack>

          <Text color="gray.600" noOfLines={2}>
            {notification.content}
          </Text>

          <HStack spacing={2} flexWrap="wrap">
            <Badge colorScheme={getTypeColor(notification.type)}>
              {getTypeLabel(notification.type)}
            </Badge>
            
            {notification.target_user_id && (
              <Badge colorScheme="pink">Riêng tư</Badge>
            )}
            
            <Spacer />
            
            <HStack spacing={1} color="gray.500" fontSize="sm">
              <Icon as={FiClock} />
              <Text>
                {new Date(notification.created_at).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </HStack>
          </HStack>
        </VStack>
      </Box>
    )
  }

  if (loading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    )
  }

  return (
    <Box>
      <Flex mb={6} align="center">
        <Text fontSize="2xl" fontWeight="bold">
          Thông báo
        </Text>
        <Spacer />
        {unreadNotifications.length > 0 && (
          <Badge colorScheme="red" fontSize="md" px={3} py={1} borderRadius="full">
            {unreadNotifications.length} chưa đọc
          </Badge>
        )}
      </Flex>

      <Tabs colorScheme="blue">
        <TabList>
          <Tab>
            Tất cả ({notifications.length})
          </Tab>
          <Tab>
            Chưa đọc ({unreadNotifications.length})
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <VStack spacing={3} align="stretch">
              {notifications.length === 0 ? (
                <Center py={10}>
                  <VStack>
                    <Icon as={FiBell} boxSize={12} color="gray.300" />
                    <Text color="gray.500">Chưa có thông báo nào</Text>
                  </VStack>
                </Center>
              ) : (
                notifications.map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))
              )}
            </VStack>
          </TabPanel>

          <TabPanel px={0}>
            <VStack spacing={3} align="stretch">
              {unreadNotifications.length === 0 ? (
                <Center py={10}>
                  <VStack>
                    <Icon as={FiCheck} boxSize={12} color="green.300" />
                    <Text color="gray.500">Bạn đã đọc hết thông báo</Text>
                  </VStack>
                </Center>
              ) : (
                unreadNotifications.map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Notification Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon
                as={selectedNotification?.priority === 4 ? FiAlertCircle : FiBell}
                color={selectedNotification?.priority === 4 ? 'red.500' : 'blue.500'}
              />
              <Text>{selectedNotification?.title}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <HStack spacing={2}>
                <Badge colorScheme={getTypeColor(selectedNotification?.type || '')}>
                  {getTypeLabel(selectedNotification?.type || '')}
                </Badge>
                <Badge colorScheme={getPriorityColor(selectedNotification?.priority || 2)}>
                  {getPriorityLabel(selectedNotification?.priority || 2)}
                </Badge>
                {selectedNotification?.target_user_id && (
                  <Badge colorScheme="pink">Riêng tư</Badge>
                )}
              </HStack>

              <Divider />

              <Box>
                <Text fontSize="md" whiteSpace="pre-wrap">
                  {selectedNotification?.content}
                </Text>
              </Box>

              {selectedNotification?.event_date && (
                <>
                  <Divider />
                  <VStack align="stretch" spacing={2}>
                    <HStack>
                      <Icon as={FiClock} color="blue.500" />
                      <Text fontWeight="semibold">Thời gian sự kiện:</Text>
                    </HStack>
                    <Text pl={6}>
                      {new Date(selectedNotification.event_date).toLocaleString('vi-VN', {
                        dateStyle: 'full',
                        timeStyle: 'short'
                      })}
                    </Text>
                  </VStack>
                </>
              )}

              {selectedNotification?.event_location && (
                <VStack align="stretch" spacing={2}>
                  <HStack>
                    <Icon as={FiMapPin} color="red.500" />
                    <Text fontWeight="semibold">Địa điểm:</Text>
                  </HStack>
                  <Text pl={6}>{selectedNotification.event_location}</Text>
                </VStack>
              )}

              <Divider />

              <HStack color="gray.500" fontSize="sm">
                <Icon as={FiClock} />
                <Text>
                  Gửi lúc:{' '}
                  {selectedNotification?.created_at &&
                    new Date(selectedNotification.created_at).toLocaleString('vi-VN')}
                </Text>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Đóng</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
