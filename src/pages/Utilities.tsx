import {
  Box,
  Card,
  CardBody,
  Text,
  Button,
  SimpleGrid,
  Badge,
  HStack,
  VStack,
  Icon,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react'
import { 
  FiCalendar, 
  FiClock,
  FiStar
} from 'react-icons/fi'
import { useState } from 'react'

interface Service {
  id: string
  name: string
  description: string
  category: string
  price: number
  duration: string
  provider: string
  available: boolean
}

interface Booking {
  id: string
  serviceId: string
  serviceName: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  provider: string
  price: number
  rating?: number
}

const mockServices: Service[] = [
  {
    id: 'SV-001',
    name: 'Apartment Cleaning',
    description: 'Deep cleaning service for your apartment including kitchen, bathroom, and living areas',
    category: 'Cleaning',
    price: 500000,
    duration: '2-3 hours',
    provider: 'CleanPro Services',
    available: true
  },
  {
    id: 'SV-002',
    name: 'AC Maintenance',
    description: 'Air conditioning maintenance and cleaning service',
    category: 'Maintenance',
    price: 300000,
    duration: '1-2 hours',
    provider: 'CoolAir Tech',
    available: true
  },
  {
    id: 'SV-003',
    name: 'Plumbing Repair',
    description: 'Professional plumbing repair and installation services',
    category: 'Repair',
    price: 400000,
    duration: '1-3 hours',
    provider: 'AquaFix Pro',
    available: true
  },
  {
    id: 'SV-004',
    name: 'Meeting Room Booking',
    description: 'Book the community meeting room for events or gatherings',
    category: 'Facility',
    price: 200000,
    duration: 'Per hour',
    provider: 'Building Management',
    available: false
  }
]

const mockBookings: Booking[] = [
  {
    id: 'BK-001',
    serviceId: 'SV-001',
    serviceName: 'Apartment Cleaning',
    date: '2025-11-01',
    time: '09:00',
    status: 'confirmed',
    provider: 'CleanPro Services',
    price: 500000
  },
  {
    id: 'BK-002',
    serviceId: 'SV-002',
    serviceName: 'AC Maintenance',
    date: '2025-10-25',
    time: '14:00',
    status: 'completed',
    provider: 'CoolAir Tech',
    price: 300000,
    rating: 5
  }
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'blue'
    case 'completed': return 'green'
    case 'pending': return 'orange'
    case 'cancelled': return 'red'
    default: return 'gray'
  }
}

export default function Utilities() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    notes: ''
  })

  const handleBookService = (service: Service) => {
    setSelectedService(service)
    onOpen()
  }

  const upcomingBookings = mockBookings.filter(b => 
    b.status === 'confirmed' || b.status === 'pending'
  )
  const pastBookings = mockBookings.filter(b => 
    b.status === 'completed' || b.status === 'cancelled'
  )

  return (
    <Box>
      {/* Header */}
      <Box mb="6">
        <Text fontSize="2xl" fontWeight="semibold" mb="2">
          Utility Services
        </Text>
        <Text color="gray.600">
          Book cleaning, maintenance, and other utility services for your apartment
        </Text>
      </Box>

      <Tabs>
        <TabList>
          <Tab>Available Services</Tab>
          <Tab>My Bookings ({upcomingBookings.length})</Tab>
          <Tab>History ({pastBookings.length})</Tab>
        </TabList>

        <TabPanels>
          {/* Available Services */}
          <TabPanel p="0" pt="6">
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="6">
              {mockServices.map((service) => (
                <Card key={service.id} opacity={service.available ? 1 : 0.6}>
                  <CardBody>
                    <VStack spacing="4" align="stretch">
                      <Box>
                        <HStack justify="space-between" mb="2">
                          <Text fontWeight="semibold" fontSize="lg">
                            {service.name}
                          </Text>
                          <Badge colorScheme={service.available ? 'green' : 'gray'}>
                            {service.available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </HStack>
                        
                        <Text color="gray.600" fontSize="sm" mb="3">
                          {service.description}
                        </Text>
                        
                        <VStack spacing="2" align="stretch" fontSize="sm">
                          <HStack justify="space-between">
                            <Text color="gray.500">Category:</Text>
                            <Text fontWeight="medium">{service.category}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text color="gray.500">Duration:</Text>
                            <Text fontWeight="medium">{service.duration}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text color="gray.500">Provider:</Text>
                            <Text fontWeight="medium">{service.provider}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text color="gray.500">Price:</Text>
                            <Text fontWeight="bold" color="brand.500" fontSize="md">
                              {formatCurrency(service.price)}
                            </Text>
                          </HStack>
                        </VStack>
                      </Box>
                      
                      <Button
                        colorScheme="brand"
                        leftIcon={<FiCalendar />}
                        isDisabled={!service.available}
                        onClick={() => handleBookService(service)}
                      >
                        Book Service
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </TabPanel>

          {/* My Bookings */}
          <TabPanel p="0" pt="6">
            <VStack spacing="4" align="stretch">
              {upcomingBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardBody>
                    <Flex align="center">
                      <Box flex="1">
                        <HStack spacing="3" mb="2">
                          <Text fontWeight="semibold" fontSize="lg">
                            {booking.serviceName}
                          </Text>
                          <Badge colorScheme={getStatusColor(booking.status)}>
                            {booking.status.toUpperCase()}
                          </Badge>
                        </HStack>
                        
                        <HStack spacing="4" fontSize="sm" color="gray.500" mb="2">
                          <HStack>
                            <Icon as={FiCalendar} />
                            <Text>{new Date(booking.date).toLocaleDateString()}</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiClock} />
                            <Text>{booking.time}</Text>
                          </HStack>
                          <Text>Provider: {booking.provider}</Text>
                        </HStack>
                        
                        <Text fontWeight="medium" color="brand.500">
                          {formatCurrency(booking.price)}
                        </Text>
                      </Box>
                      
                      <VStack spacing="2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        {booking.status === 'confirmed' && (
                          <Button size="sm" colorScheme="red" variant="outline">
                            Cancel
                          </Button>
                        )}
                      </VStack>
                    </Flex>
                  </CardBody>
                </Card>
              ))}
              
              {upcomingBookings.length === 0 && (
                <Card>
                  <CardBody textAlign="center" py="12">
                    <Icon as={FiCalendar} boxSize="12" color="gray.400" mb="4" />
                    <Text fontSize="lg" fontWeight="semibold" mb="2">
                      No upcoming bookings
                    </Text>
                    <Text color="gray.600">
                      Book a service to see it here
                    </Text>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </TabPanel>

          {/* History */}
          <TabPanel p="0" pt="6">
            <VStack spacing="4" align="stretch">
              {pastBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardBody>
                    <Flex align="center">
                      <Box flex="1">
                        <HStack spacing="3" mb="2">
                          <Text fontWeight="semibold" fontSize="lg">
                            {booking.serviceName}
                          </Text>
                          <Badge colorScheme={getStatusColor(booking.status)}>
                            {booking.status.toUpperCase()}
                          </Badge>
                          {booking.rating && (
                            <HStack spacing="1">
                              {[...Array(5)].map((_, i) => (
                                <Icon
                                  key={i}
                                  as={FiStar}
                                  color={i < booking.rating! ? "yellow.400" : "gray.300"}
                                  fill={i < booking.rating! ? "yellow.400" : "none"}
                                />
                              ))}
                            </HStack>
                          )}
                        </HStack>
                        
                        <HStack spacing="4" fontSize="sm" color="gray.500" mb="2">
                          <HStack>
                            <Icon as={FiCalendar} />
                            <Text>{new Date(booking.date).toLocaleDateString()}</Text>
                          </HStack>
                          <Text>Provider: {booking.provider}</Text>
                        </HStack>
                        
                        <Text fontWeight="medium" color="brand.500">
                          {formatCurrency(booking.price)}
                        </Text>
                      </Box>
                      
                      <VStack spacing="2">
                        {booking.status === 'completed' && !booking.rating && (
                          <Button size="sm" colorScheme="brand">
                            Rate Service
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          Book Again
                        </Button>
                      </VStack>
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Booking Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Book Service: {selectedService?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            {selectedService && (
              <VStack spacing="4" align="stretch">
                <Box p="4" bg="gray.50" borderRadius="md">
                  <Text fontWeight="semibold" mb="2">{selectedService.name}</Text>
                  <Text fontSize="sm" color="gray.600" mb="3">
                    {selectedService.description}
                  </Text>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Duration: {selectedService.duration}</Text>
                    <Text fontWeight="bold" color="brand.500">
                      {formatCurrency(selectedService.price)}
                    </Text>
                  </HStack>
                </Box>

                <FormControl>
                  <FormLabel>Preferred Date</FormLabel>
                  <Input
                    type="date"
                    value={bookingData.date}
                    onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Preferred Time</FormLabel>
                  <Select
                    placeholder="Select time"
                    value={bookingData.time}
                    onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                  >
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Special Notes</FormLabel>
                  <Textarea
                    placeholder="Any special requirements or notes..."
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                  />
                </FormControl>

                <HStack spacing="3">
                  <Button flex="1" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button flex="1" colorScheme="brand">
                    Confirm Booking
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}