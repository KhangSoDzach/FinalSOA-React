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
  Button,
} from '@chakra-ui/react'
import {
  FiMessageSquare,
  FiSettings,
  FiCheckCircle,
  FiClock,
  FiBell,
  FiTruck,
} from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

/**
 * Receptionist Dashboard - Lễ tân
 * Focus on services, tickets, and notifications
 */
const ReceptionistDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const stats = [
    {
      label: 'Open Tickets',
      value: '12',
      icon: FiMessageSquare,
      color: 'blue.500',
      helpText: '5 assigned to you',
    },
    {
      label: 'Service Bookings',
      value: '8',
      icon: FiSettings,
      color: 'purple.500',
      helpText: '3 pending confirmation',
    },
    {
      label: 'Resolved Today',
      value: '15',
      icon: FiCheckCircle,
      color: 'green.500',
      helpText: 'Tickets completed',
    },
    {
      label: 'Pending Response',
      value: '4',
      icon: FiClock,
      color: 'orange.500',
      helpText: 'Requires attention',
    },
    {
      label: 'Notifications Sent',
      value: '23',
      icon: FiBell,
      color: 'teal.500',
      helpText: 'This week',
    },
    {
      label: 'Vehicle Requests',
      value: '7',
      icon: FiTruck,
      color: 'pink.500',
      helpText: 'View only',
    },
  ]

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Bảng điều khiển Lễ tân
      </Heading>
      <Text color="gray.600" mb={6}>
        Chào mừng, {user?.full_name}. Quản lý dịch vụ và hỗ trợ cư dân.
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

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6} mt={6}>
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>
              Quản lý Tickets
            </Heading>
            <Text color="gray.600" mb={4}>
              Xem và xử lý phản hồi, khiếu nại từ cư dân
            </Text>
            <Button
              colorScheme="blue"
              leftIcon={<Icon as={FiMessageSquare} />}
              onClick={() => navigate('/admin/tickets')}
            >
              Xem Tickets
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Heading size="md" mb={4}>
              Quản lý Dịch vụ
            </Heading>
            <Text color="gray.600" mb={4}>
              Quản lý đặt dịch vụ và xác nhận booking
            </Text>
            <Button
              colorScheme="purple"
              leftIcon={<Icon as={FiSettings} />}
              onClick={() => navigate('/admin/services')}
            >
              Quản lý Services
            </Button>
          </CardBody>
        </Card>
      </Grid>
    </Box>
  )
}

export default ReceptionistDashboard
