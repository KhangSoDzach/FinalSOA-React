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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useToast,
  FormControl,
  FormLabel,
  Textarea,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tag,
  Tooltip,
  IconButton,
  Image,
} from '@chakra-ui/react'
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiFilter,
  FiEye,
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import api from '../../services/api'

interface Vehicle {
  id: number
  user_id: number
  license_plate: string
  make: string
  model: string
  color: string
  vehicle_type: 'car' | 'motorcycle' | 'bicycle'
  status: 'pending' | 'active' | 'expired' | 'rejected'
  parking_spot?: string
  license_plate_image?: string
  registered_at: string
  expires_at?: string
  approved_at?: string
  approved_by?: number
  rejection_reason?: string
  user_full_name?: string
  user_email?: string
  user_apartment?: string
  user_building?: string
  approver_name?: string
}

interface VehicleStats {
  total: number
  pending: number
  active: number
  expired: number
  rejected: number
  by_type: {
    car: number
    motorcycle: number
    bicycle: number
  }
}

export default function VehiclesManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [stats, setStats] = useState<VehicleStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [parkingSpot, setParkingSpot] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  useEffect(() => {
    fetchVehicles()
    fetchStats()
  }, [statusFilter, typeFilter, searchTerm])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('vehicle_type', typeFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await api.get(`/vehicles/admin/all?${params}`)
      setVehicles(response.data)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch vehicles',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/vehicles/admin/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleApprove = async (vehicleId: number) => {
    try {
      await api.post(`/vehicles/admin/${vehicleId}/approve`, {
        status: 'active',
        parking_spot: parkingSpot || null,
      })
      
      toast({
        title: 'Success',
        description: 'Vehicle approved successfully',
        status: 'success',
        duration: 3000,
      })
      
      onClose()
      fetchVehicles()
      fetchStats()
      setParkingSpot('')
    } catch (error) {
      console.error('Error approving vehicle:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve vehicle',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleReject = async (vehicleId: number) => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        status: 'error',
        duration: 3000,
      })
      return
    }

    try {
      await api.post(`/vehicles/admin/${vehicleId}/approve`, {
        status: 'rejected',
        rejection_reason: rejectionReason,
      })
      
      toast({
        title: 'Success',
        description: 'Vehicle rejected',
        status: 'success',
        duration: 3000,
      })
      
      onClose()
      fetchVehicles()
      fetchStats()
      setRejectionReason('')
    } catch (error) {
      console.error('Error rejecting vehicle:', error)
      toast({
        title: 'Error',
        description: 'Failed to reject vehicle',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const openVehicleDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setParkingSpot(vehicle.parking_spot || '')
    setRejectionReason(vehicle.rejection_reason || '')
    onOpen()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green'
      case 'pending':
        return 'orange'
      case 'expired':
        return 'red'
      case 'rejected':
        return 'red'
      default:
        return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return FiCheckCircle
      case 'pending':
        return FiClock
      case 'expired':
      case 'rejected':
        return FiXCircle
      default:
        return FiClock
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'car':
        return 'Ô tô'
      case 'motorcycle':
        return 'Xe máy'
      case 'bicycle':
        return 'Xe đạp'
      default:
        return type
    }
  }

  return (
    <Box>
      {/* Header */}
      <Flex mb="6" align="center">
        <Box>
          <Text fontSize="2xl" fontWeight="semibold">
            Quản Lý Phương Tiện
          </Text>
          <Text color="gray.600">
            Xác nhận và quản lý xe đã đăng ký của cư dân
          </Text>
        </Box>
      </Flex>

      {/* Stats Cards */}
      {stats && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing="4" mb="6">
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Tổng số xe</StatLabel>
                <StatNumber>{stats.total}</StatNumber>
                <StatHelpText>Tất cả phương tiện</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Chờ xác nhận</StatLabel>
                <StatNumber color="orange.500">{stats.pending}</StatNumber>
                <StatHelpText>Cần phê duyệt</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Đã xác nhận</StatLabel>
                <StatNumber color="green.500">{stats.active}</StatNumber>
                <StatHelpText>Đang hoạt động</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Hết hạn</StatLabel>
                <StatNumber color="red.500">{stats.expired}</StatNumber>
                <StatHelpText>Cần gia hạn</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Bị từ chối</StatLabel>
                <StatNumber color="red.500">{stats.rejected}</StatNumber>
                <StatHelpText>Không được phê duyệt</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Filters */}
      <Card mb="6">
        <CardBody>
          <HStack spacing="4">
            <HStack flex="1">
              <Icon as={FiSearch} color="gray.400" />
              <Input
                placeholder="Tìm theo biển số, hãng xe, tên cư dân..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </HStack>

            <Select
              w="200px"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Trạng thái"
            >
              <option value="pending">Chờ xác nhận</option>
              <option value="active">Đã xác nhận</option>
              <option value="expired">Hết hạn</option>
              <option value="rejected">Bị từ chối</option>
            </Select>

            <Select
              w="200px"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              placeholder="Loại xe"
            >
              <option value="car">Ô tô</option>
              <option value="motorcycle">Xe máy</option>
              <option value="bicycle">Xe đạp</option>
            </Select>

            <Button
              leftIcon={<FiFilter />}
              variant="outline"
              onClick={() => {
                setStatusFilter('')
                setTypeFilter('')
                setSearchTerm('')
              }}
            >
              Xóa lọc
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Biển số</Th>
                <Th>Loại xe</Th>
                <Th>Thông tin xe</Th>
                <Th>Chủ xe</Th>
                <Th>Căn hộ</Th>
                <Th>Vị trí đỗ</Th>
                <Th>Trạng thái</Th>
                <Th>Ngày đăng ký</Th>
                <Th>Thao tác</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={9} textAlign="center">
                    Đang tải...
                  </Td>
                </Tr>
              ) : vehicles.length === 0 ? (
                <Tr>
                  <Td colSpan={9} textAlign="center">
                    Không có dữ liệu
                  </Td>
                </Tr>
              ) : (
                vehicles.map((vehicle) => (
                  <Tr key={vehicle.id}>
                    <Td>
                      {vehicle.license_plate_image ? (
                        <Image
                          src={`http://localhost:8000${vehicle.license_plate_image}`}
                          alt={`Biển số ${vehicle.license_plate}`}
                          height="60px"
                          objectFit="contain"
                          borderRadius="md"
                          border="2px solid"
                          borderColor="gray.200"
                        />
                      ) : (
                        <Text fontWeight="bold">{vehicle.license_plate}</Text>
                      )}
                    </Td>
                    <Td>
                      <Tag colorScheme="blue">{getTypeLabel(vehicle.vehicle_type)}</Tag>
                    </Td>
                    <Td>
                      <VStack align="start" spacing="0">
                        <Text fontSize="sm" fontWeight="medium">
                          {vehicle.make} {vehicle.model}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Màu: {vehicle.color}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing="0">
                        <Text fontSize="sm">{vehicle.user_full_name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {vehicle.user_email}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {vehicle.user_building} - {vehicle.user_apartment}
                      </Text>
                    </Td>
                    <Td>
                      {vehicle.parking_spot ? (
                        <Badge colorScheme="purple">{vehicle.parking_spot}</Badge>
                      ) : (
                        <Text fontSize="sm" color="gray.400">
                          Chưa gán
                        </Text>
                      )}
                    </Td>
                    <Td>
                      <HStack>
                        <Icon
                          as={getStatusIcon(vehicle.status)}
                          color={`${getStatusColor(vehicle.status)}.500`}
                        />
                        <Badge colorScheme={getStatusColor(vehicle.status)}>
                          {vehicle.status === 'pending' && 'Chờ xác nhận'}
                          {vehicle.status === 'active' && 'Active'}
                          {vehicle.status === 'expired' && 'Hết hạn'}
                          {vehicle.status === 'rejected' && 'Bị từ chối'}
                        </Badge>
                      </HStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {new Date(vehicle.registered_at).toLocaleDateString('vi-VN')}
                      </Text>
                    </Td>
                    <Td>
                      <Tooltip label="Xem chi tiết">
                        <IconButton
                          aria-label="View details"
                          icon={<FiEye />}
                          size="sm"
                          variant="ghost"
                          onClick={() => openVehicleDetails(vehicle)}
                        />
                      </Tooltip>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Vehicle Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Chi tiết phương tiện</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedVehicle && (
              <VStack spacing="4" align="stretch">
                {/* License Plate Image */}
                {selectedVehicle.license_plate_image && (
                  <Card variant="outline">
                    <CardBody>
                      <VStack spacing={2}>
                        <Text fontSize="sm" color="gray.500" fontWeight="bold">
                          Biển số xe
                        </Text>
                        <Image
                          src={`http://localhost:8000${selectedVehicle.license_plate_image}`}
                          alt={`Biển số ${selectedVehicle.license_plate}`}
                          maxW="400px"
                          objectFit="contain"
                          borderRadius="md"
                          border="2px solid"
                          borderColor="gray.200"
                        />
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {/* Vehicle Info */}
                <Card variant="outline">
                  <CardBody>
                    <SimpleGrid columns={2} spacing="4">
                      <Box>
                        <Text fontSize="sm" color="gray.500">
                          Trạng thái
                        </Text>
                        <Badge colorScheme={getStatusColor(selectedVehicle.status)} fontSize="md">
                          {selectedVehicle.status === 'pending' && 'Chờ xác nhận'}
                          {selectedVehicle.status === 'active' && 'Active'}
                          {selectedVehicle.status === 'expired' && 'Hết hạn'}
                          {selectedVehicle.status === 'rejected' && 'Bị từ chối'}
                        </Badge>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">
                          Loại xe
                        </Text>
                        <Text>{getTypeLabel(selectedVehicle.vehicle_type)}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">
                          Loại xe
                        </Text>
                        <Text>{getTypeLabel(selectedVehicle.vehicle_type)}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">
                          Màu sắc
                        </Text>
                        <Text>{selectedVehicle.color}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">
                          Hãng xe
                        </Text>
                        <Text>{selectedVehicle.make}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">
                          Dòng xe
                        </Text>
                        <Text>{selectedVehicle.model}</Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Owner Info */}
                <Card variant="outline">
                  <CardBody>
                    <Text fontWeight="semibold" mb="3">
                      Thông tin chủ xe
                    </Text>
                    <SimpleGrid columns={2} spacing="4">
                      <Box>
                        <Text fontSize="sm" color="gray.500">
                          Họ tên
                        </Text>
                        <Text>{selectedVehicle.user_full_name}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">
                          Email
                        </Text>
                        <Text>{selectedVehicle.user_email}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">
                          Tòa nhà
                        </Text>
                        <Text>{selectedVehicle.user_building}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">
                          Căn hộ
                        </Text>
                        <Text>{selectedVehicle.user_apartment}</Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Parking Spot (for approval) */}
                {selectedVehicle.status === 'pending' && (
                  <FormControl>
                    <FormLabel>Vị trí đỗ xe (tùy chọn)</FormLabel>
                    <Input
                      placeholder="Ví dụ: P1-23, M1-05"
                      value={parkingSpot}
                      onChange={(e) => setParkingSpot(e.target.value)}
                    />
                  </FormControl>
                )}

                {/* Rejection Reason */}
                {selectedVehicle.status === 'pending' && (
                  <FormControl>
                    <FormLabel>Lý do từ chối (nếu từ chối)</FormLabel>
                    <Textarea
                      placeholder="Nhập lý do từ chối..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </FormControl>
                )}

                {/* Show rejection reason if rejected */}
                {selectedVehicle.status === 'rejected' && selectedVehicle.rejection_reason && (
                  <Card variant="outline" borderColor="red.200" bg="red.50">
                    <CardBody>
                      <Text fontSize="sm" color="gray.500" mb="1">
                        Lý do từ chối
                      </Text>
                      <Text color="red.700">{selectedVehicle.rejection_reason}</Text>
                    </CardBody>
                  </Card>
                )}

                {/* Show approval info if approved */}
                {selectedVehicle.status === 'active' && (
                  <Card variant="outline" borderColor="green.200" bg="green.50">
                    <CardBody>
                      <SimpleGrid columns={2} spacing="4">
                        {selectedVehicle.parking_spot && (
                          <Box>
                            <Text fontSize="sm" color="gray.500">
                              Vị trí đỗ xe
                            </Text>
                            <Badge colorScheme="purple" fontSize="md">
                              {selectedVehicle.parking_spot}
                            </Badge>
                          </Box>
                        )}
                        {selectedVehicle.approved_at && (
                          <Box>
                            <Text fontSize="sm" color="gray.500">
                              Ngày phê duyệt
                            </Text>
                            <Text>
                              {new Date(selectedVehicle.approved_at).toLocaleDateString('vi-VN')}
                            </Text>
                          </Box>
                        )}
                        {selectedVehicle.expires_at && (
                          <Box>
                            <Text fontSize="sm" color="gray.500">
                              Ngày hết hạn
                            </Text>
                            <Text>
                              {new Date(selectedVehicle.expires_at).toLocaleDateString('vi-VN')}
                            </Text>
                          </Box>
                        )}
                        {selectedVehicle.approver_name && (
                          <Box>
                            <Text fontSize="sm" color="gray.500">
                              Người phê duyệt
                            </Text>
                            <Text>{selectedVehicle.approver_name}</Text>
                          </Box>
                        )}
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <HStack spacing="3">
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
              {selectedVehicle?.status === 'pending' && (
                <>
                  <Button
                    colorScheme="red"
                    onClick={() => handleReject(selectedVehicle.id)}
                    isDisabled={!rejectionReason.trim()}
                  >
                    Từ chối
                  </Button>
                  <Button
                    colorScheme="green"
                    onClick={() => handleApprove(selectedVehicle.id)}
                  >
                    Phê duyệt
                  </Button>
                </>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
