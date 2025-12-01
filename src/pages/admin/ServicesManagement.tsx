import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardBody,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  HStack,
  VStack,
  Text,
  Select,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  Spinner,
  Input,
} from '@chakra-ui/react'
import { servicesAPI, usersAPI } from '../../services/api'

interface ServiceBooking {
  id: number
  booking_number: string
  service_id: number
  user_id: number
  scheduled_date: string
  scheduled_time_start: string
  scheduled_time_end?: string
  location?: string
  special_instructions?: string
  unit_price: number
  quantity: number
  total_amount: number
  status: string
  confirmed_by?: number
  confirmed_at?: string
  completed_at?: string
  completion_notes?: string
  created_at: string
}

interface User {
  id: number
  username: string
  full_name: string
  email: string
  phone?: string
  apartment_number?: string
  building?: string
}

const ServicesManagement = () => {
  const [bookings, setBookings] = useState<ServiceBooking[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [userFilter, setUserFilter] = useState<string>('')
  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null)
  const [notes, setNotes] = useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  useEffect(() => {
    fetchBookings()
    fetchUsers()
  }, [statusFilter, userFilter])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      if (userFilter) params.user_id = parseInt(userFilter)
      
      const data = await servicesAPI.getAllBookingsAdmin(params)
      setBookings(data)
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Không thể tải danh sách đặt dịch vụ',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const data = await usersAPI.getAll()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleConfirm = (booking: ServiceBooking) => {
    setSelectedBooking(booking)
    setNotes('')
    onOpen()
  }

  const confirmBooking = async () => {
    if (!selectedBooking) return

    try {
      await servicesAPI.confirmBooking(selectedBooking.id, {
        status: 'confirmed',
        notes: notes,
      })
      
      toast({
        title: 'Thành công',
        description: 'Đã xác nhận đặt dịch vụ',
        status: 'success',
        duration: 3000,
      })
      
      onClose()
      fetchBookings()
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Không thể xác nhận đặt dịch vụ',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleComplete = async (bookingId: number) => {
    try {
      await servicesAPI.completeBooking(bookingId)
      
      toast({
        title: 'Thành công',
        description: 'Đã đánh dấu hoàn thành',
        status: 'success',
        duration: 3000,
      })
      
      fetchBookings()
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Không thể hoàn thành đặt dịch vụ',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'yellow',
      confirmed: 'blue',
      in_progress: 'purple',
      completed: 'green',
      cancelled: 'red',
      no_show: 'gray',
    }
    return colors[status] || 'gray'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      in_progress: 'Đang thực hiện',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      no_show: 'Không đến',
    }
    return texts[status] || status
  }

  const getUserInfo = (userId: number) => {
    const user = users.find((u) => u.id === userId)
    return user
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Quản lý Dịch vụ - Service Bookings
      </Heading>

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <HStack spacing={4}>
            <Box flex={1}>
              <Text mb={2} fontWeight="medium">
                Lọc theo trạng thái
              </Text>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder="Tất cả trạng thái"
              >
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="in_progress">Đang thực hiện</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </Select>
            </Box>

            <Box flex={1}>
              <Text mb={2} fontWeight="medium">
                Lọc theo cư dân
              </Text>
              <Select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                placeholder="Tất cả cư dân"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.apartment_number || 'N/A'})
                  </option>
                ))}
              </Select>
            </Box>

            <Box pt={8}>
              <Button onClick={fetchBookings} colorScheme="blue">
                Tải lại
              </Button>
            </Box>
          </HStack>
        </CardBody>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardBody>
          {loading ? (
            <Box textAlign="center" py={8}>
              <Spinner size="xl" />
            </Box>
          ) : bookings.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">Không có dữ liệu</Text>
            </Box>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Mã đặt</Th>
                  <Th>Cư dân</Th>
                  <Th>Căn hộ</Th>
                  <Th>Ngày hẹn</Th>
                  <Th>Giờ hẹn</Th>
                  <Th>Số tiền</Th>
                  <Th>Trạng thái</Th>
                  <Th>Hành động</Th>
                </Tr>
              </Thead>
              <Tbody>
                {bookings.map((booking) => {
                  const user = getUserInfo(booking.user_id)
                  return (
                    <Tr key={booking.id}>
                      <Td fontWeight="medium">{booking.booking_number}</Td>
                      <Td>
                        {user ? (
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium">{user.full_name}</Text>
                            <Text fontSize="sm" color="gray.500">
                              {user.email}
                            </Text>
                            {user.phone && (
                              <Text fontSize="sm" color="gray.500">
                                {user.phone}
                              </Text>
                            )}
                          </VStack>
                        ) : (
                          <Text color="gray.400">User #{booking.user_id}</Text>
                        )}
                      </Td>
                      <Td>{user?.apartment_number || 'N/A'}</Td>
                      <Td>
                        {new Date(booking.scheduled_date).toLocaleDateString('vi-VN')}
                      </Td>
                      <Td>{booking.scheduled_time_start}</Td>
                      <Td fontWeight="medium">
                        {booking.total_amount.toLocaleString('vi-VN')} VNĐ
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(booking.status)}>
                          {getStatusText(booking.status)}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          {booking.status === 'pending' && (
                            <Button
                              size="sm"
                              colorScheme="green"
                              onClick={() => handleConfirm(booking)}
                            >
                              Xác nhận
                            </Button>
                          )}
                          {(booking.status === 'confirmed' ||
                            booking.status === 'in_progress') && (
                            <Button
                              size="sm"
                              colorScheme="blue"
                              onClick={() => handleComplete(booking.id)}
                            >
                              Hoàn thành
                            </Button>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Confirm Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Xác nhận đặt dịch vụ</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedBooking && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="medium">Mã đặt:</Text>
                  <Text>{selectedBooking.booking_number}</Text>
                </Box>
                <Box>
                  <Text fontWeight="medium">Ngày hẹn:</Text>
                  <Text>
                    {new Date(selectedBooking.scheduled_date).toLocaleDateString(
                      'vi-VN'
                    )}{' '}
                    lúc {selectedBooking.scheduled_time_start}
                  </Text>
                </Box>
                {selectedBooking.special_instructions && (
                  <Box>
                    <Text fontWeight="medium">Yêu cầu đặc biệt:</Text>
                    <Text>{selectedBooking.special_instructions}</Text>
                  </Box>
                )}
                <Box>
                  <Text fontWeight="medium" mb={2}>
                    Ghi chú của lễ tân (tùy chọn):
                  </Text>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập ghi chú..."
                  />
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Hủy
            </Button>
            <Button colorScheme="green" onClick={confirmBooking}>
              Xác nhận
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default ServicesManagement
