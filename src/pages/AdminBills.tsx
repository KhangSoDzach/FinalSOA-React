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
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

const AdminBills = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  // Admin overview stats
  const billStats = [
    {
      label: 'Total Bills',
      value: '248',
      icon: FiDollarSign,
      color: 'blue',
      change: '+12 this month',
    },
    {
      label: 'Pending Payment',
      value: '43',
      icon: FiClock,
      color: 'orange',
      change: '-5 from last month',
    },
    {
      label: 'Paid Bills',
      value: '195',
      icon: FiCheckCircle,
      color: 'green',
      change: '+18 this month',
    },
    {
      label: 'Overdue',
      value: '10',
      icon: FiAlertTriangle,
      color: 'red',
      change: 'Requires attention',
    },
  ]

  // Sample bill data for admin view
  const allBills = [
    {
      id: 'B2024-001',
      apartment: 'A101',
      resident: 'Nguyễn Văn A',
      type: 'Monthly Fee',
      amount: '2,500,000',
      dueDate: '2024-11-15',
      status: 'paid',
      paidDate: '2024-11-10',
    },
    {
      id: 'B2024-002',
      apartment: 'B202',
      resident: 'Trần Thị B',
      type: 'Utilities',
      amount: '450,000',
      dueDate: '2024-11-20',
      status: 'pending',
      paidDate: null,
    },
    {
      id: 'B2024-003',
      apartment: 'C303',
      resident: 'Lê Văn C',
      type: 'Parking',
      amount: '300,000',
      dueDate: '2024-11-10',
      status: 'overdue',
      paidDate: null,
    },
    {
      id: 'B2024-004',
      apartment: 'A205',
      resident: 'Phạm Thị D',
      type: 'Monthly Fee',
      amount: '2,800,000',
      dueDate: '2024-11-25',
      status: 'pending',
      paidDate: null,
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
      default:
        return 'Unknown'
    }
  }

  if (!isAdmin) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Access denied. Admin privileges required.</Text>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="gray.700">
          Bills Management (All Residents)
        </Heading>
        <Button leftIcon={<FiPlus />} colorScheme="purple" size="sm">
          Generate New Bills
        </Button>
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

      {/* Filters and Search */}
      <Card variant="elevated" mb={6}>
        <CardBody>
          <HStack spacing={4}>
            <InputGroup flex={1}>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input placeholder="Search by apartment or resident name..." />
            </InputGroup>
            <Select w="200px" placeholder="All Statuses">
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </Select>
            <Select w="200px" placeholder="All Types">
              <option value="monthly">Monthly Fee</option>
              <option value="utilities">Utilities</option>
              <option value="parking">Parking</option>
            </Select>
          </HStack>
        </CardBody>
      </Card>

      {/* Bills Table */}
      <Card variant="elevated">
        <CardBody>
          <Heading size="md" mb={4} color="gray.700">
            All Bills
          </Heading>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Bill ID</Th>
                  <Th>Apartment</Th>
                  <Th>Resident</Th>
                  <Th>Type</Th>
                  <Th>Amount (VND)</Th>
                  <Th>Due Date</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {allBills.map((bill) => (
                  <Tr key={bill.id}>
                    <Td fontWeight="semibold">{bill.id}</Td>
                    <Td>{bill.apartment}</Td>
                    <Td>{bill.resident}</Td>
                    <Td>{bill.type}</Td>
                    <Td fontWeight="semibold">₫{bill.amount}</Td>
                    <Td>{bill.dueDate}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(bill.status)}>
                        {getStatusText(bill.status)}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button size="xs" leftIcon={<FiEdit />} variant="outline">
                          Edit
                        </Button>
                        <Button 
                          size="xs" 
                          leftIcon={<FiTrash2 />} 
                          colorScheme="red" 
                          variant="outline"
                        >
                          Delete
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
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
            <strong>Admin view:</strong> You can see all bills from all residents. Use the filters above to find specific bills or residents.
          </Text>
        </HStack>
      </Box>
    </Box>
  )
}

export default AdminBills