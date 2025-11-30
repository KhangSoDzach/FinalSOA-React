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
  FiCheckCircle,
  FiTrendingUp,
  FiCreditCard,
  FiActivity,
  FiPieChart,
} from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { billsAPI } from '../../services/api'
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

/**
 * Accountant Dashboard - Kế toán
 * Focus on financial management, bills, and cash flow
 */
const AccountantDashboard = () => {
  const { user } = useAuth()
  const [statistics, setStatistics] = useState<BillStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const data = await billsAPI.getStatistics()
      setStatistics(data)
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
    if (!statistics) return 0
    const total = statistics.amounts.total_amount
    if (total === 0) return 0
    return (statistics.amounts.paid_amount / total) * 100
  }

  if (loading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="green.500" />
      </Center>
    )
  }

  if (!statistics) {
    return (
      <Center h="400px">
        <Text color="gray.500">Không có dữ liệu thống kê</Text>
      </Center>
    )
  }

  const collectionRate = getCollectionRate()

  const stats = [
    {
      label: 'Tổng hóa đơn',
      value: statistics.total_bills.toString(),
      icon: FiFileText,
      color: 'blue.500',
      helpText: 'Tất cả hóa đơn',
    },
    {
      label: 'Chờ thanh toán',
      value: statistics.bills_by_status.pending.toString(),
      icon: FiActivity,
      color: 'orange.500',
      helpText: formatCurrency(statistics.amounts.pending_amount),
    },
    {
      label: 'Quá hạn',
      value: statistics.bills_by_status.overdue.toString(),
      icon: FiAlertCircle,
      color: 'red.500',
      helpText: formatCurrency(statistics.amounts.overdue_amount),
    },
    {
      label: 'Đã thanh toán',
      value: statistics.bills_by_status.paid.toString(),
      icon: FiCheckCircle,
      color: 'green.500',
      helpText: formatCurrency(statistics.amounts.paid_amount),
    },
    {
      label: 'Tổng doanh thu',
      value: formatCurrency(statistics.amounts.total_amount),
      icon: FiDollarSign,
      color: 'teal.500',
      helpText: 'Tất cả hóa đơn',
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
        Bảng điều khiển Kế toán
      </Heading>
      <Text color="gray.600" mb={6}>
        Chào mừng, {user?.full_name}. Quản lý tài chính và hóa đơn.
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {stats.map((stat, index) => (
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
                {formatCurrency(statistics.amounts.paid_amount)} / {formatCurrency(statistics.amounts.total_amount)}
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

      {/* Bills Breakdown */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6} mt={6}>
        <Card>
          <CardBody>
            <Flex align="center" mb={4}>
              <Icon as={FiPieChart} boxSize={5} color="green.500" mr={2} />
              <Heading size="md">Phân loại hóa đơn theo loại</Heading>
            </Flex>
            <Divider mb={4} />
            {Object.entries(statistics.bills_by_type).map(([type, count]) => (
              <Flex key={type} justify="space-between" align="center" mb={3}>
                <Text textTransform="capitalize" fontWeight="medium">
                  {type === 'monthly_fee' ? 'Phí hàng tháng' : 
                   type === 'service_fee' ? 'Phí dịch vụ' : 
                   type === 'parking_fee' ? 'Phí đỗ xe' : 
                   type === 'utilities' ? 'Tiện ích' : 
                   type === 'maintenance' ? 'Bảo trì' : type}
                </Text>
                <Badge colorScheme="blue">{count} hóa đơn</Badge>
              </Flex>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Flex align="center" mb={4}>
              <Icon as={FiCreditCard} boxSize={5} color="green.500" mr={2} />
              <Heading size="md">Chi tiết thanh toán</Heading>
            </Flex>
            <Divider mb={4} />
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="medium">Tổng số hóa đơn:</Text>
              <Badge colorScheme="blue" fontSize="md">{statistics.total_bills}</Badge>
            </Flex>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="medium" color="green.600">Đã thanh toán:</Text>
              <Badge colorScheme="green" fontSize="md">{statistics.bills_by_status.paid}</Badge>
            </Flex>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="medium" color="orange.600">Chờ thanh toán:</Text>
              <Badge colorScheme="orange" fontSize="md">{statistics.bills_by_status.pending}</Badge>
            </Flex>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="medium" color="red.600">Quá hạn:</Text>
              <Badge colorScheme="red" fontSize="md">{statistics.bills_by_status.overdue}</Badge>
            </Flex>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="medium" color="gray.600">Đã hủy:</Text>
              <Badge colorScheme="gray" fontSize="md">{statistics.bills_by_status.cancelled}</Badge>
            </Flex>
          </CardBody>
        </Card>
      </Grid>
    </Box>
  )
}

export default AccountantDashboard
