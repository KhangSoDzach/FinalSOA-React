import {
  Box,
  Card,
  CardBody,
  Text,
  SimpleGrid,
  Icon,
  VStack,
} from '@chakra-ui/react'
import { 
  FiFileText, 
  FiMessageSquare, 
  FiTruck, 
  FiTool,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

const quickAccessItems = [
  {
    title: 'Bills',
    icon: FiFileText,
    color: 'blue',
    path: '/bills',
    description: 'View and pay bills'
  },
  {
    title: 'Feedback',
    icon: FiMessageSquare,
    color: 'orange',
    path: '/tickets',
    description: 'Submit feedback & complaints'
  },
  {
    title: 'Vehicle Card',
    icon: FiTruck,
    color: 'purple',
    path: '/vehicles',
    description: 'Manage vehicle registration'
  },
  {
    title: 'Utilities',
    icon: FiTool,
    color: 'green',
    path: '/utilities',
    description: 'Book utility services'
  },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <Box>
      {/* Balance Overview */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing="6" mb="8">
        {/* <Card bg="gradient-to-br from-green-400 to-green-600" color="white">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.900">Số dư tài khoản</StatLabel>
              <StatNumber fontSize="3xl">
                {(user?.balance || 0).toLocaleString('vi-VN')} VNĐ
              </StatNumber>
              <StatHelpText color="whiteAlpha.800">
                <Icon as={FiDollarSign} mr="1" />
                Có thể thanh toán hóa đơn
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Hóa đơn chờ thanh toán</StatLabel>
              <StatNumber fontSize="3xl">0</StatNumber>
              <StatHelpText>
                <Icon as={FiAlertCircle} mr="1" />
                Cần xử lý
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Tình trạng</StatLabel>
              <StatNumber fontSize="3xl" color="green.500">Tốt</StatNumber>
              <StatHelpText>
                Không có vấn đề cần xử lý
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card> */}
      </SimpleGrid>

      {/* Quick Access Section */}
      <Card mb="8">
        <CardBody>
          <Text fontSize="xl" fontWeight="semibold" mb="6">
            Quick Access
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="4">
            {quickAccessItems.map((item) => (
              <Card
                key={item.path}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                }}
                onClick={() => navigate(item.path)}
              >
                <CardBody textAlign="center" p="6">
                  <VStack spacing="3">
                    <Icon
                      as={item.icon}
                      boxSize="8"
                      color={`${item.color}.500`}
                    />
                    <Text fontWeight="semibold" fontSize="lg">
                      {item.title}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {item.description}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Announcements */}
      {/* <Card>
        <CardBody>
          <Text fontSize="xl" fontWeight="semibold" mb="4">
            Latest Announcements
          </Text>
          <VStack spacing="4" align="stretch">
            <Box p="4" borderLeft="4px solid" borderColor="blue.500" bg="blue.50">
              <Text fontWeight="medium">Elevator Maintenance Schedule</Text>
              <Text fontSize="sm" color="gray.600" mt="1">
                Elevator maintenance will be conducted on November 1st, 2025 from 9:00 AM to 5:00 PM.
              </Text>
              <Text fontSize="xs" color="gray.500" mt="2">
                Posted 2 days ago
              </Text>
            </Box>
            <Box p="4" borderLeft="4px solid" borderColor="green.500" bg="green.50">
              <Text fontWeight="medium">New Utility Booking System</Text>
              <Text fontSize="sm" color="gray.600" mt="1">
                We have launched a new online booking system for cleaning and maintenance services.
              </Text>
              <Text fontSize="xs" color="gray.500" mt="2">
                Posted 1 week ago
              </Text>
            </Box>
          </VStack>
        </CardBody>
      </Card> */}
    </Box>
  )
}