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
  useToast,
  Spinner,
  Center
} from '@chakra-ui/react'
import { 
  FiCalendar, 
  FiClock,
  FiXCircle
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { servicesAPI } from '../services/api'
import { getServiceUnitText, getBookingStatusText } from '../utils/serviceHelpers'

// Interface khớp với Backend Response
interface Service {
  id: number
  name: string
  description: string
  category: string
  price: number
  unit: string
  provider_name: string
  status: string
}

interface Booking {
  id: number
  booking_number: string
  service_id: number
  service?: Service
  scheduled_date: string
  scheduled_time_start: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  total_amount: number
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'blue'
    case 'in_progress': return 'purple'
    case 'completed': return 'green'
    case 'pending': return 'orange'
    case 'cancelled': return 'red'
    default: return 'gray'
  }
}

export default function Utilities() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  
  const [services, setServices] = useState<Service[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  
  // Form State
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    notes: '',
    quantity: 1
  })

  // HÀM MỚI: Tính toán ngày mai để làm mốc min date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // 1. Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true)
      const [servicesData, bookingsData] = await Promise.all([
        servicesAPI.getAllServices(),
        servicesAPI.getMyBookings()
      ])
      
      const enrichedBookings = bookingsData.map((b: any) => {
        const srv = servicesData.find((s: any) => s.id === b.service_id)
        return { ...b, service: srv }
      })

      setServices(servicesData)
      setBookings(enrichedBookings)
    } catch (error) {
      console.error(error)
      toast({
        title: "Lỗi tải dữ liệu",
        status: "error",
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenBooking = (service: Service) => {
    setSelectedService(service)
    setBookingData({
      date: getTomorrowDate(), // Mặc định chọn ngày mai
      time: '09:00',
      notes: '',
      quantity: 1
    })
    onOpen()
  }

  // 2. Handle Booking Submit
  const handleSubmitBooking = async () => {
    if (!selectedService) return

    try {
      setActionLoading(true)
      const payload = {
        scheduled_date: new Date(bookingData.date).toISOString(),
        scheduled_time_start: bookingData.time + ":00",
        quantity: bookingData.quantity,
        special_instructions: bookingData.notes
      }

      await servicesAPI.bookService(selectedService.id, payload)
      
      toast({
        title: "Đặt dịch vụ thành công",
        description: "Vui lòng chờ BQL xác nhận.",
        status: "success",
        duration: 5000
      })
      onClose()
      fetchData() 

    } catch (error: any) {
      toast({
        title: "Đặt thất bại",
        description: error.response?.data?.detail || "Có lỗi xảy ra",
        status: "error",
        duration: 4000
      })
    } finally {
      setActionLoading(false)
    }
  }

  // 3. Handle Cancel Booking
  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn này?")) return

    try {
      setActionLoading(true)
      await servicesAPI.cancelBooking(bookingId)
      toast({
        title: "Đã hủy đơn",
        status: "success",
        duration: 3000
      })
      fetchData()
    } catch (error: any) {
      toast({
        title: "Hủy thất bại",
        description: error.response?.data?.detail,
        status: "error",
        duration: 3000
      })
    } finally {
      setActionLoading(false)
    }
  }

  const activeBookings = bookings.filter(b => 
    ['pending', 'confirmed', 'in_progress'].includes(b.status)
  )
  const historyBookings = bookings.filter(b => 
    ['completed', 'cancelled'].includes(b.status)
  )

  if (loading) return <Center h="200px"><Spinner /></Center>

  return (
    <Box>
      <Box mb="6">
        <Text fontSize="2xl" fontWeight="semibold" mb="2">
          Dịch vụ tiện ích
        </Text>
        <Text color="gray.600">
          Đặt lịch dọn dẹp, sửa chữa và các tiện ích khác cho căn hộ của bạn
        </Text>
      </Box>

      <Tabs isLazy>
        <TabList>
          <Tab>Danh sách dịch vụ</Tab>
          <Tab>Đang đặt ({activeBookings.length})</Tab>
          <Tab>Lịch sử ({historyBookings.length})</Tab>
        </TabList>

        <TabPanels>
          {/* --- Tab 1: Available Services --- */}
          <TabPanel p="0" pt="6">
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="6">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardBody>
                    <VStack spacing="4" align="stretch">
                      <Box>
                        <HStack justify="space-between" mb="2">
                          <Text fontWeight="semibold" fontSize="lg">
                            {service.name}
                          </Text>
                          <Badge colorScheme="green">Hoạt động</Badge>
                        </HStack>
                        
                        <Text color="gray.600" fontSize="sm" mb="3" noOfLines={2}>
                          {service.description}
                        </Text>
                        
                        <VStack spacing="2" align="stretch" fontSize="sm">
                          <HStack justify="space-between">
                            <Text color="gray.500">Đơn vị:</Text>
                            <Text fontWeight="medium">{getServiceUnitText(service.unit)}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text color="gray.500">Nhà cung cấp:</Text>
                            <Text fontWeight="medium">{service.provider_name || 'BQL'}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text color="gray.500">Giá:</Text>
                            <Text fontWeight="bold" color="brand.500" fontSize="md">
                              {formatCurrency(service.price)}
                            </Text>
                          </HStack>
                        </VStack>
                      </Box>
                      
                      <Button
                        colorScheme="brand"
                        leftIcon={<FiCalendar />}
                        onClick={() => handleOpenBooking(service)}
                      >
                        Đặt dịch vụ
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </TabPanel>

          {/* --- Tab 2: Active Bookings --- */}
          <TabPanel p="0" pt="6">
            <VStack spacing="4" align="stretch">
              {activeBookings.length === 0 ? (
                <Text textAlign="center" color="gray.500" py={8}>Chưa có dịch vụ nào đang đặt.</Text>
              ) : (
                activeBookings.map((booking) => (
                  <Card key={booking.id} borderLeft="4px solid" borderColor={getStatusColor(booking.status) + ".400"}>
                    <CardBody>
                      <Flex align="center" direction={{base: 'column', md: 'row'}} gap={4}>
                        <Box flex="1">
                          <HStack spacing="3" mb="2">
                            <Text fontWeight="semibold" fontSize="lg">
                              {booking.service?.name || "Dịch vụ #" + booking.service_id}
                            </Text>
                            <Badge colorScheme={getStatusColor(booking.status)}>
                              {getBookingStatusText(booking.status)}
                            </Badge>
                          </HStack>
                          
                          <HStack spacing="6" fontSize="sm" color="gray.600" wrap="wrap">
                            <HStack>
                              <Icon as={FiCalendar} />
                              <Text>{new Date(booking.scheduled_date).toLocaleDateString('vi-VN')}</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiClock} />
                              <Text>{booking.scheduled_time_start.substring(0, 5)}</Text>
                            </HStack>
                            <Text fontWeight="medium" color="brand.500">
                              {formatCurrency(booking.total_amount)}
                            </Text>
                          </HStack>
                          {booking.booking_number && (
                            <Text fontSize="xs" color="gray.400" mt={1}>#{booking.booking_number}</Text>
                          )}
                        </Box>
                        
                        <HStack>
                          {booking.status === 'pending' && (
                            <Button 
                              size="sm" 
                              colorScheme="red" 
                              variant="outline" 
                              leftIcon={<FiXCircle />}
                              isLoading={actionLoading}
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Hủy yêu cầu
                            </Button>
                          )}
                        </HStack>
                      </Flex>
                    </CardBody>
                  </Card>
                ))
              )}
            </VStack>
          </TabPanel>

          {/* --- Tab 3: History --- */}
          <TabPanel p="0" pt="6">
            <VStack spacing="4" align="stretch">
               {historyBookings.map((booking) => (
                <Card key={booking.id} opacity={0.8}>
                  <CardBody>
                    <Flex align="center">
                      <Box flex="1">
                        <HStack spacing="3" mb="2">
                          <Text fontWeight="semibold" fontSize="lg">
                            {booking.service?.name || "Dịch vụ cũ"}
                          </Text>
                          <Badge colorScheme={getStatusColor(booking.status)}>
                            {getBookingStatusText(booking.status)}
                          </Badge>
                        </HStack>
                        
                        <Text fontSize="sm" color="gray.500">
                          Ngày: {new Date(booking.scheduled_date).toLocaleDateString('vi-VN')}
                        </Text>
                      </Box>
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
            Đặt: {selectedService?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            {selectedService && (
              <VStack spacing="4" align="stretch">
                <Box p="4" bg="blue.50" borderRadius="md">
                   <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium">Đơn giá:</Text>
                    <Text fontWeight="bold" color="brand.500">
                      {formatCurrency(selectedService.price)} / {getServiceUnitText(selectedService.unit)}
                    </Text>
                  </HStack>
                </Box>

                <FormControl isRequired>
                  <FormLabel>Ngày sử dụng</FormLabel>
                  <Input
                    type="date"
                    min={getTomorrowDate()} // SỬA: Chỉ cho phép đặt từ ngày mai
                    value={bookingData.date}
                    onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                  />
                </FormControl>

                <HStack>
                  <FormControl isRequired>
                    <FormLabel>Giờ bắt đầu</FormLabel>
                    <Select
                      value={bookingData.time}
                      onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                    >
                      <option value="08:00">08:00</option>
                      <option value="09:00">09:00</option>
                      <option value="10:00">10:00</option>
                      <option value="13:00">13:00</option>
                      <option value="14:00">14:00</option>
                      <option value="15:00">15:00</option>
                      <option value="16:00">16:00</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Số lượng ({getServiceUnitText(selectedService.unit)})</FormLabel>
                    <Input 
                      type="number" 
                      min={1} 
                      max={10} 
                      value={bookingData.quantity}
                      onChange={(e) => setBookingData({...bookingData, quantity: parseInt(e.target.value)})}
                    />
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>Ghi chú đặc biệt</FormLabel>
                  <Textarea
                    placeholder="Ví dụ: Cần mang thêm dụng cụ..."
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                  />
                </FormControl>

                <Box pt={2}>
                  <Text textAlign="right" fontWeight="bold">
                    Tổng tiền dự kiến: {formatCurrency(selectedService.price * bookingData.quantity)}
                  </Text>
                </Box>

                <HStack spacing="3" pt={2}>
                  <Button flex="1" variant="ghost" onClick={onClose}>
                    Đóng
                  </Button>
                  <Button 
                    flex="1" 
                    colorScheme="brand" 
                    onClick={handleSubmitBooking}
                    isLoading={actionLoading}
                  >
                    Xác nhận đặt
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