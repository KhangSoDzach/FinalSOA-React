import {
  Box,
  Grid,
  Card,
  CardBody,
  Text,
  Heading,
  SimpleGrid,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  Center,
  useToast,
  Progress,
  Flex,
  Badge,
  Divider,
} from '@chakra-ui/react'
import {
  FiDollarSign,
  FiFileText,
  FiAlertCircle,
  FiActivity,
  FiCheckCircle,
  FiTrendingUp,
  FiCreditCard,
  FiPieChart,
  FiHome,
  FiUsers,
  FiUserCheck,
} from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { billsAPI, usersAPI, apartmentsAPI } from '../../services/api'
import { useState, useEffect } from 'react'

interface BillStatistics {
  total_bills: number
  bills_by_status: {
    pending: number
    paid: number
    overdue: number
    cancelled: number
  }
  bills_by_type: {
    [key: string]: number
  }
  amounts: {
    total_amount: number
    paid_amount: number
    pending_amount: number
    overdue_amount: number
  }
}

interface ApartmentStatistics {
  total: number
  occupied: number
  available: number
  maintenance: number
  occupancy_rate: number
}

interface User {
  id: number
  role: string
  [key: string]: any
}

/**
 * Manager Dashboard - Quản lý
 * Full access to all apartment management system features
 */
const ManagerDashboard = () => {
  const { user } = useAuth()
  const [billStats, setBillStats] = useState<BillStatistics | null>(null)
  const [apartmentStats, setApartmentStats] = useState<ApartmentStatistics | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    fetchAllStatistics()
  }, [])

  const fetchAllStatistics = async () => {
    try {
      setLoading(true)
      const [bills, apartments, allUsers] = await Promise.all([
        billsAPI.getStatistics(),
        apartmentsAPI.getStatistics(),
        usersAPI.getAll(),
      ])
      setBillStats(bills)
      setApartmentStats(apartments)
      setUsers(allUsers)
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Không thể tải thống kê',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const getCollectionRate = () => {
    if (!billStats) return 0
    const total = billStats.amounts.total_amount
    if (total === 0) return 0
    return (billStats.amounts.paid_amount / total) * 100
  }

  if (loading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="purple.500" />
      </Center>
    )
  }

  if (!billStats || !apartmentStats) {
    return (
      <Center h="400px">
        <Text color="gray.500">Không có dữ liệu thống kê</Text>
      </Center>
    )
  }

  // Tính toán số lượng nhân viên và cư dân
  const staffCount = users.filter((u) => 
    ['manager', 'accountant', 'receptionist'].includes(u.role.toLowerCase())
  ).length
  const residentCount = users.filter((u) => u.role.toLowerCase() === 'user').length

  const collectionRate = getCollectionRate()

  // Thống kê tổng quan hệ thống (ưu tiên cao nhất)
  const systemStats = [
    {
      label: 'Tổng căn hộ',
      value: apartmentStats.total.toString(),
      icon: FiHome,
      color: 'blue.500',
      helpText: `${apartmentStats.occupied} đang ở, ${apartmentStats.available} trống`,
    },
    {
      label: 'Tổng nhân viên',
      value: staffCount.toString(),
      icon: FiUserCheck,
      color: 'purple.500',
      helpText: 'Quản lý, Kế toán, Lễ tân',
    },
    {
      label: 'Tổng cư dân',
      value: residentCount.toString(),
      icon: FiUsers,
      color: 'teal.500',
      helpText: `Tỷ lệ lấp đầy: ${apartmentStats.occupancy_rate}%`,
    },
  ]

  // Thống kê doanh thu (hiển thị bên dưới)
  const revenueStats = [
    {
      label: 'Tổng hóa đơn',
      value: billStats.total_bills.toString(),
      icon: FiFileText,
      color: 'blue.500',
      helpText: 'Tất cả hóa đơn',
    },
    {
      label: 'Tổng doanh thu',
      value: formatCurrency(billStats.amounts.total_amount),
      icon: FiDollarSign,
      color: 'teal.500',
      helpText: 'Tổng giá trị hóa đơn',
    },
    {
      label: 'Đã thu',
      value: formatCurrency(billStats.amounts.paid_amount),
      icon: FiCheckCircle,
      color: 'green.500',
      helpText: `${billStats.bills_by_status.paid} hóa đơn`,
    },
    {
      label: 'Chờ thanh toán',
      value: formatCurrency(billStats.amounts.pending_amount),
      icon: FiActivity,
      color: 'orange.500',
      helpText: `${billStats.bills_by_status.pending} hóa đơn`,
    },
    {
      label: 'Quá hạn',
      value: formatCurrency(billStats.amounts.overdue_amount),
      icon: FiAlertCircle,
      color: 'red.500',
      helpText: `${billStats.bills_by_status.overdue} hóa đơn`,
    },
    {
      label: 'Tỷ lệ thu',
      value: `${collectionRate.toFixed(1)}%`,
      icon: FiTrendingUp,
      color: 'purple.500',
      helpText: 'Đã thu / Tổng',
    },
  ]

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Bảng điều khiển Quản lý
      </Heading>
      <Text color="gray.600" mb={6}>
        Chào mừng, {user?.full_name}. Bạn có quyền truy cập toàn bộ hệ thống.
      </Text>

      {/* Thống kê tổng quan hệ thống */}
      <Heading size="md" mb={4}>Tổng quan hệ thống</Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        {systemStats.map((stat, index) => (
          <Card key={index} bg="white" shadow="md" borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel display="flex" alignItems="center">
                  <Icon as={stat.icon} mr={2} color={stat.color} boxSize={5} />
                  {stat.label}
                </StatLabel>
                <StatNumber fontSize="3xl" fontWeight="bold">{stat.value}</StatNumber>
                <StatHelpText fontSize="sm">{stat.helpText}</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Thống kê doanh thu */}
      <Heading size="md" mb={4}>Thống kê doanh thu</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {revenueStats.map((stat, index) => (
          <Card key={index}>
            <CardBody>
              <Stat>
                <StatLabel display="flex" alignItems="center">
                  <Icon as={stat.icon} mr={2} color={stat.color} />
                  {stat.label}
                </StatLabel>
                <StatNumber fontSize="2xl">{stat.value}</StatNumber>
                <StatHelpText>{stat.helpText}</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Collection Progress */}
      <Card mt={6}>
        <CardBody>
          <Flex justify="space-between" align="center" mb={4}>
            <Box>
              <Heading size="md" mb={1}>Tiến độ thu tiền</Heading>
              <Text color="gray.600" fontSize="sm">
                {formatCurrency(billStats.amounts.paid_amount)} / {formatCurrency(billStats.amounts.total_amount)}
              </Text>
            </Box>
            <Badge colorScheme={collectionRate >= 80 ? 'green' : collectionRate >= 50 ? 'orange' : 'red'} fontSize="lg" px={3} py={1}>
              {collectionRate.toFixed(1)}%
            </Badge>
          </Flex>
          <Progress 
            value={collectionRate} 
            size="lg" 
            colorScheme={collectionRate >= 80 ? 'green' : collectionRate >= 50 ? 'orange' : 'red'}
            borderRadius="md"
          />
        </CardBody>
      </Card>

      {/* Revenue Breakdown */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6} mt={6}>
        <Card>
          <CardBody>
            <Flex align="center" mb={4}>
              <Icon as={FiPieChart} boxSize={5} color="purple.500" mr={2} />
              <Heading size="md">Phân loại hóa đơn theo loại</Heading>
            </Flex>
            <Divider mb={4} />
            {Object.entries(billStats.bills_by_type).map(([type, count]) => (
              <Flex key={type} justify="space-between" align="center" mb={3}>
                <Text textTransform="capitalize" fontWeight="medium">
                  {type === 'monthly_fee' ? 'Phí hàng tháng' : 
                   type === 'service_fee' ? 'Phí dịch vụ' : 
                   type === 'parking_fee' ? 'Phí đỗ xe' : 
                   type === 'utilities' ? 'Tiện ích' : 
                   type === 'maintenance' ? 'Bảo trì' : type}
                </Text>
                <Badge colorScheme="purple">{count} hóa đơn</Badge>
              </Flex>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Flex align="center" mb={4}>
              <Icon as={FiCreditCard} boxSize={5} color="purple.500" mr={2} />
              <Heading size="md">Tình trạng thanh toán</Heading>
            </Flex>
            <Divider mb={4} />
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="medium">Tổng số hóa đơn:</Text>
              <Badge colorScheme="blue" fontSize="md">{billStats.total_bills}</Badge>
            </Flex>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="medium" color="green.600">Đã thanh toán:</Text>
              <Badge colorScheme="green" fontSize="md">{billStats.bills_by_status.paid}</Badge>
            </Flex>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="medium" color="orange.600">Chờ thanh toán:</Text>
              <Badge colorScheme="orange" fontSize="md">{billStats.bills_by_status.pending}</Badge>
            </Flex>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="medium" color="red.600">Quá hạn:</Text>
              <Badge colorScheme="red" fontSize="md">{billStats.bills_by_status.overdue}</Badge>
            </Flex>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="medium" color="gray.600">Đã hủy:</Text>
              <Badge colorScheme="gray" fontSize="md">{billStats.bills_by_status.cancelled}</Badge>
            </Flex>
          </CardBody>
        </Card>
      </Grid>
    </Box>
  )
}

export default ManagerDashboard
