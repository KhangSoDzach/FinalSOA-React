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
} from '@chakra-ui/react'
import { 
  FiPlus, 
  FiCheckCircle,
  FiXCircle,
  FiEdit,
  FiTrash
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import api from '../services/api'

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
      const response = await api.get('/vehicles/my-vehicles')
      setVehicles(response.data)
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
    try {
      await api.post('/vehicles/', formData)
      toast({
        title: 'Thành công',
        description: 'Đăng ký xe thành công. Chờ xác nhận từ ban quản lý.',
        status: 'success',
        duration: 3000,
      })
      onClose()
      fetchVehicles()
      setFormData({
        license_plate: '',
        make: '',
        model: '',
        color: '',
        vehicle_type: 'car'
      })
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Không thể đăng ký xe',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa xe này?')) return
    
    try {
      await api.delete(`/vehicles/${id}`)
      toast({
        title: 'Thành công',
        description: 'Đã xóa xe',
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
            Vehicle Registration
          </Text>
          <Text color="gray.600">
            Manage your registered vehicles and parking
          </Text>
        </Box>
        <Spacer />
        <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={onOpen}>
          Register Vehicle
        </Button>
      </Flex>

      {/* Vehicle Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="6">
        {loading ? (
          <Card>
            <CardBody>
              <Text textAlign="center">Đang tải...</Text>
            </CardBody>
          </Card>
        ) : vehicles.length === 0 ? (
          <Card>
            <CardBody>
              <Text textAlign="center">Bạn chưa đăng ký xe nào</Text>
            </CardBody>
          </Card>
        ) : (
          vehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardBody>
                <VStack spacing="4" align="stretch">
                  {/* License Plate Image */}
                  <Box textAlign="center" py="4" bg="gray.50" borderRadius="md">
                    {vehicle.license_plate_image ? (
                      <Image
                        src={`http://localhost:8000${vehicle.license_plate_image}`}
                        alt={`Biển số ${vehicle.license_plate}`}
                        maxH="100px"
                        mx="auto"
                        objectFit="contain"
                        borderRadius="md"
                      />
                    ) : (
                      <VStack spacing={2}>
                        <Icon as={FiCheckCircle} boxSize="12" color="gray.400" />
                        <Text fontWeight="bold" fontSize="lg">
                          {vehicle.license_plate}
                        </Text>
                      </VStack>
                    )}
                  </Box>
                  
                  {/* Vehicle Info */}
                  <VStack spacing="2" align="stretch">
                    <HStack justify="space-between">
                      <Badge colorScheme={getStatusColor(vehicle.status)}>
                        {vehicle.status === 'pending' && 'CHỜ XÁC NHẬN'}
                        {vehicle.status === 'active' && 'ACTIVE'}
                        {vehicle.status === 'expired' && 'HẾT HẠN'}
                        {vehicle.status === 'rejected' && 'BỊ TỪ CHỐI'}
                      </Badge>
                    </HStack>
                    
                    <Text color="gray.600">
                      {vehicle.make} {vehicle.model}
                    </Text>
                    
                    <HStack justify="space-between" fontSize="sm" color="gray.500">
                      <Text>Màu: {vehicle.color}</Text>
                      <Text>Loại: {getTypeLabel(vehicle.vehicle_type)}</Text>
                    </HStack>
                    
                    {vehicle.parking_spot && (
                      <HStack justify="space-between" fontSize="sm">
                        <Text color="gray.500">Vị trí đỗ:</Text>
                        <Text fontWeight="medium" color="brand.500">
                          {vehicle.parking_spot}
                        </Text>
                      </HStack>
                    )}
                    
                    {vehicle.expires_at && (
                      <HStack justify="space-between" fontSize="sm" color="gray.500">
                        <Text>Hết hạn:</Text>
                        <Text>{new Date(vehicle.expires_at).toLocaleDateString('vi-VN')}</Text>
                      </HStack>
                    )}
                    
                    {vehicle.rejection_reason && (
                      <Box p="2" bg="red.50" borderRadius="md">
                        <Text fontSize="xs" color="red.700">
                          Lý do: {vehicle.rejection_reason}
                        </Text>
                      </Box>
                    )}
                  </VStack>
                  
                  {/* Action Buttons */}
                  <HStack spacing="2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      leftIcon={<FiEdit />} 
                      flex="1"
                      isDisabled={vehicle.status === 'active'}
                    >
                      Sửa
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      colorScheme="red" 
                      leftIcon={<FiTrash />}
                      onClick={() => handleDelete(vehicle.id)}
                    >
                      Xóa
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))
        )}
        
        {/* Add New Vehicle Card */}
        {vehicles.length < 4 && (
          <Card 
            cursor="pointer" 
            borderStyle="dashed" 
            borderWidth="2px"
            borderColor="gray.300"
            _hover={{ borderColor: 'brand.300', bg: 'brand.50' }}
            onClick={onOpen}
          >
            <CardBody>
              <VStack spacing="4" justify="center" h="full" textAlign="center" py="8">
                <Icon as={FiPlus} boxSize="12" color="gray.400" />
                <Text fontWeight="medium" color="gray.600">
                  Đăng ký xe mới
                </Text>
              </VStack>
            </CardBody>
          </Card>
        )}
      </SimpleGrid>

      {/* Registration Guidelines */}
      <Card mt="8">
        <CardBody>
          <Text fontSize="lg" fontWeight="semibold" mb="4">
            Hướng dẫn đăng ký
          </Text>
          <VStack spacing="3" align="stretch">
            <HStack>
              <Icon as={FiCheckCircle} color="green.500" />
              <Text>Mỗi căn hộ có thể đăng ký tối đa 2 ô tô và 2 xe máy</Text>
            </HStack>
            <HStack>
              <Icon as={FiCheckCircle} color="green.500" />
              <Text>Đăng ký xe có hiệu lực 1 năm</Text>
            </HStack>
            <HStack>
              <Icon as={FiCheckCircle} color="green.500" />
              <Text>Vị trí đỗ xe sẽ được phân công dựa trên tình trạng còn trống</Text>
            </HStack>
            <HStack>
              <Icon as={FiXCircle} color="red.500" />
              <Text>Xe chưa đăng ký sẽ bị kéo đi</Text>
            </HStack>
          </VStack>
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
              <FormControl>
                <FormLabel>Biển số xe</FormLabel>
                <Input
                  placeholder="Ví dụ: 30A-123.45"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                />
              </FormControl>

              <FormControl>
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
                <FormControl>
                  <FormLabel>Hãng xe</FormLabel>
                  <Input
                    placeholder="Ví dụ: Toyota"
                    value={formData.make}
                    onChange={(e) => setFormData({...formData, make: e.target.value})}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Dòng xe</FormLabel>
                  <Input
                    placeholder="Ví dụ: Camry"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Màu sắc</FormLabel>
                <Input
                  placeholder="Ví dụ: Trắng"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                />
              </FormControl>

              <HStack spacing="3">
                <Button flex="1" variant="outline" onClick={onClose}>
                  Hủy
                </Button>
                <Button flex="1" colorScheme="brand" onClick={handleSubmit}>
                  Đăng ký xe
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}