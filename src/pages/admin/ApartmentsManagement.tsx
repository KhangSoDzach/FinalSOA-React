import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Badge,
  Flex,
  Grid,
  Heading,
  IconButton,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Textarea,
  VStack,
  HStack,
  useDisclosure,
  useToast,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tooltip,
  Stat,
  StatLabel,
  StatNumber
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUserPlus,
  FiUserMinus,
  FiRefreshCw,
  FiCopy
} from 'react-icons/fi';
import api from '../../services/api';

interface Apartment {
  id: number;
  apartment_number: string;
  building: string;
  floor: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  status: 'available' | 'occupied' | 'maintenance';
  description?: string;
  resident_id?: number;
  resident?: {
    id: number;
    username: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  created_at: string;
  updated_at?: string;
}

interface ApartmentStats {
  total: number;
  occupied: number;
  available: number;
  maintenance: number;
  occupancy_rate: number;
}

const statusColors = {
  available: 'green',
  occupied: 'blue',
  maintenance: 'orange'
} as const;

const statusLabels = {
  available: 'Còn trống',
  occupied: 'Đã có người',
  maintenance: 'Bảo trì'
};

const ApartmentsManagement: React.FC = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [stats, setStats] = useState<ApartmentStats | null>(null);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [buildings, setBuildings] = useState<string[]>([]);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);

  const {
    isOpen: isFormOpen,
    onOpen: onFormOpen,
    onClose: onFormClose
  } = useDisclosure();
  
  const {
    isOpen: isRegisterOpen,
    onOpen: onRegisterOpen,
    onClose: onRegisterClose
  } = useDisclosure();
  
  const {
    isOpen: isCredentialsOpen,
    onOpen: onCredentialsOpen,
    onClose: onCredentialsClose
  } = useDisclosure();

  const toast = useToast();

  const [formData, setFormData] = useState({
    apartment_number: '',
    building: '',
    floor: 1,
    area: 0,
    bedrooms: 1,
    bathrooms: 1,
    description: ''
  });

  const [registerData, setRegisterData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    fetchApartments();
    fetchStats();
    fetchBuildings();
  }, [filterBuilding, filterStatus]);

  const fetchApartments = async () => {
    try {
      const params = new URLSearchParams();
      if (filterBuilding) params.append('building', filterBuilding);
      if (filterStatus) params.append('status', filterStatus);
      
      const response = await api.get(`/apartments?${params.toString()}`);
      setApartments(response.data);
    } catch (error) {
      console.error('Error fetching apartments:', error);
      showToast('Lỗi khi tải danh sách căn hộ', 'error');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/apartments/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await api.get('/apartments/buildings/list');
      setBuildings(response.data.buildings);
    } catch (error) {
      console.error('Error fetching buildings:', error);
    }
  };

  const showToast = (title: string, status: 'success' | 'error' | 'info' = 'success') => {
    toast({
      title,
      status,
      duration: 3000,
      isClosable: true,
      position: 'bottom-right'
    });
  };

  const handleOpenForm = (apartment?: Apartment) => {
    if (apartment) {
      setSelectedApartment(apartment);
      setFormData({
        apartment_number: apartment.apartment_number,
        building: apartment.building,
        floor: apartment.floor,
        area: apartment.area,
        bedrooms: apartment.bedrooms,
        bathrooms: apartment.bathrooms,
        description: apartment.description || ''
      });
    } else {
      setSelectedApartment(null);
      setFormData({
        apartment_number: '',
        building: '',
        floor: 1,
        area: 0,
        bedrooms: 1,
        bathrooms: 1,
        description: ''
      });
    }
    onFormOpen();
  };

  const handleOpenRegister = (apartment: Apartment) => {
    setSelectedApartment(apartment);
    setRegisterData({
      full_name: '',
      email: '',
      phone: '',
      password: ''
    });
    onRegisterOpen();
  };

  const handleSubmit = async () => {
    try {
      if (selectedApartment) {
        await api.put(`/apartments/${selectedApartment.id}`, formData);
        showToast('Cập nhật căn hộ thành công');
      } else {
        await api.post('/apartments', formData);
        showToast('Tạo căn hộ mới thành công');
      }
      onFormClose();
      fetchApartments();
      fetchStats();
      fetchBuildings();
    } catch (error: any) {
      console.error('Error saving apartment:', error);
      showToast(error.response?.data?.detail || 'Lỗi khi lưu căn hộ', 'error');
    }
  };

  const handleRegisterResident = async () => {
    if (!selectedApartment) return;

    try {
      const response = await api.post(
        `/apartments/${selectedApartment.id}/register-resident`,
        {
          apartment_id: selectedApartment.id,
          ...registerData
        }
      );
      
      setCredentials(response.data.credentials);
      onCredentialsOpen();
      onRegisterClose();
      fetchApartments();
      fetchStats();
      showToast('Đăng ký cư dân thành công');
    } catch (error: any) {
      console.error('Error registering resident:', error);
      showToast(error.response?.data?.detail || 'Lỗi khi đăng ký cư dân', 'error');
    }
  };

  const handleRemoveResident = async (apartmentId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa cư dân khỏi căn hộ này?')) {
      return;
    }

    try {
      await api.delete(`/apartments/${apartmentId}/remove-resident`);
      showToast('Xóa cư dân thành công');
      fetchApartments();
      fetchStats();
    } catch (error: any) {
      console.error('Error removing resident:', error);
      showToast(error.response?.data?.detail || 'Lỗi khi xóa cư dân', 'error');
    }
  };

  const handleDeleteApartment = async (apartmentId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa căn hộ này?')) {
      return;
    }

    try {
      await api.delete(`/apartments/${apartmentId}`);
      showToast('Xóa căn hộ thành công');
      fetchApartments();
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting apartment:', error);
      showToast(error.response?.data?.detail || 'Lỗi khi xóa căn hộ', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Đã sao chép');
  };

  return (
    <Box p={6}>
      <Flex mb={6} justify="space-between" align="center">
        <Heading size="lg">Quản lý Căn hộ</Heading>
        <HStack spacing={2}>
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={() => {
              fetchApartments();
              fetchStats();
            }}
            variant="outline"
            colorScheme="purple"
          >
            Làm mới
          </Button>
          <Button
            leftIcon={<FiPlus />}
            onClick={() => handleOpenForm()}
            colorScheme="purple"
          >
            Thêm căn hộ
          </Button>
        </HStack>
      </Flex>

      {/* Thống kê */}
      {stats && (
        <Grid templateColumns="repeat(5, 1fr)" gap={4} mb={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">Tổng số</StatLabel>
                <StatNumber fontSize="3xl">{stats.total}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">Đã có người</StatLabel>
                <StatNumber fontSize="3xl" color="blue.500">{stats.occupied}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">Còn trống</StatLabel>
                <StatNumber fontSize="3xl" color="green.500">{stats.available}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">Bảo trì</StatLabel>
                <StatNumber fontSize="3xl" color="orange.500">{stats.maintenance}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">Tỷ lệ lấp đầy</StatLabel>
                <StatNumber fontSize="3xl">{stats.occupancy_rate}%</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </Grid>
      )}

      {/* Bộ lọc */}
      <HStack spacing={4} mb={4}>
        <FormControl maxW="250px">
          <FormLabel>Tòa nhà</FormLabel>
          <Select
            value={filterBuilding}
            onChange={(e) => setFilterBuilding(e.target.value)}
          >
            <option value="">Tất cả</option>
            {buildings.map((building) => (
              <option key={building} value={building}>{building}</option>
            ))}
          </Select>
        </FormControl>
        <FormControl maxW="250px">
          <FormLabel>Trạng thái</FormLabel>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="available">Còn trống</option>
            <option value="occupied">Đã có người</option>
            <option value="maintenance">Bảo trì</option>
          </Select>
        </FormControl>
      </HStack>

      {/* Bảng danh sách */}
      <Box overflowX="auto" bg="white" borderRadius="lg" boxShadow="sm">
        <Table variant="simple">
          <Thead bg="purple.50">
            <Tr>
              <Th>Số căn hộ</Th>
              <Th>Tòa nhà</Th>
              <Th>Tầng</Th>
              <Th>Diện tích</Th>
              <Th>Phòng ngủ/WC</Th>
              <Th>Trạng thái</Th>
              <Th>Cư dân</Th>
              <Th textAlign="right">Thao tác</Th>
            </Tr>
          </Thead>
          <Tbody>
            {apartments.map((apartment) => (
              <Tr key={apartment.id} _hover={{ bg: 'purple.25' }}>
                <Td>
                  <Text fontWeight="semibold">{apartment.apartment_number}</Text>
                </Td>
                <Td>{apartment.building}</Td>
                <Td>{apartment.floor}</Td>
                <Td>{apartment.area}m²</Td>
                <Td>{apartment.bedrooms}/{apartment.bathrooms}</Td>
                <Td>
                  <Badge colorScheme={statusColors[apartment.status]}>
                    {statusLabels[apartment.status]}
                  </Badge>
                </Td>
                <Td>
                  {apartment.resident ? (
                    <Box>
                      <Text fontSize="sm">{apartment.resident.full_name}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {apartment.resident.email}
                      </Text>
                    </Box>
                  ) : (
                    <Text fontSize="sm" color="gray.500">Chưa có</Text>
                  )}
                </Td>
                <Td textAlign="right">
                  <HStack spacing={1} justify="flex-end">
                    <Tooltip label="Sửa">
                      <IconButton
                        aria-label="Edit"
                        icon={<FiEdit2 />}
                        size="sm"
                        onClick={() => handleOpenForm(apartment)}
                        colorScheme="blue"
                        variant="ghost"
                      />
                    </Tooltip>
                    {apartment.status === 'available' && (
                      <Tooltip label="Đăng ký cư dân">
                        <IconButton
                          aria-label="Register"
                          icon={<FiUserPlus />}
                          size="sm"
                          onClick={() => handleOpenRegister(apartment)}
                          colorScheme="green"
                          variant="ghost"
                        />
                      </Tooltip>
                    )}
                    {apartment.resident_id && (
                      <Tooltip label="Xóa cư dân">
                        <IconButton
                          aria-label="Remove resident"
                          icon={<FiUserMinus />}
                          size="sm"
                          onClick={() => handleRemoveResident(apartment.id)}
                          colorScheme="orange"
                          variant="ghost"
                        />
                      </Tooltip>
                    )}
                    <Tooltip label="Xóa">
                      <IconButton
                        aria-label="Delete"
                        icon={<FiTrash2 />}
                        size="sm"
                        onClick={() => handleDeleteApartment(apartment.id)}
                        colorScheme="red"
                        variant="ghost"
                      />
                    </Tooltip>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Modal thêm/sửa căn hộ */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedApartment ? 'Cập nhật căn hộ' : 'Thêm căn hộ mới'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Số căn hộ</FormLabel>
                <Input
                  value={formData.apartment_number}
                  onChange={(e) => setFormData({ ...formData, apartment_number: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Tòa nhà</FormLabel>
                <Input
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Tầng</FormLabel>
                <Input
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Diện tích (m²)</FormLabel>
                <Input
                  type="number"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Số phòng ngủ</FormLabel>
                <Input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Số phòng tắm</FormLabel>
                <Input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Mô tả</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onFormClose}>
              Hủy
            </Button>
            <Button colorScheme="purple" onClick={handleSubmit}>
              {selectedApartment ? 'Cập nhật' : 'Thêm'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal đăng ký cư dân */}
      <Modal isOpen={isRegisterOpen} onClose={onRegisterClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Đăng ký cư dân cho căn hộ {selectedApartment?.apartment_number}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="info" mb={4} borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Thông tin đăng nhập</AlertTitle>
                <AlertDescription>
                  Tài khoản sẽ được tạo với username là số căn hộ: <strong>{selectedApartment?.apartment_number}</strong>
                  <br />
                  Để trống mật khẩu để hệ thống tự động tạo.
                </AlertDescription>
              </Box>
            </Alert>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Họ tên</FormLabel>
                <Input
                  value={registerData.full_name}
                  onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Số điện thoại</FormLabel>
                <Input
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Mật khẩu (tùy chọn)</FormLabel>
                <Input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  placeholder="Để trống để tự động tạo mật khẩu"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRegisterClose}>
              Hủy
            </Button>
            <Button colorScheme="purple" onClick={handleRegisterResident}>
              Đăng ký
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal hiển thị thông tin đăng nhập */}
      <Modal
        isOpen={isCredentialsOpen}
        onClose={() => {
          onCredentialsClose();
          setCredentials(null);
        }}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Thông tin đăng nhập</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="success" mb={4} borderRadius="md">
              <AlertIcon />
              Tài khoản đã được tạo thành công!
            </Alert>
            {credentials && (
              <VStack spacing={4} align="stretch">
                <Box p={4} bg="gray.50" borderRadius="md">
                  <Text fontSize="sm" color="gray.600" mb={1}>Tên đăng nhập:</Text>
                  <Flex align="center" justify="space-between">
                    <Text fontSize="xl" fontWeight="bold">{credentials.username}</Text>
                    <IconButton
                      aria-label="Copy username"
                      icon={<FiCopy />}
                      size="sm"
                      onClick={() => copyToClipboard(credentials.username)}
                    />
                  </Flex>
                </Box>
                <Box p={4} bg="gray.50" borderRadius="md">
                  <Text fontSize="sm" color="gray.600" mb={1}>Mật khẩu:</Text>
                  <Flex align="center" justify="space-between">
                    <Text fontSize="xl" fontWeight="bold">{credentials.password}</Text>
                    <IconButton
                      aria-label="Copy password"
                      icon={<FiCopy />}
                      size="sm"
                      onClick={() => copyToClipboard(credentials.password)}
                    />
                  </Flex>
                </Box>
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  Hãy lưu lại thông tin này và gửi cho cư dân. Bạn sẽ không thể xem lại mật khẩu sau này.
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="purple"
              onClick={() => {
                onCredentialsClose();
                setCredentials(null);
              }}
            >
              Đóng
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ApartmentsManagement;
