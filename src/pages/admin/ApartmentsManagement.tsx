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
  Tooltip,
  Stat,
  StatLabel,
  StatNumber,
  RadioGroup,
  Radio,
  Stack,
  Checkbox
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUserPlus,
  FiUserMinus,
  FiRefreshCw
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
  monthly_fee: number;
  status: 'available' | 'occupied' | 'maintenance';
  description?: string;
  resident_id?: number;
  resident?: {
    id: number;
    username: string;
    full_name: string;
    email: string;
    phone?: string;
    occupier?: string;
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

interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  apartment_number?: string;
  building?: string;
  occupier?: string;
}

const ApartmentsManagement: React.FC = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [stats, setStats] = useState<ApartmentStats | null>(null);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [buildings, setBuildings] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignData, setAssignData] = useState({
    user_id: 0,
    occupier_type: 'owner'
  });

  const {
    isOpen: isFormOpen,
    onOpen: onFormOpen,
    onClose: onFormClose
  } = useDisclosure();
  
  const {
    isOpen: isAssignOpen,
    onOpen: onAssignOpen,
    onClose: onAssignClose
  } = useDisclosure();

  const toast = useToast();

  const [formData, setFormData] = useState({
    apartment_number: '',
    building: '',
    floor: 1,
    area: 0,
    bedrooms: 1,
    bathrooms: 1,
    monthly_fee: 0,
    description: '',
    is_maintenance: false
  });

  useEffect(() => {
    fetchApartments();
    fetchStats();
    fetchBuildings();
    fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
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
        monthly_fee: apartment.monthly_fee || 0,
        description: apartment.description || '',
        is_maintenance: apartment.status === 'maintenance'
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
        monthly_fee: 0,
        description: '',
        is_maintenance: false
      });
    }
    onFormOpen();
  };

  const handleOpenAssign = (apartment: Apartment) => {
    setSelectedApartment(apartment);
    setAssignData({
      user_id: 0,
      occupier_type: 'owner'
    });
    onAssignOpen();
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

  const handleAssignUser = async () => {
    if (!selectedApartment || !assignData.user_id) {
      showToast('Vui lòng chọn người dùng', 'error');
      return;
    }

    try {
      await api.post(
        `/apartments/${selectedApartment.id}/assign-user`,
        {
          user_id: assignData.user_id,
          occupier_type: assignData.occupier_type
        }
      );
      
      onAssignClose();
      fetchApartments();
      fetchStats();
      fetchUsers();
      showToast('Gán người dùng thành công');
      // Reset assignData
      setAssignData({
        user_id: 0,
        occupier_type: 'owner'
      });
    } catch (error: any) {
      console.error('Error assigning user:', error);
      showToast(error.response?.data?.detail || 'Lỗi khi gán người dùng', 'error');
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
      fetchUsers(); // Refresh danh sách users để cập nhật users chưa có căn hộ
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
              <Th>Phí/tháng</Th>
              <Th>Trạng thái</Th>
              <Th>Cư dân</Th>
              <Th>Loại</Th>
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
                  {apartment.resident?.occupier === 'owner' ? (
                    <Text color="gray.400" fontSize="sm">Chủ hộ</Text>
                  ) : apartment.monthly_fee > 0 ? (
                    <Text fontWeight="medium" color="teal.600">
                      {apartment.monthly_fee.toLocaleString()} VND
                    </Text>
                  ) : (
                    <Text color="gray.400" fontSize="sm">N/A</Text>
                  )}
                </Td>
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
                <Td>
                  {apartment.resident?.occupier ? (
                    <Badge colorScheme={apartment.resident.occupier === 'owner' ? 'purple' : 'orange'}>
                      {apartment.resident.occupier === 'owner' ? 'Chủ hộ' : 'Người thuê'}
                    </Badge>
                  ) : (
                    <Text fontSize="sm" color="gray.400">N/A</Text>
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
                      <Tooltip label="Gán cư dân">
                        <IconButton
                          aria-label="Assign User"
                          icon={<FiUserPlus />}
                          size="sm"
                          onClick={() => handleOpenAssign(apartment)}
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
                <FormLabel>Phí quản lý hàng tháng (VND)</FormLabel>
                <Input
                  type="number"
                  value={formData.monthly_fee}
                  onChange={(e) => setFormData({ ...formData, monthly_fee: parseFloat(e.target.value) })}
                  placeholder="Chỉ áp dụng cho người thuê (renter)"
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
              <FormControl>
                <Checkbox
                  isChecked={formData.is_maintenance}
                  onChange={(e) => setFormData({ ...formData, is_maintenance: e.target.checked })}
                  colorScheme="orange"
                >
                  Đang bảo trì
                </Checkbox>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Khi chọn, căn hộ sẽ chuyển sang trạng thái bảo trì
                </Text>
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

      {/* Modal gán cư dân */}
      <Modal isOpen={isAssignOpen} onClose={onAssignClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Gán cư dân cho căn hộ {selectedApartment?.apartment_number}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Chọn người dùng</FormLabel>
                <Select
                  value={assignData.user_id}
                  onChange={(e) => setAssignData({ ...assignData, user_id: parseInt(e.target.value) })}
                  placeholder="-- Chọn người dùng --"
                >
                  {users
                    .filter(user => !user.apartment_number) // Chỉ hiển thị users chưa có căn hộ
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} - {user.email}
                      </option>
                    ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Loại cư dân</FormLabel>
                <RadioGroup
                  value={assignData.occupier_type}
                  onChange={(value) => setAssignData({ ...assignData, occupier_type: value })}
                >
                  <Stack direction="row" spacing={5}>
                    <Radio value="owner" colorScheme="purple">
                      Chủ hộ (Owner)
                    </Radio>
                    <Radio value="renter" colorScheme="orange">
                      Người thuê (Renter)
                    </Radio>
                  </Stack>
                </RadioGroup>
                <Text fontSize="sm" color="gray.500" mt={2}>
                  * Chủ hộ không cần đóng phí quản lý hàng tháng
                  <br />
                  * Người thuê sẽ phải đóng phí quản lý: {selectedApartment?.monthly_fee.toLocaleString() || 0} VND/tháng
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAssignClose}>
              Hủy
            </Button>
            <Button colorScheme="purple" onClick={handleAssignUser}>
              Gán cư dân
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ApartmentsManagement;
