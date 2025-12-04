import {
  Box,
  Grid,
  GridItem,
  Card,
  CardBody,
  Text,
  Heading,
  Flex,
  Icon,
  SimpleGrid,
  Badge,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  useToast,
  Progress,
} from '@chakra-ui/react'
import {
  FiHome,
  FiUsers,
  FiMapPin,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { analyticsAPI } from '../services/api'
import {
  DashboardSummary,
  OccupancyRate,
  MonthlyRevenue,
  OutstandingBills,
  TopDebtor,
  TicketHeatmap,
} from '../types/analytics'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6']

const AdminDashboard = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData()
    }
  }, [isAdmin])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const data = await analyticsAPI.getDashboardSummary()
      setDashboardData(data)
    } catch (error: any) {
      toast({
        title: 'Lỗi khi tải dữ liệu',
        description: error.response?.data?.detail || 'Không thể tải dữ liệu dashboard',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Category cards data
  const categoryData = [
    {
      title: 'Apartments',
      value: '618 Apartments',
      icon: FiHome,
    },
    {
      title: 'Penthouse',
      value: '8 Penthouse',
      icon: FiHome,
    },
    {
      title: 'Buildings',
      value: '2 Buildings',
      icon: FiHome,
    },
    {
      title: 'Location',
      subtitle: 'Mai Chi Tho, An Phu Ward, District 2, HCMC',
      icon: FiMapPin,
    },
    {
      title: '1 Bedroom',
      value: '43.8m²',
      icon: FiHome,
    },
    {
      title: '2 Bedroom',
      value: '66.7m²',
      icon: FiHome,
    },
    {
      title: '3 Bedroom',
      value: '83.1m²',
      icon: FiHome,
    },
    {
      title: 'Penthouse',
      value: '152.5m²',
      icon: FiHome,
    },
  ]

  if (!isAdmin) {
    // Regular user dashboard - simpler view
    return (
      <Box>
        <Heading size="lg" mb={6} color="gray.700">
          Welcome back, {user?.full_name}!
        </Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={8}>
          <Card variant="elevated">
            <CardBody>
              <HStack spacing={4}>
                <Icon as={FiHome} boxSize={8} color="blue.500" />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.600">Your Apartment</Text>
                  <Text fontSize="lg" fontWeight="semibold">{user?.apartment_number || 'N/A'}</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          <Card variant="elevated">
            <CardBody>
              <HStack spacing={4}>
                <Icon as={FiDollarSign} boxSize={8} color="green.500" />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.600">Outstanding Bills</Text>
                  <Text fontSize="lg" fontWeight="semibold">2 Bills</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          <Card variant="elevated">
            <CardBody>
              <HStack spacing={4}>
                <Icon as={FiCheckCircle} boxSize={8} color="purple.500" />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.600">Active Services</Text>
                  <Text fontSize="lg" fontWeight="semibold">1 Booking</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card variant="elevated">
          <CardBody>
            <Heading size="md" mb={4}>Quick Actions</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box p={4} bg="blue.50" borderRadius="md" cursor="pointer" _hover={{ bg: 'blue.100' }}>
                <Text fontWeight="semibold" color="blue.700">Pay Bills</Text>
                <Text fontSize="sm" color="blue.600">View and pay your outstanding bills</Text>
              </Box>
              <Box p={4} bg="purple.50" borderRadius="md" cursor="pointer" _hover={{ bg: 'purple.100' }}>
                <Text fontWeight="semibold" color="purple.700">Submit Request</Text>
                <Text fontSize="sm" color="purple.600">Report maintenance issues</Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
      </Box>
    )
  }

  // Admin dashboard - full featured with analytics
  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" color="purple.500" thickness="4px" />
      </Flex>
    )
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="gray.700">
          Analytics Dashboard
        </Heading>
        <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
          MANAGER
        </Badge>
      </Flex>

      {/* Key Metrics Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        {/* Occupancy Rate */}
        <Card variant="elevated" overflow="hidden">
          <CardBody>
            <Stat>
              <StatLabel color="gray.600" fontSize="sm">Tỷ lệ lấp đầy</StatLabel>
              <StatNumber fontSize="2xl" color="purple.600">
                {dashboardData?.occupancy_rate.occupancy_rate.toFixed(1)}%
              </StatNumber>
              <StatHelpText>
                {dashboardData?.occupancy_rate.occupied}/{dashboardData?.occupancy_rate.total} căn hộ
              </StatHelpText>
            </Stat>
            <Progress
              value={dashboardData?.occupancy_rate.occupancy_rate || 0}
              size="sm"
              colorScheme="purple"
              mt={3}
              borderRadius="full"
            />
          </CardBody>
        </Card>

        {/* Total Outstanding */}
        <Card variant="elevated">
          <CardBody>
            <Stat>
              <StatLabel color="gray.600" fontSize="sm">Tổng công nợ</StatLabel>
              <StatNumber fontSize="2xl" color="red.600">
                {(dashboardData?.outstanding_bills.total_outstanding || 0).toLocaleString('vi-VN')} ₫
              </StatNumber>
              <StatHelpText color="red.500">
                <Icon as={FiAlertCircle} mr={1} />
                {dashboardData?.outstanding_bills.overdue.count} hóa đơn quá hạn
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* Pending Bills */}
        <Card variant="elevated">
          <CardBody>
            <Stat>
              <StatLabel color="gray.600" fontSize="sm">Hóa đơn chờ thanh toán</StatLabel>
              <StatNumber fontSize="2xl" color="orange.600">
                {(dashboardData?.outstanding_bills.pending.amount || 0).toLocaleString('vi-VN')} ₫
              </StatNumber>
              <StatHelpText>
                {dashboardData?.outstanding_bills.pending.count} hóa đơn
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* Total Tickets */}
        <Card variant="elevated">
          <CardBody>
            <Stat>
              <StatLabel color="gray.600" fontSize="sm">Tổng tickets</StatLabel>
              <StatNumber fontSize="2xl" color="blue.600">
                {dashboardData?.ticket_heatmap.reduce((sum, item) => sum + item.total, 0) || 0}
              </StatNumber>
              <StatHelpText>
                {dashboardData?.ticket_heatmap.reduce((sum, item) => sum + item.open, 0) || 0} đang mở
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6} mb={6}>
        {/* Monthly Revenue Chart */}
        <GridItem>
          <Card variant="elevated">
            <CardBody>
              <Heading size="md" mb={6} color="gray.700">
                <Icon as={FiTrendingUp} mr={2} color="green.500" />
                Doanh thu theo tháng
              </Heading>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData?.monthly_revenue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString('vi-VN') + ' ₫'}
                  />
                  <Legend />
                  <Bar dataKey="paid" fill="#10B981" name="Đã thu" />
                  <Bar dataKey="expected" fill="#3B82F6" name="Dự kiến" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </GridItem>

        {/* Occupancy Breakdown */}
        <GridItem>
          <Card variant="elevated">
            <CardBody>
              <Heading size="md" mb={6} color="gray.700">
                Chi tiết căn hộ
              </Heading>
              <VStack spacing={4} align="stretch">
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Box w={3} h={3} borderRadius="full" bg="green.500" />
                    <Text fontSize="sm">Đã cho thuê</Text>
                  </HStack>
                  <Badge colorScheme="green">{dashboardData?.occupancy_rate.occupied}</Badge>
                </Flex>
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Box w={3} h={3} borderRadius="full" bg="blue.500" />
                    <Text fontSize="sm">Còn trống</Text>
                  </HStack>
                  <Badge colorScheme="blue">{dashboardData?.occupancy_rate.available}</Badge>
                </Flex>
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Box w={3} h={3} borderRadius="full" bg="orange.500" />
                    <Text fontSize="sm">Đang bảo trì</Text>
                  </HStack>
                  <Badge colorScheme="orange">{dashboardData?.occupancy_rate.maintenance}</Badge>
                </Flex>
              </VStack>
              
              <Box mt={6}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Đã cho thuê', value: dashboardData?.occupancy_rate.occupied || 0 },
                        { name: 'Còn trống', value: dashboardData?.occupancy_rate.available || 0 },
                        { name: 'Bảo trì', value: dashboardData?.occupancy_rate.maintenance || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2].map((index) => (
                        <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6} mb={6}>
        {/* Top Debtors */}
        <GridItem>
          <Card variant="elevated">
            <CardBody>
              <Heading size="md" mb={6} color="gray.700">
                <Icon as={FiAlertCircle} mr={2} color="red.500" />
                Top 5 căn hộ nợ nhiều nhất
              </Heading>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Căn hộ</Th>
                    <Th>Cư dân</Th>
                    <Th isNumeric>Số tiền</Th>
                    <Th isNumeric>Số bills</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {dashboardData?.top_debtors.map((debtor) => (
                    <Tr key={debtor.user_id}>
                      <Td fontWeight="semibold">{debtor.apartment_number}</Td>
                      <Td>{debtor.name}</Td>
                      <Td isNumeric color="red.600" fontWeight="bold">
                        {debtor.total_debt.toLocaleString('vi-VN')} ₫
                      </Td>
                      <Td isNumeric>
                        <Badge colorScheme="red">{debtor.bill_count}</Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </GridItem>

        {/* Ticket Heatmap */}
        <GridItem>
          <Card variant="elevated">
            <CardBody>
              <Heading size="md" mb={6} color="gray.700">
                Thống kê Tickets theo danh mục
              </Heading>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData?.ticket_heatmap || []} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="open" stackId="a" fill="#F59E0B" name="Đang mở" />
                  <Bar dataKey="in_progress" stackId="a" fill="#3B82F6" name="Đang xử lý" />
                  <Bar dataKey="resolved" stackId="a" fill="#10B981" name="Đã giải quyết" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Property Overview */}
      <Card variant="elevated">
        <CardBody>
          <Heading size="md" mb={6} color="gray.700">
            Tổng quan tài sản
          </Heading>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            {categoryData.map((category, index) => (
              <Box
                key={index}
                p={4}
                borderRadius="lg"
                bg="gray.50"
                textAlign="center"
                transition="all 0.2s"
                _hover={{
                  bg: 'purple.50',
                  transform: 'translateY(-2px)',
                  boxShadow: 'md',
                }}
                cursor="pointer"
              >
                <Box
                  w={12}
                  h={12}
                  mx="auto"
                  mb={3}
                  borderRadius="full"
                  bg="purple.100"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={category.icon} color="purple.600" boxSize={5} />
                </Box>
                <Text fontWeight="semibold" fontSize="sm" mb={1}>
                  {category.title}
                </Text>
                {category.value && (
                  <Text fontSize="xs" color="gray.600">
                    {category.value}
                  </Text>
                )}
                {category.subtitle && (
                  <Text fontSize="xs" color="gray.500" textAlign="center">
                    {category.subtitle}
                  </Text>
                )}
              </Box>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card>
    </Box>
  )
}

export default AdminDashboard