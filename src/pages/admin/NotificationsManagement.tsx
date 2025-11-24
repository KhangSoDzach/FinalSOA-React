import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  VStack,
  HStack,
  useToast,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Text,
  Flex,
  Spacer
} from '@chakra-ui/react'
import { FiPlus, FiEdit, FiTrash2, FiSend } from 'react-icons/fi'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'

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
  created_by: number
}

interface User {
  id: number
  username: string
  full_name: string
  apartment_number: string
  building: string
  role: string
}

export default function NotificationsManagement() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const cancelRef = useState(null)
  const toast = useToast()
  const { token } = useAuth()

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general',
    priority: 2,
    target_audience: 'all',
    target_user_id: '',
    scheduled_at: '',
    event_date: '',
    event_location: '',
    requires_response: false,
    push_notification: true,
    sms: false,
    email: false
  })

  const notificationTypes = [
    { value: 'general', label: 'Thông báo chung' },
    { value: 'bill_reminder', label: 'Nhắc nhở hóa đơn' },
    { value: 'payment_confirmation', label: 'Xác nhận thanh toán' },
    { value: 'maintenance', label: 'Bảo trì' },
    { value: 'event', label: 'Sự kiện' },
    { value: 'urgent', label: 'Khẩn cấp' }
  ]

  const priorityLevels = [
    { value: 1, label: 'Thấp', color: 'gray' },
    { value: 2, label: 'Bình thường', color: 'blue' },
    { value: 3, label: 'Cao', color: 'orange' },
    { value: 4, label: 'Khẩn cấp', color: 'red' }
  ]

  useEffect(() => {
    fetchNotifications()
    fetchUsers()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/notifications/admin', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(response.data)
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

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/users/', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      })
      // Filter out admin users on frontend
      const residents = response.data.filter((user: User) => user.role === 'user')
      console.log('Fetched users:', residents)
      setUsers(residents)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách cư dân',
        status: 'error',
        duration: 3000
      })
    }
  }

  const handleOpenModal = (notification?: Notification) => {
    if (notification) {
      setSelectedNotification(notification)
      setFormData({
        title: notification.title,
        content: notification.content,
        type: notification.type,
        priority: notification.priority,
        target_audience: notification.target_audience,
        target_user_id: notification.target_user_id?.toString() || '',
        scheduled_at: '',
        event_date: '',
        event_location: '',
        requires_response: false,
        push_notification: true,
        sms: false,
        email: false
      })
    } else {
      setSelectedNotification(null)
      setFormData({
        title: '',
        content: '',
        type: 'general',
        priority: 2,
        target_audience: 'all',
        target_user_id: '',
        scheduled_at: '',
        event_date: '',
        event_location: '',
        requires_response: false,
        push_notification: true,
        sms: false,
        email: false
      })
    }
    onOpen()
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        target_user_id: formData.target_user_id ? parseInt(formData.target_user_id) : null,
        target_audience: formData.target_user_id ? '' : formData.target_audience,
        scheduled_at: formData.scheduled_at || null,
        event_date: formData.event_date || null,
        event_location: formData.event_location || null
      }

      if (selectedNotification) {
        await axios.put(
          `http://localhost:8000/api/v1/notifications/${selectedNotification.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        toast({
          title: 'Thành công',
          description: 'Cập nhật thông báo thành công',
          status: 'success',
          duration: 3000
        })
      } else {
        await axios.post('http://localhost:8000/api/v1/notifications/', payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast({
          title: 'Thành công',
          description: 'Tạo và gửi thông báo thành công',
          status: 'success',
          duration: 3000
        })
      }

      fetchNotifications()
      onClose()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu thông báo',
        status: 'error',
        duration: 3000
      })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/v1/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast({
        title: 'Thành công',
        description: 'Xóa thông báo thành công',
        status: 'success',
        duration: 3000
      })
      fetchNotifications()
      setDeleteId(null)
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa thông báo',
        status: 'error',
        duration: 3000
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'green'
      case 'draft': return 'gray'
      case 'scheduled': return 'blue'
      case 'cancelled': return 'red'
      default: return 'gray'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent': return 'Đã gửi'
      case 'draft': return 'Nháp'
      case 'scheduled': return 'Đã lên lịch'
      case 'cancelled': return 'Đã hủy'
      default: return status
    }
  }

  const getPriorityColor = (priority: number) => {
    return priorityLevels.find(p => p.value === priority)?.color || 'gray'
  }

  const getPriorityLabel = (priority: number) => {
    return priorityLevels.find(p => p.value === priority)?.label || 'N/A'
  }

  const getTargetAudienceLabel = (notification: Notification) => {
    if (notification.target_user_id) {
      const user = users.find(u => u.id === notification.target_user_id)
      return user ? `${user.full_name} (${user.apartment_number})` : 'Người dùng cụ thể'
    }
    if (notification.target_audience === 'all') return 'Tất cả cư dân'
    return notification.target_audience
  }

  return (
    <Box>
      <Flex mb={6} align="center">
        <Text fontSize="2xl" fontWeight="bold">
          Quản lý Thông báo
        </Text>
        <Spacer />
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={() => handleOpenModal()}>
          Tạo thông báo mới
        </Button>
      </Flex>

      <Box bg="white" borderRadius="lg" shadow="sm" overflow="hidden">
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Tiêu đề</Th>
              <Th>Loại</Th>
              <Th>Đối tượng</Th>
              <Th>Độ ưu tiên</Th>
              <Th>Trạng thái</Th>
              <Th>Ngày tạo</Th>
              <Th>Thao tác</Th>
            </Tr>
          </Thead>
          <Tbody>
            {notifications.map((notification) => (
              <Tr key={notification.id}>
                <Td fontWeight="medium">{notification.title}</Td>
                <Td>
                  <Badge colorScheme="purple">
                    {notificationTypes.find(t => t.value === notification.type)?.label}
                  </Badge>
                </Td>
                <Td>{getTargetAudienceLabel(notification)}</Td>
                <Td>
                  <Badge colorScheme={getPriorityColor(notification.priority)}>
                    {getPriorityLabel(notification.priority)}
                  </Badge>
                </Td>
                <Td>
                  <Badge colorScheme={getStatusColor(notification.status)}>
                    {getStatusLabel(notification.status)}
                  </Badge>
                </Td>
                <Td>{new Date(notification.created_at).toLocaleDateString('vi-VN')}</Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label="Edit"
                      icon={<FiEdit />}
                      size="sm"
                      colorScheme="blue"
                      variant="ghost"
                      onClick={() => handleOpenModal(notification)}
                    />
                    <IconButton
                      aria-label="Delete"
                      icon={<FiTrash2 />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => setDeleteId(notification.id)}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedNotification ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Tiêu đề</FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tiêu đề thông báo"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Nội dung</FormLabel>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Nhập nội dung thông báo"
                  rows={4}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Loại thông báo</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {notificationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Độ ưu tiên</FormLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                >
                  {priorityLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Đối tượng nhận</FormLabel>
                <Select
                  value={formData.target_user_id ? 'individual' : formData.target_audience}
                  onChange={(e) => {
                    if (e.target.value === 'individual') {
                      setFormData({ ...formData, target_audience: 'individual', target_user_id: '' })
                    } else {
                      setFormData({ ...formData, target_audience: e.target.value, target_user_id: '' })
                    }
                  }}
                >
                  <option value="all">Tất cả cư dân</option>
                  <option value="individual">Cá nhân cụ thể</option>
                </Select>
              </FormControl>

              {formData.target_audience === 'individual' && (
                <FormControl>
                  <FormLabel>Chọn cư dân</FormLabel>
                  <Select
                    value={formData.target_user_id}
                    onChange={(e) => setFormData({ ...formData, target_user_id: e.target.value })}
                    placeholder="Chọn người nhận"
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} - Căn hộ {user.apartment_number} - Tòa {user.building}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}

              <FormControl>
                <FormLabel>Ngày sự kiện (nếu có)</FormLabel>
                <Input
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Địa điểm sự kiện</FormLabel>
                <Input
                  value={formData.event_location}
                  onChange={(e) => setFormData({ ...formData, event_location: e.target.value })}
                  placeholder="Nhập địa điểm"
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Yêu cầu phản hồi</FormLabel>
                <Switch
                  isChecked={formData.requires_response}
                  onChange={(e) => setFormData({ ...formData, requires_response: e.target.checked })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Hủy
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit} leftIcon={<FiSend />}>
              {selectedNotification ? 'Cập nhật' : 'Gửi ngay'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog
        isOpen={deleteId !== null}
        leastDestructiveRef={cancelRef.current}
        onClose={() => setDeleteId(null)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Xác nhận xóa</AlertDialogHeader>
            <AlertDialogBody>
              Bạn có chắc chắn muốn xóa thông báo này không?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef.current} onClick={() => setDeleteId(null)}>
                Hủy
              </Button>
              <Button colorScheme="red" onClick={() => deleteId && handleDelete(deleteId)} ml={3}>
                Xóa
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}
