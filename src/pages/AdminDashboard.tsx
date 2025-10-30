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
} from '@chakra-ui/react'
import {
  FiHome,
  FiUsers,
  FiMapPin,
  FiDollarSign,
  FiCheckCircle,
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

const AdminDashboard = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  // Admin statistics
  const adminStats = [
    {
      label: 'Total Buildings',
      value: '2 BUILDINGS',
      icon: FiHome,
      color: 'pink',
      gradient: 'linear(to-r, pink.400, pink.600)',
    },
    {
      label: 'Total Apartments',
      value: '115 APARTMENTS',
      icon: FiHome,
      color: 'blue',
      gradient: 'linear(to-r, blue.400, blue.600)',
    },
    {
      label: 'Total Residents',
      value: '57 RESIDENTS',
      icon: FiUsers,
      color: 'green',
      gradient: 'linear(to-r, green.400, green.600)',
    },
  ]

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

  // Recent activities for admin
  const recentActivities = [
    {
      type: 'bill',
      title: 'New bill generated for Building A',
      time: '2 hours ago',
      status: 'info',
    },
    {
      type: 'maintenance',
      title: 'Maintenance request completed - Unit 302B',
      time: '4 hours ago',
      status: 'success',
    },
    {
      type: 'alert',
      title: '3 overdue payments require attention',
      time: '6 hours ago',
      status: 'warning',
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

  // Admin dashboard - full featured
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="gray.700">
          Admin Dashboard
        </Heading>
        <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
          ADMINISTRATOR
        </Badge>
      </Flex>

      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        {adminStats.map((stat, index) => (
          <Card key={index} variant="gradient" overflow="hidden">
            <CardBody>
              <Flex align="center" justify="space-between">
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    {stat.label}
                  </Text>
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    {stat.value}
                  </Text>
                </Box>
                <Box
                  p={4}
                  borderRadius="full"
                  bgGradient={stat.gradient}
                  color="white"
                >
                  <Icon as={stat.icon} boxSize={6} />
                </Box>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        {/* Category Grid */}
        <GridItem>
          <Card variant="elevated">
            <CardBody>
              <Heading size="md" mb={6} color="gray.700">
                Property Overview
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
        </GridItem>

        {/* Recent Activities */}
        <GridItem>
          <Card variant="elevated">
            <CardBody>
              <Heading size="md" mb={6} color="gray.700">
                Recent Activities
              </Heading>
              <VStack spacing={4} align="stretch">
                {recentActivities.map((activity, index) => (
                  <Box
                    key={index}
                    p={4}
                    borderRadius="md"
                    bg="gray.50"
                    borderLeft="4px solid"
                    borderColor={
                      activity.status === 'success' ? 'green.500' :
                      activity.status === 'warning' ? 'orange.500' :
                      'blue.500'
                    }
                  >
                    <Text fontSize="sm" fontWeight="semibold" mb={1}>
                      {activity.title}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {activity.time}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Quick Stats */}
          <Card variant="elevated" mt={6}>
            <CardBody>
              <Heading size="sm" mb={4} color="gray.700">
                System Status
              </Heading>
              <VStack spacing={3}>
                <Flex w="full" justify="space-between" align="center">
                  <Text fontSize="sm">Pending Tickets</Text>
                  <Badge colorScheme="orange">12</Badge>
                </Flex>
                <Flex w="full" justify="space-between" align="center">
                  <Text fontSize="sm">Overdue Bills</Text>
                  <Badge colorScheme="red">3</Badge>
                </Flex>
                <Flex w="full" justify="space-between" align="center">
                  <Text fontSize="sm">Active Services</Text>
                  <Badge colorScheme="green">18</Badge>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  )
}

export default AdminDashboard