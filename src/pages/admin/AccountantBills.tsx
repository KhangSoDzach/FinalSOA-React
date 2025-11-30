import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Card,
  CardBody,
  Text,
  Heading,
  SimpleGrid,
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
  Icon,
  Flex,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Textarea,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react'
import {
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiSearch,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiBell,
  FiDownload,
  FiRefreshCw,
  FiMoreVertical,
  FiCalendar,
} from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { billsAPI, usersAPI } from '../../services/api'

interface Bill {
  id: number
  bill_number: string
  user_id: number
  bill_type: string
  title: string
  description?: string
  amount: number
  due_date: string
  status: string
  created_at: string
  paid_at?: string
}

interface User {
  id: number
  username: string
  full_name: string
  email: string
  apartment_number?: string
  building?: string
  phone?: string
}

interface BillStatistics {
  total_bills: number
  bills_by_status: {
    pending: number
    paid: number
    overdue: number
    cancelled: number
  }
  amounts: {
    total_amount: number
    paid_amount: number
    pending_amount: number
    overdue_amount: number
  }
}

const AccountantBills = () => {
  const { isAccountant } = useAuth()
  const toast = useToast()
  
  const [bills, setBills] = useState<Bill[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<BillStatistics | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [buildingFilter, setBuildingFilter] = useState('')
  
  // Modal states
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const { isOpen: isReminderOpen, onOpen: onReminderOpen, onClose: onReminderClose } = useDisclosure()
  
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [formData, setFormData] = useState({
    user_id: '',
    bill_type: 'management_fee',
    title: '',
    description: '',
    amount: '',
    due_date: '',
  })
  const [reminderBills, setReminderBills] = useState<number[]>([])
  
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Check permission
  if (!isAccountant()) {
    return (
      <Box p={8} textAlign="center">
        <Heading size="lg" color="red.500">Không có quyền truy cập</Heading>
        <Text mt={4}>Bạn cần có quyền Kế toán để truy cập trang này.</Text>
      </Box>
    )
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [billsData, usersData, statsData] = await Promise.all([
        billsAPI.getAllBills(),
        usersAPI.getAll(),
        billsAPI.getStatistics(),
      ])
      setBills(billsData)
      setUsers(usersData)
      setStatistics(statsData)
    } catch (error: any) {
      toast({
        title: 'Lỗi tải dữ liệu',
        description: error.response?.data?.detail || 'Không thể tải dữ liệu',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBill = async () => {
    // Validate
    if (!formData.user_id || !formData.amount || !formData.title || !formData.due_date) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        status: 'error',
        duration: 3000,
      })
      return
    }

    try {
      // Convert date to ISO datetime format for backend
      const dueDateISO = formData.due_date ? new Date(formData.due_date).toISOString() : undefined
      
      await billsAPI.create({
        user_id: parseInt(formData.user_id),
        bill_type: formData.bill_type,
        title: formData.title,
        description: formData.description || undefined,
        amount: parseFloat(formData.amount),
        due_date: dueDateISO,
      })
      toast({
        title: 'Thành công',
        description: 'Tạo hóa đơn mới thành công',
        status: 'success',
        duration: 3000,
      })
      onCreateClose()
      fetchData()
      resetForm()
    } catch (error: any) {
      let errorMessage = 'Không thể tạo hóa đơn'
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (typeof detail === 'string') {
          errorMessage = detail
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((err: any) => err.msg || err.message).join(', ')
        }
      }
      
      toast({
        title: 'Lỗi',
        description: errorMessage,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleUpdateBill = async () => {
    if (!selectedBill) return
    
    // Validate
    if (!formData.amount || !formData.title || !formData.due_date) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        status: 'error',
        duration: 3000,
      })
      return
    }

    try {
      // Convert date to ISO datetime format for backend
      const dueDateISO = formData.due_date ? new Date(formData.due_date).toISOString() : undefined
      
      await billsAPI.update(selectedBill.id, {
        title: formData.title,
        description: formData.description || undefined,
        amount: parseFloat(formData.amount),
        due_date: dueDateISO,
      })
      toast({
        title: 'Thành công',
        description: 'Cập nhật hóa đơn thành công',
        status: 'success',
        duration: 3000,
      })
      onEditClose()
      fetchData()
      resetForm()
    } catch (error: any) {
      let errorMessage = 'Không thể cập nhật hóa đơn'
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (typeof detail === 'string') {
          errorMessage = detail
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((err: any) => err.msg || err.message).join(', ')
        }
      }
      
      toast({
        title: 'Lỗi',
        description: errorMessage,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleDeleteBill = async () => {
    if (!selectedBill) return
    try {
      await billsAPI.delete(selectedBill.id)
      toast({
        title: 'Thành công',
        description: 'Xóa hóa đơn thành công',
        status: 'success',
        duration: 3000,
      })
      onDeleteClose()
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Không thể xóa hóa đơn',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleSendReminders = async () => {
    try {
      await billsAPI.sendReminder(reminderBills.length > 0 ? reminderBills : undefined)
      toast({
        title: 'Thành công',
        description: `Đã gửi nhắc nhở thanh toán`,
        status: 'success',
        duration: 3000,
      })
      onReminderClose()
      setReminderBills([])
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Không thể gửi nhắc nhở',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleGenerateMonthlyFees = async () => {
    try {
      const today = new Date()
      const currentMonth = today.getMonth() + 1
      const currentYear = today.getFullYear()
      
      const result = await billsAPI.generateMonthlyFees(currentMonth, currentYear)
      toast({
        title: 'Thành công',
        description: `Đã tạo ${result.length} hóa đơn phí quản lý tháng ${currentMonth}/${currentYear}`,
        status: 'success',
        duration: 5000,
      })
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Không thể tạo hóa đơn hàng tháng',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleMarkOverdue = async () => {
    try {
      const result = await billsAPI.markOverdue()
      toast({
        title: 'Thành công',
        description: result.message || 'Đã cập nhật trạng thái hóa đơn quá hạn',
        status: 'success',
        duration: 3000,
      })
      fetchData()
    } catch (error: any) {
      console.error('Mark overdue error:', error)
      console.error('Response data:', error.response?.data)
      console.error('Response status:', error.response?.status)
      
      let errorMessage = 'Không thể cập nhật trạng thái'
      
      if (error.response?.data) {
        const detail = error.response.data.detail
        if (typeof detail === 'string') {
          errorMessage = detail
        } else if (Array.isArray(detail)) {
          // FastAPI validation error format
          errorMessage = detail.map((err: any) => err.msg).join(', ')
        } else if (typeof detail === 'object') {
          errorMessage = JSON.stringify(detail)
        }
      }
      
      toast({
        title: 'Lỗi',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const openEditModal = (bill: Bill) => {
    setSelectedBill(bill)
    setFormData({
      user_id: bill.user_id.toString(),
      bill_type: bill.bill_type,
      title: bill.title,
      description: bill.description || '',
      amount: bill.amount.toString(),
      due_date: bill.due_date.split('T')[0],
    })
    onEditOpen()
  }

  const openDeleteModal = (bill: Bill) => {
    setSelectedBill(bill)
    onDeleteOpen()
  }

  const resetForm = () => {
    setFormData({
      user_id: '',
      bill_type: 'management_fee',
      title: '',
      description: '',
      amount: '',
      due_date: '',
    })
    setSelectedBill(null)
  }

  const getUserInfo = (userId: number) => {
    return users.find(u => u.id === userId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'green'
      case 'PENDING': return 'blue'
      case 'OVERDUE': return 'red'
      case 'CANCELLED': return 'gray'
      default: return 'gray'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID': return 'Đã thanh toán'
      case 'PENDING': return 'Chờ thanh toán'
      case 'OVERDUE': return 'Quá hạn'
      case 'CANCELLED': return 'Đã hủy'
      default: return status
    }
  }

  const getBillTypeText = (type: string) => {
    switch (type) {
      case 'MANAGEMENT_FEE': return 'Phí quản lý'
      case 'UTILITY': return 'Tiện ích'
      case 'PARKING': return 'Phí gửi xe'
      case 'SERVICE': return 'Dịch vụ'
      case 'OTHER': return 'Khác'
      default: return type
    }
  }

  const filteredBills = bills.filter(bill => {
    const userInfo = getUserInfo(bill.user_id)
    const matchSearch = 
      bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userInfo?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userInfo?.apartment_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchStatus = statusFilter === '' || bill.status === statusFilter
    const matchBuilding = buildingFilter === '' || userInfo?.building === buildingFilter

    return matchSearch && matchStatus && matchBuilding
  })

  // Get bills near due date (within 7 days) for reminders
  const billsNearDueDate = bills.filter(bill => {
    // Check both uppercase and lowercase status
    const status = bill.status.toUpperCase()
    if (status !== 'PENDING') {
      console.log('❌ Bill:', bill.bill_number, 'Status:', bill.status, '(not PENDING)')
      return false
    }
    const dueDate = new Date(bill.due_date)
    const today = new Date()
    // Reset time to midnight for accurate day comparison
    dueDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    const isInRange = diffDays >= 0 && diffDays <= 7
    console.log(isInRange ? '✅' : '❌', 'Bill:', bill.bill_number, 'Status:', bill.status, 'Due:', bill.due_date, 'DiffDays:', diffDays)
    
    return isInRange
  })
  
  console.log('📊 Total bills:', bills.length, 'Bills near due date:', billsNearDueDate.length)

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" color="purple.500" />
      </Box>
    )
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">Quản lý Hóa đơn</Heading>
          <Text color="gray.600" mt={1}>Kế toán - Quản lý hóa đơn và thu chi</Text>
        </Box>
        <HStack spacing={3}>
          <Button
            leftIcon={<Icon as={FiBell} />}
            colorScheme="orange"
            onClick={onReminderOpen}
            isDisabled={billsNearDueDate.length === 0}
          >
            Gửi nhắc nhở ({billsNearDueDate.length})
          </Button>
          <Button
            leftIcon={<Icon as={FiCalendar} />}
            colorScheme="purple"
            onClick={handleGenerateMonthlyFees}
          >
            Tạo phí tháng
          </Button>
          <Button
            leftIcon={<Icon as={FiPlus} />}
            colorScheme="blue"
            onClick={onCreateOpen}
          >
            Tạo hóa đơn
          </Button>
        </HStack>
      </Flex>

      {/* Statistics */}
      {statistics && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel display="flex" alignItems="center">
                  <Icon as={FiDollarSign} mr={2} color="green.500" />
                  Tổng doanh thu
                </StatLabel>
                <StatNumber fontSize="2xl">
                  {statistics.amounts.total_amount.toLocaleString('vi-VN')} ₫
                </StatNumber>
                <StatHelpText>
                  Đã thu: {statistics.amounts.paid_amount.toLocaleString('vi-VN')} ₫
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel display="flex" alignItems="center">
                  <Icon as={FiClock} mr={2} color="blue.500" />
                  Chờ thanh toán
                </StatLabel>
                <StatNumber fontSize="2xl">{statistics.bills_by_status.pending}</StatNumber>
                <StatHelpText>
                  {statistics.amounts.pending_amount.toLocaleString('vi-VN')} ₫
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel display="flex" alignItems="center">
                  <Icon as={FiAlertTriangle} mr={2} color="red.500" />
                  Quá hạn
                </StatLabel>
                <StatNumber fontSize="2xl" color="red.500">
                  {statistics.bills_by_status.overdue}
                </StatNumber>
                <StatHelpText>
                  {statistics.amounts.overdue_amount.toLocaleString('vi-VN')} ₫
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel display="flex" alignItems="center">
                  <Icon as={FiCheckCircle} mr={2} color="teal.500" />
                  Đã thanh toán
                </StatLabel>
                <StatNumber fontSize="2xl" color="green.500">
                  {statistics.bills_by_status.paid}
                </StatNumber>
                <StatHelpText>Hoàn thành</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <InputGroup>
              <InputLeftElement>
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Tìm kiếm hóa đơn, cư dân..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            <Select
              placeholder="Tất cả trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="PENDING">Chờ thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="OVERDUE">Quá hạn</option>
              <option value="CANCELLED">Đã hủy</option>
            </Select>

            <Select
              placeholder="Tất cả tòa nhà"
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
            >
              <option value="A">Tòa A</option>
              <option value="B">Tòa B</option>
            </Select>

            {/* <Button
              leftIcon={<Icon as={FiRefreshCw} />}
              onClick={handleMarkOverdue}
              colorScheme="red"
              variant="outline"
            >
              Cập nhật quá hạn
            </Button> */}
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Bills Table */}
      <Card>
        <CardBody>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Mã HĐ</Th>
                  <Th>Cư dân</Th>
                  <Th>Căn hộ</Th>
                  <Th>Loại</Th>
                  <Th>Tiêu đề</Th>
                  <Th isNumeric>Số tiền</Th>
                  <Th>Hạn thanh toán</Th>
                  <Th>Trạng thái</Th>
                  <Th>Thao tác</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredBills.map((bill) => {
                  const userInfo = getUserInfo(bill.user_id)
                  return (
                    <Tr key={bill.id}>
                      <Td fontWeight="medium">{bill.bill_number}</Td>
                      <Td>{userInfo?.full_name || 'N/A'}</Td>
                      <Td>
                        {userInfo?.building && userInfo?.apartment_number
                          ? `${userInfo.building}${userInfo.apartment_number}`
                          : 'N/A'}
                      </Td>
                      <Td>
                        <Badge colorScheme="purple">
                          {getBillTypeText(bill.bill_type)}
                        </Badge>
                      </Td>
                      <Td maxW="200px" isTruncated>
                        {bill.title}
                      </Td>
                      <Td isNumeric fontWeight="bold">
                        {bill.amount.toLocaleString('vi-VN')} ₫
                      </Td>
                      <Td>{new Date(bill.due_date).toLocaleDateString('vi-VN')}</Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(bill.status)}>
                          {getStatusText(bill.status)}
                        </Badge>
                      </Td>
                      <Td>
                        <Menu>
                          <MenuButton
                            as={Button}
                            size="sm"
                            variant="ghost"
                            rightIcon={<Icon as={FiMoreVertical} />}
                          />
                          <MenuList>
                            <MenuItem
                              icon={<Icon as={FiEdit} />}
                              onClick={() => openEditModal(bill)}
                            >
                              Sửa
                            </MenuItem>
                            <MenuItem
                              icon={<Icon as={FiTrash2} />}
                              onClick={() => openDeleteModal(bill)}
                              color="red.500"
                            >
                              Xóa
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </Box>

          {filteredBills.length === 0 && (
            <Box textAlign="center" py={10}>
              <Text color="gray.500">Không tìm thấy hóa đơn nào</Text>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Create Bill Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Tạo hóa đơn mới</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Cư dân</FormLabel>
                <Select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  placeholder="Chọn cư dân"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} - {u.building}{u.apartment_number}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Loại hóa đơn</FormLabel>
                <Select
                  value={formData.bill_type}
                  onChange={(e) => setFormData({ ...formData, bill_type: e.target.value })}
                >
                  <option value="management_fee">Phí quản lý</option>
                  <option value="utility">Tiện ích</option>
                  <option value="parking">Phí gửi xe</option>
                  <option value="service">Dịch vụ</option>
                  <option value="other">Khác</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Tiêu đề</FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Phí quản lý tháng 11/2025"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Mô tả</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết hóa đơn"
                  rows={3}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Số tiền (₫)</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                  />
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Hạn thanh toán</FormLabel>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Hủy
            </Button>
            <Button colorScheme="blue" onClick={handleCreateBill}>
              Tạo hóa đơn
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Bill Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Chỉnh sửa hóa đơn</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Tiêu đề</FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Mô tả</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Số tiền (₫)</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Hạn thanh toán</FormLabel>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Hủy
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateBill}>
              Cập nhật
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Bill Alert */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Xóa hóa đơn
            </AlertDialogHeader>
            <AlertDialogBody>
              Bạn có chắc chắn muốn xóa hóa đơn <strong>{selectedBill?.bill_number}</strong>?
              Hành động này không thể hoàn tác.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Hủy
              </Button>
              <Button colorScheme="red" onClick={handleDeleteBill} ml={3}>
                Xóa
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Send Reminders Modal */}
      <Modal isOpen={isReminderOpen} onClose={onReminderClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Gửi nhắc nhở thanh toán</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Có <strong>{billsNearDueDate.length}</strong> hóa đơn sắp đến hạn thanh toán (trong vòng 7 ngày).
            </Text>
            <Text fontSize="sm" color="gray.600">
              Hệ thống sẽ gửi thông báo nhắc nhở tới tất cả cư dân có hóa đơn chưa thanh toán sắp đến hạn.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onReminderClose}>
              Hủy
            </Button>
            <Button colorScheme="orange" leftIcon={<Icon as={FiBell} />} onClick={handleSendReminders}>
              Gửi nhắc nhở
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default AccountantBills
