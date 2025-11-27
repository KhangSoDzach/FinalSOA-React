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
  Spacer,
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
  useToast,
  Image,
  Spinner,
  Center
} from '@chakra-ui/react'
import { 
  FiPlus, 
  FiCheckCircle,
  FiXCircle,
  FiEdit,
  FiTrash,
  FiAlertCircle
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { vehiclesAPI } from '../services/api' // SỬA: Import vehiclesAPI từ api.ts

interface Vehicle {
  id: number
  license_plate: string
  make: string
  model: string
  color: string
  vehicle_type: 'car' | 'motorcycle' | 'bicycle'
  status: 'active' | 'pending' | 'expired' | 'rejected'
  registered_at: string
  expires_at?: string
  parking_spot?: string
  rejection_reason?: string
  license_plate_image?: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'green'
    case 'pending': return 'orange'
    case 'expired': return 'red'
    case 'rejected': return 'red'
    default: return 'gray'
  }
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'car': return 'Ô tô'
    case 'motorcycle': return 'Xe máy'
    case 'bicycle': return 'Xe đạp'
    default: return type
  }
}

export default function Vehicles() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const toast = useToast()
  
  const [formData, setFormData] = useState({
    license_plate: '',
    make: '',
    model: '',
    color: '',
    vehicle_type: 'car'
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      // SỬA: Gọi API thật
      const data = await vehiclesAPI.getMyVehicles()
      setVehicles(data)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách xe',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    // Validate đơn giản
    if (!formData.license_plate || !formData.make || !formData.model) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    try {
      setActionLoading(true)
      // SỬA: Gọi API Create
      await vehiclesAPI.create(formData)
      
      toast({
        title: 'Đăng ký thành công',
        description: 'Thông tin xe đã được gửi và đang chờ Ban Quản Lý phê duyệt.',
        status: 'success',
        duration: 5000,
      })
      
      onClose()
      // Refresh lại danh sách để thấy xe mới (status Pending)
      fetchVehicles()
      
      // Reset form
      setFormData({
        license_plate: '',
        make: '',
        model: '',
        color: '',
        vehicle_type: 'car'
      })
    } catch (error: any) {
      toast({
        title: 'Lỗi đăng ký',
        description: error.response?.data?.detail || 'Không thể đăng ký xe. Vui lòng thử lại.',
        status: 'error',
        duration: 4000,
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn hủy đăng ký/xóa xe này?')) return
    
    try {
      await vehiclesAPI.delete(id)
      toast({
        title: 'Đã xóa',
        description: 'Đã xóa thông tin xe khỏi hệ thống',
        status: 'success',
        duration: 3000,
      })
      fetchVehicles()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa xe',
        status: 'error',
        duration: 3000,
      })
    }
  }

  return (
    <Box>
      {/* Header */}
      <Flex mb="6" align="center">
        <Box>
          <Text fontSize="2xl" fontWeight="semibold">
            Đăng ký phương tiện
          </Text>
          <Text color="gray.600">
            Quản lý danh sách xe và thẻ gửi xe của căn hộ
          </Text>
        </Box>
        <Spacer />
        <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={onOpen}>
          Đăng ký xe mới
        </Button>
      </Flex>

      {/* Vehicle Grid */}
      {loading ? (
        <Center h="200px">
          <Spinner size="xl" color="brand.500" />
        </Center>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="6">
          {vehicles.length === 0 ? (
            <Card width="100%" gridColumn={{md: "span 2", lg: "span 3"}}>
              <CardBody py={10}>
                <VStack spacing={4}>
                  <Icon as={FiAlertCircle} boxSize={10} color="gray.400" />
                  <Text textAlign="center" color="gray.500">
                    Bạn chưa đăng ký phương tiện nào.
                  </Text>
                  <Button variant="outline" colorScheme="brand" onClick={onOpen}>
                    Đăng ký ngay
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ) : (
            vehicles.map((vehicle) => (
              <Card key={vehicle.id} _hover={{ shadow: 'md' }} transition="all 0.2s">
                <CardBody>
                  <VStack spacing="4" align="stretch">
                    {/* Vehicle Header & Status */}
                    <Flex justify="space-between" align="start">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="xl" color="gray.700">
                          {vehicle.license_plate}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {vehicle.make} {vehicle.model}
                        </Text>
                      </VStack>
                      <Badge colorScheme={getStatusColor(vehicle.status)} px={2} py={1} borderRadius="md">
                        {vehicle.status === 'pending' && 'CHỜ DUYỆT'}
                        {vehicle.status === 'active' && 'ĐANG HOẠT ĐỘNG'}
                        {vehicle.status === 'expired' && 'HẾT HẠN'}
                        {vehicle.status === 'rejected' && 'BỊ TỪ CHỐI'}
                      </Badge>
                    </Flex>
                    
                    <Box h="1px" bg="gray.100" />
                    
                    {/* Vehicle Info */}
                    <VStack spacing="2" align="stretch">
                      <HStack justify="space-between" fontSize="sm">
                        <Text color="gray.500">Loại xe:</Text>
                        <Text fontWeight="medium">{getTypeLabel(vehicle.vehicle_type)}</Text>
                      </HStack>
                      <HStack justify="space-between" fontSize="sm">
                        <Text color="gray.500">Màu sắc:</Text>
                        <Text fontWeight="medium">{vehicle.color}</Text>
                      </HStack>
                      
                      {vehicle.parking_spot && (
                        <HStack justify="space-between" fontSize="sm" bg="green.50" p={2} borderRadius="md">
                          <Text color="green.700" fontWeight="medium">Vị trí đỗ:</Text>
                          <Text fontWeight="bold" color="green.700">
                            {vehicle.parking_spot}
                          </Text>
                        </HStack>
                      )}
                      
                      {vehicle.expires_at && vehicle.status === 'active' && (
                        <HStack justify="space-between" fontSize="sm">
                          <Text color="gray.500">Hết hạn:</Text>
                          <Text>{new Date(vehicle.expires_at).toLocaleDateString('vi-VN')}</Text>
                        </HStack>
                      )}
                      
                      {vehicle.rejection_reason && (
                        <Box p="3" bg="red.50" borderRadius="md" border="1px dashed" borderColor="red.200">
                          <Text fontSize="xs" fontWeight="bold" color="red.700" mb={1}>
                            Lý do từ chối:
                          </Text>
                          <Text fontSize="xs" color="red.600">
                            {vehicle.rejection_reason}
                          </Text>
                        </Box>
                      )}
                    </VStack>
                    
                    {/* Action Buttons */}
                    <HStack spacing="2" pt={2}>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        colorScheme="red" 
                        leftIcon={<FiTrash />}
                        onClick={() => handleDelete(vehicle.id)}
                        w="full"
                      >
                        {vehicle.status === 'pending' ? 'Hủy yêu cầu' : 'Xóa xe'}
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))
          )}
        </SimpleGrid>
      )}

      {/* Registration Guidelines */}
      <Card mt="8" bg="blue.50" borderColor="blue.100" borderWidth="1px">
        <CardBody>
          <Flex gap={4}>
            <Icon as={FiCheckCircle} color="blue.500" boxSize={6} mt={1} />
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb="2" color="blue.700">
                Lưu ý khi đăng ký
              </Text>
              <VStack spacing="1" align="stretch" color="blue.600" fontSize="sm">
                <Text>• Mỗi căn hộ được đăng ký tối đa 2 ô tô và 2 xe máy.</Text>
                <Text>• Đơn đăng ký sẽ được Ban Quản Lý duyệt trong vòng 24h.</Text>
                <Text>• Vui lòng nhập đúng biển số xe để hệ thống nhận diện tự động khi ra vào.</Text>
              </VStack>
            </Box>
          </Flex>
        </CardBody>
      </Card>

      {/* Register Vehicle Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Đăng ký xe mới</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            <VStack spacing="4" align="stretch">
              <FormControl isRequired>
                <FormLabel>Biển số xe</FormLabel>
                <Input
                  placeholder="Ví dụ: 30A-123.45"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({...formData, license_plate: e.target.value.toUpperCase()})}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Loại xe</FormLabel>
                <Select
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})}
                >
                  <option value="car">Ô tô</option>
                  <option value="motorcycle">Xe máy</option>
                  <option value="bicycle">Xe đạp</option>
                </Select>
              </FormControl>

              <HStack spacing="4">
                <FormControl isRequired>
                  <FormLabel>Hãng xe</FormLabel>
                  <Input
                    placeholder="Ví dụ: Toyota, Honda..."
                    value={formData.make}
                    onChange={(e) => setFormData({...formData, make: e.target.value})}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Dòng xe</FormLabel>
                  <Input
                    placeholder="Ví dụ: Camry, Vision..."
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                  />
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel>Màu sắc</FormLabel>
                <Input
                  placeholder="Ví dụ: Trắng, Đen..."
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                />
              </FormControl>

              <HStack spacing="3" pt={4}>
                <Button flex="1" variant="outline" onClick={onClose}>
                  Hủy
                </Button>
                <Button 
                  flex="1" 
                  colorScheme="brand" 
                  onClick={handleSubmit}
                  isLoading={actionLoading}
                  loadingText="Đang gửi..."
                >
                  Gửi đăng ký
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}