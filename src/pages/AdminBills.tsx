import { useState, useEffect } from 'react'
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
  FiEye,
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { billsAPI, usersAPI } from '../services/api'
import { useRef } from 'react'

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

const AdminBills = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const toast = useToast()
  
  const [bills, setBills] = useState<Bill[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  
  // Modals
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure()
  
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [formData, setFormData] = useState({
    user_id: 0,
    title: '',
    description: '',
    bill_type: 'management_fee',
    amount: 0,
    due_date: '',
  })
  
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isAdmin) {
      fetchBills()
      fetchUsers()
      fetchStatistics()
    }
  }, [isAdmin])

  const fetchBills = async () => {
    try {
      setLoading(true)
      const data = await billsAPI.getAll({ limit: 1000 })
      setBills(data)
    } catch (error: any) {
      console.error('Error fetching bills:', error)
      const errorMsg = error.response?.data?.detail 
        ? (typeof error.response.data.detail === 'string' 
            ? error.response.data.detail 
            : JSON.stringify(error.response.data.detail))
        : 'Something went wrong'
      toast({
        title: 'Error fetching bills',
        description: errorMsg,
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

  const fetchStatistics = async () => {
    try {
      const data = await billsAPI.getStatistics()
      setStatistics(data)
    } catch (error: any) {
      console.error('Error fetching statistics:', error)
      // Don't show toast for statistics error, just log it
    }
  }

  const handleCreate = async () => {
    try {
      // Validate data before sending
      if (!formData.user_id || formData.user_id === 0) {
        toast({
          title: 'Validation Error',
          description: 'Please select a user',
          status: 'error',
          duration: 3000,
        })
        return
      }
      
      if (!formData.amount || formData.amount === 0) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a valid amount',
          status: 'error',
          duration: 3000,
        })
        return
      }
      
      if (!formData.due_date) {
        toast({
          title: 'Validation Error',
          description: 'Please select a due date',
          status: 'error',
          duration: 3000,
        })
        return
      }
      
      // Convert date to datetime format (add time component)
      const dueDatetime = `${formData.due_date}T23:59:59`
      
      await billsAPI.create({
        ...formData,
        due_date: dueDatetime
      })
      toast({
        title: 'Bill created successfully',
        status: 'success',
        duration: 3000,
      })
      onCreateClose()
      resetForm()
      fetchBills()
      fetchStatistics()
    } catch (error: any) {
      console.error('Create bill error:', error)
      let errorMsg = 'Something went wrong'
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMsg = error.response.data.detail
        } else if (Array.isArray(error.response.data.detail)) {
          errorMsg = error.response.data.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ')
        } else {
          errorMsg = JSON.stringify(error.response.data.detail)
        }
      }
      
      toast({
        title: 'Error creating bill',
        description: errorMsg,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleUpdate = async () => {
    if (!selectedBill) return
    
    try {
      // Convert date to datetime format if it doesn't have time component
      const dueDatetime = formData.due_date.includes('T') 
        ? formData.due_date 
        : `${formData.due_date}T23:59:59`
      
      await billsAPI.update(selectedBill.id, {
        title: formData.title,
        description: formData.description,
        amount: formData.amount,
        due_date: dueDatetime,
        status: formData.bill_type, // Using bill_type field for status in edit
      })
      toast({
        title: 'Bill updated successfully',
        status: 'success',
        duration: 3000,
      })
      onEditClose()
      resetForm()
      fetchBills()
      fetchStatistics()
    } catch (error: any) {
      console.error('Update bill error:', error)
      let errorMsg = 'Something went wrong'
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMsg = error.response.data.detail
        } else if (Array.isArray(error.response.data.detail)) {
          errorMsg = error.response.data.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ')
        } else {
          errorMsg = JSON.stringify(error.response.data.detail)
        }
      }
      
      toast({
        title: 'Error updating bill',
        description: errorMsg,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedBill) return
    
    try {
      await billsAPI.delete(selectedBill.id)
      toast({
        title: 'Bill deleted successfully',
        status: 'success',
        duration: 3000,
      })
      onDeleteClose()
      setSelectedBill(null)
      fetchBills()
      fetchStatistics()
    } catch (error: any) {
      console.error('Delete bill error:', error)
      let errorMsg = 'Something went wrong'
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMsg = error.response.data.detail
        } else {
          errorMsg = JSON.stringify(error.response.data.detail)
        }
      }
      
      toast({
        title: 'Error deleting bill',
        description: errorMsg,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleSendReminder = async (billIds?: number[]) => {
    try {
      const result = await billsAPI.sendReminder(billIds)
      toast({
        title: 'Reminders sent successfully',
        description: `${result.notifications_sent} notifications sent`,
        status: 'success',
        duration: 3000,
      })
    } catch (error: any) {
      console.error('Send reminder error:', error)
      let errorMsg = 'Something went wrong'
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMsg = error.response.data.detail
        } else {
          errorMsg = JSON.stringify(error.response.data.detail)
        }
      }
      
      toast({
        title: 'Error sending reminders',
        description: errorMsg,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleExportReport = async () => {
    try {
      const blob = await billsAPI.exportReport()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bill_report_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: 'Report exported successfully',
        status: 'success',
        duration: 3000,
      })
    } catch (error: any) {
      console.error('Export report error:', error)
      let errorMsg = 'Something went wrong'
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMsg = error.response.data.detail
        } else {
          errorMsg = JSON.stringify(error.response.data.detail)
        }
      }
      
      toast({
        title: 'Error exporting report',
        description: errorMsg,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleMarkOverdue = async () => {
    try {
      const result = await billsAPI.markOverdue()
      toast({
        title: 'Overdue bills marked',
        description: `${result.updated_count} bills marked as overdue`,
        status: 'success',
        duration: 3000,
      })
      fetchBills()
      fetchStatistics()
    } catch (error: any) {
      console.error('Mark overdue error:', error)
      let errorMsg = 'Something went wrong'
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMsg = error.response.data.detail
        } else {
          errorMsg = JSON.stringify(error.response.data.detail)
        }
      }
      
      toast({
        title: 'Error marking overdue bills',
        description: errorMsg,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const openEditModal = (bill: Bill) => {
    setSelectedBill(bill)
    setFormData({
      user_id: bill.user_id,
      title: bill.title,
      description: bill.description || '',
      bill_type: bill.status, // Using for status in edit
      amount: bill.amount,
      due_date: bill.due_date.split('T')[0],
    })
    onEditOpen()
  }

  const openDeleteModal = (bill: Bill) => {
    setSelectedBill(bill)
    onDeleteOpen()
  }

  const openViewModal = (bill: Bill) => {
    setSelectedBill(bill)
    onViewOpen()
  }

  const resetForm = () => {
    setFormData({
      user_id: 0,
      title: '',
      description: '',
      bill_type: 'management_fee',
      amount: 0,
      due_date: '',
    })
    setSelectedBill(null)
  }

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId)
    return user?.full_name || 'Unknown'
  }

  const getUserApartment = (userId: number) => {
    const user = users.find(u => u.id === userId)
    return user?.apartment_number || 'N/A'
  }

  const filteredBills = bills.filter(bill => {
    const matchesSearch = 
      bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserName(bill.user_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserApartment(bill.user_id).toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || bill.status === statusFilter
    const matchesType = !typeFilter || bill.bill_type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  // Admin overview stats from API
  const billStats = [
    {
      label: 'Total Bills',
      value: statistics?.total_bills || 0,
      icon: FiDollarSign,
      color: 'blue',
      change: `Total: ${statistics?.amounts?.total_amount?.toLocaleString() || 0} VND`,
    },
    {
      label: 'Pending Payment',
      value: statistics?.bills_by_status?.pending || 0,
      icon: FiClock,
      color: 'orange',
      change: `Amount: ${statistics?.amounts?.pending_amount?.toLocaleString() || 0} VND`,
    },
    {
      label: 'Paid Bills',
      value: statistics?.bills_by_status?.paid || 0,
      icon: FiCheckCircle,
      color: 'green',
      change: `Amount: ${statistics?.amounts?.paid_amount?.toLocaleString() || 0} VND`,
    },
    {
      label: 'Overdue',
      value: statistics?.bills_by_status?.overdue || 0,
      icon: FiAlertTriangle,
      color: 'red',
      change: 'Requires attention',
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'green'
      case 'pending':
        return 'orange'
      case 'overdue':
        return 'red'
      case 'cancelled':
        return 'gray'
      default:
        return 'gray'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid'
      case 'pending':
        return 'Pending'
      case 'overdue':
        return 'Overdue'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Unknown'
    }
  }

  const getBillTypeText = (type: string) => {
    const types: { [key: string]: string } = {
      management_fee: 'Management Fee',
      utility: 'Utility',
      parking: 'Parking',
      service: 'Service',
      other: 'Other',
    }
    return types[type] || type
  }

  if (!isAdmin) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Access denied. Admin privileges required.</Text>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading bills...</Text>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="gray.700">
          Bills Management
        </Heading>
        <HStack>
          <Button
            leftIcon={<FiRefreshCw />}
            colorScheme="gray"
            size="sm"
            onClick={handleMarkOverdue}
          >
            Mark Overdue
          </Button>
          <Button
            leftIcon={<FiBell />}
            colorScheme="orange"
            size="sm"
            onClick={() => handleSendReminder()}
          >
            Send Reminders
          </Button>
          <Button
            leftIcon={<FiDownload />}
            colorScheme="blue"
            size="sm"
            onClick={handleExportReport}
          >
            Export Report
          </Button>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="purple"
            size="sm"
            onClick={onCreateOpen}
          >
            Create Bill
          </Button>
        </HStack>
      </Flex>

      {/* Stats Overview */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        {billStats.map((stat, index) => (
          <Card key={index} variant="elevated">
            <CardBody>
              <HStack spacing={4}>
                <Box
                  p={3}
                  borderRadius="lg"
                  bg={`${stat.color}.100`}
                  color={`${stat.color}.600`}
                >
                  <Icon as={stat.icon} boxSize={6} />
                </Box>
                <VStack align="start" spacing={1} flex={1}>
                  <Text fontSize="sm" color="gray.600">
                    {stat.label}
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                    {stat.value}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {stat.change}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Collection Rate */}
      {statistics && (
        <Card variant="elevated" mb={6} bg="purple.50" borderColor="purple.200">
          <CardBody>
            <Stat>
              <StatLabel fontSize="md" fontWeight="bold" color="purple.700">
                Collection Rate
              </StatLabel>
              <StatNumber fontSize="3xl" color="purple.600">
                {statistics.amounts?.collection_rate?.toFixed(2)}%
              </StatNumber>
              <StatHelpText fontSize="sm">
                {statistics.amounts?.paid_amount?.toLocaleString()} VND collected out of{' '}
                {statistics.amounts?.total_amount?.toLocaleString()} VND total
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      )}

      {/* Filters and Search */}
      <Card variant="elevated" mb={6}>
        <CardBody>
          <HStack spacing={4}>
            <InputGroup flex={1}>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search by bill number, title, resident, or apartment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            <Select
              w="200px"
              placeholder="All Statuses"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <Select
              w="200px"
              placeholder="All Types"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="management_fee">Management Fee</option>
              <option value="utility">Utility</option>
              <option value="parking">Parking</option>
              <option value="service">Service</option>
              <option value="other">Other</option>
            </Select>
          </HStack>
        </CardBody>
      </Card>

      {/* Bills Table */}
      <Card variant="elevated">
        <CardBody>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" color="gray.700">
              All Bills ({filteredBills.length})
            </Heading>
            {filteredBills.some(b => b.status === 'pending' || b.status === 'overdue') && (
              <Button
                size="sm"
                leftIcon={<FiBell />}
                colorScheme="orange"
                variant="outline"
                onClick={() => {
                  const billIds = filteredBills
                    .filter(b => b.status === 'pending' || b.status === 'overdue')
                    .map(b => b.id)
                  handleSendReminder(billIds)
                }}
              >
                Send Reminders to Filtered
              </Button>
            )}
          </Flex>
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Bill Number</Th>
                  <Th>Apartment</Th>
                  <Th>Resident</Th>
                  <Th>Title</Th>
                  <Th>Type</Th>
                  <Th isNumeric>Amount</Th>
                  <Th>Due Date</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredBills.length === 0 ? (
                  <Tr>
                    <Td colSpan={9} textAlign="center" py={8}>
                      <Text color="gray.500">No bills found</Text>
                    </Td>
                  </Tr>
                ) : (
                  filteredBills.map((bill) => (
                    <Tr key={bill.id}>
                      <Td fontWeight="semibold" fontSize="xs">{bill.bill_number}</Td>
                      <Td>{getUserApartment(bill.user_id)}</Td>
                      <Td>{getUserName(bill.user_id)}</Td>
                      <Td maxW="200px" isTruncated>{bill.title}</Td>
                      <Td>
                        <Badge size="sm" colorScheme="blue">
                          {getBillTypeText(bill.bill_type)}
                        </Badge>
                      </Td>
                      <Td isNumeric fontWeight="semibold">
                        {bill.amount.toLocaleString()} đ
                      </Td>
                      <Td fontSize="xs">{new Date(bill.due_date).toLocaleDateString()}</Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(bill.status)}>
                          {getStatusText(bill.status)}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <Button
                            size="xs"
                            leftIcon={<FiEye />}
                            variant="ghost"
                            onClick={() => openViewModal(bill)}
                          >
                            View
                          </Button>
                          <Button
                            size="xs"
                            leftIcon={<FiEdit />}
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => openEditModal(bill)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="xs"
                            leftIcon={<FiTrash2 />}
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => openDeleteModal(bill)}
                          >
                            Delete
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>

      {/* Admin Note */}
      <Box mt={6} p={4} bg="purple.50" borderRadius="md" borderLeft="4px solid" borderColor="purple.500">
        <HStack>
          <Icon as={FiAlertTriangle} color="purple.600" />
          <Text fontSize="sm" color="purple.700">
            <strong>Admin Controls:</strong> Create bills, send payment reminders, verify payments, and export revenue reports.
          </Text>
        </HStack>
      </Box>

      {/* Create Bill Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Bill</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Resident</FormLabel>
                <Select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: parseInt(e.target.value) })}
                >
                  <option value={0}>Select resident</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} - {user.apartment_number || 'No apartment'}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Bill Type</FormLabel>
                <Select
                  value={formData.bill_type}
                  onChange={(e) => setFormData({ ...formData, bill_type: e.target.value })}
                >
                  <option value="management_fee">Management Fee</option>
                  <option value="utility">Utility</option>
                  <option value="parking">Parking</option>
                  <option value="service">Service</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Monthly Management Fee - November 2024"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about the bill..."
                  rows={3}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Amount (VND)</FormLabel>
                <Input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter amount"
                  min="0"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Due Date</FormLabel>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="purple" mr={3} onClick={handleCreate}>
              Create Bill
            </Button>
            <Button onClick={onCreateClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Bill Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Bill</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Amount (VND)</FormLabel>
                <Input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter amount"
                  min="0"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Due Date</FormLabel>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Status</FormLabel>
                <Select
                  value={formData.bill_type}
                  onChange={(e) => setFormData({ ...formData, bill_type: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleUpdate}>
              Update Bill
            </Button>
            <Button onClick={onEditClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Bill Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Bill Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedBill && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontSize="sm" color="gray.600">Bill Number</Text>
                  <Text fontSize="lg" fontWeight="bold">{selectedBill.bill_number}</Text>
                </Box>
                <Divider />
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Resident</Text>
                    <Text fontWeight="semibold">{getUserName(selectedBill.user_id)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Apartment</Text>
                    <Text fontWeight="semibold">{getUserApartment(selectedBill.user_id)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Type</Text>
                    <Badge colorScheme="blue">{getBillTypeText(selectedBill.bill_type)}</Badge>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Status</Text>
                    <Badge colorScheme={getStatusColor(selectedBill.status)}>
                      {getStatusText(selectedBill.status)}
                    </Badge>
                  </Box>
                </SimpleGrid>
                <Divider />
                <Box>
                  <Text fontSize="sm" color="gray.600">Title</Text>
                  <Text fontWeight="semibold">{selectedBill.title}</Text>
                </Box>
                {selectedBill.description && (
                  <Box>
                    <Text fontSize="sm" color="gray.600">Description</Text>
                    <Text>{selectedBill.description}</Text>
                  </Box>
                )}
                <Divider />
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Amount</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                      {selectedBill.amount.toLocaleString()} đ
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Due Date</Text>
                    <Text fontWeight="semibold">
                      {new Date(selectedBill.due_date).toLocaleDateString('vi-VN')}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Created Date</Text>
                    <Text>{new Date(selectedBill.created_at).toLocaleDateString('vi-VN')}</Text>
                  </Box>
                  {selectedBill.paid_at && (
                    <Box>
                      <Text fontSize="sm" color="gray.600">Paid Date</Text>
                      <Text>{new Date(selectedBill.paid_at).toLocaleDateString('vi-VN')}</Text>
                    </Box>
                  )}
                </SimpleGrid>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onViewClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Bill
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete bill{' '}
              <strong>{selectedBill?.bill_number}</strong>? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}

export default AdminBills