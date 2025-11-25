import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  HStack,
  VStack,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Switch,
  useToast,
  Text,
  Card,
  CardBody,
  Flex,
  Icon,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  IconButton,
} from '@chakra-ui/react';
import { SearchIcon, EditIcon, ViewIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { FaUserCircle, FaBuilding, FaHome, FaPhone, FaEnvelope } from 'react-icons/fa';
import { usersAPI } from '../../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  apartment_number: string | null;
  building: string | null;
  is_active: boolean;
  created_at: string;
}

interface NewUser {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: string;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'user',
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  
  const toast = useToast();

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.apartment_number && user.apartment_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Building filter
    if (buildingFilter) {
      filtered = filtered.filter((user) => user.building === buildingFilter);
    }

    // Role filter
    if (roleFilter) {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((user) => {
        if (statusFilter === 'active') return user.is_active;
        if (statusFilter === 'inactive') return !user.is_active;
        return true;
      });
    }

    setFilteredUsers(filtered);
  }, [searchTerm, buildingFilter, roleFilter, statusFilter, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getAll();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách người dùng',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    onViewOpen();
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    onEditOpen();
  };

  const handleCreateUser = async () => {
    // Validate required fields
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.full_name) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ các trường bắt buộc',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const userData: any = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        full_name: newUser.full_name,
        role: newUser.role,
      };

      // Add optional fields if provided
      if (newUser.phone) userData.phone = newUser.phone;

      await usersAPI.create(userData);

      toast({
        title: 'Thành công',
        description: 'Tạo người dùng mới thành công',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      setNewUser({
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'user',
      });

      fetchUsers();
      onCreateClose();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Không thể tạo người dùng mới',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await usersAPI.update(selectedUser.id, {
        full_name: selectedUser.full_name,
        phone: selectedUser.phone,
        apartment_number: selectedUser.apartment_number,
        building: selectedUser.building,
        is_active: selectedUser.is_active,
      });

      toast({
        title: 'Thành công',
        description: 'Cập nhật thông tin người dùng thành công',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchUsers();
      onEditClose();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật thông tin người dùng',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await usersAPI.delete(userToDelete.id);

      toast({
        title: 'Thành công',
        description: 'Xóa người dùng thành công',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchUsers();
      onDeleteClose();
      setUserToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Không thể xóa người dùng',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    onDeleteOpen();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'manager':
        return 'purple';
      default:
        return 'blue';
    }
  };

  const getBuildings = (): string[] => {
    const buildings = new Set(users.map((u) => u.building).filter((b): b is string => !!b));
    return Array.from(buildings);
  };

  const residentUsers = filteredUsers.filter((u) => u.role === 'user');
  const activeResidents = residentUsers.filter((u) => u.is_active).length;
  const totalResidents = residentUsers.length;

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Heading size="lg">Quản lý Người dùng</Heading>
          <HStack spacing={3}>
            <Button colorScheme="green" leftIcon={<AddIcon />} onClick={onCreateOpen}>
              Thêm người dùng
            </Button>
            <Button colorScheme="blue" onClick={fetchUsers}>
              Làm mới
            </Button>
          </HStack>
        </Flex>

        {/* Statistics Cards */}
        <HStack spacing={4}>
          <Card flex={1}>
            <CardBody>
              <HStack spacing={4}>
                <Icon as={FaUserCircle} boxSize={10} color="blue.500" />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color="gray.600">
                    Tổng số hộ dân
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {totalResidents}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          <Card flex={1}>
            <CardBody>
              <HStack spacing={4}>
                <Icon as={FaHome} boxSize={10} color="green.500" />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color="gray.600">
                    Đang sinh sống
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {activeResidents}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          <Card flex={1}>
            <CardBody>
              <HStack spacing={4}>
                <Icon as={FaBuilding} boxSize={10} color="purple.500" />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color="gray.600">
                    Số tòa nhà
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {getBuildings().length}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        </HStack>

        {/* Filters */}
        <Card>
          <CardBody>
            <HStack spacing={4}>
              <InputGroup flex={2}>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Tìm kiếm theo tên, username, email, căn hộ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Select
                placeholder="Lọc theo tòa nhà"
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                flex={1}
              >
                {getBuildings().map((building) => (
                  <option key={building} value={building}>
                    {building}
                  </option>
                ))}
              </Select>

              <Select
                placeholder="Lọc theo vai trò"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                flex={1}
              >
                <option value="user">Cư dân</option>
                <option value="manager">Quản lý</option>
                <option value="admin">Admin</option>
              </Select>

              <Select
                placeholder="Lọc theo trạng thái"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                flex={1}
              >
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </Select>

              {(searchTerm || buildingFilter || roleFilter || statusFilter) && (
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setBuildingFilter('');
                    setRoleFilter('');
                    setStatusFilter('');
                  }}
                  variant="ghost"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </HStack>
          </CardBody>
        </Card>

        {/* Users Table */}
        <Card>
          <CardBody>
            {filteredUsers.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                Không tìm thấy người dùng nào
              </Alert>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>ID</Th>
                      <Th>Họ tên</Th>
                      <Th>Username</Th>
                      <Th>Tòa nhà</Th>
                      <Th>Căn hộ</Th>
                      <Th>Vai trò</Th>
                      <Th>Trạng thái</Th>
                      <Th>Thao tác</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredUsers.map((user) => (
                      <Tr key={user.id}>
                        <Td>{user.id}</Td>
                        <Td fontWeight="medium">{user.full_name}</Td>
                        <Td>{user.username}</Td>
                        <Td>
                          {user.building || (
                            <Text color="gray.400" fontStyle="italic">
                              Chưa có
                            </Text>
                          )}
                        </Td>
                        <Td>
                          {user.apartment_number || (
                            <Text color="gray.400" fontStyle="italic">
                              Chưa có
                            </Text>
                          )}
                        </Td>
                        <Td>
                          <Badge colorScheme={getRoleBadgeColor(user.role)}>
                            {user.role === 'admin'
                              ? 'Admin'
                              : user.role === 'manager'
                              ? 'Quản lý'
                              : 'Cư dân'}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={user.is_active ? 'green' : 'gray'}>
                            {user.is_active ? 'Hoạt động' : 'Không hoạt động'}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              leftIcon={<ViewIcon />}
                              onClick={() => handleViewUser(user)}
                              colorScheme="blue"
                              variant="ghost"
                            >
                              Xem
                            </Button>
                            <Button
                              size="sm"
                              leftIcon={<EditIcon />}
                              onClick={() => handleEditUser(user)}
                              colorScheme="green"
                              variant="ghost"
                            >
                              Sửa
                            </Button>
                            <IconButton
                              aria-label="Xóa người dùng"
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => confirmDelete(user)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* View User Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Thông tin chi tiết người dùng</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedUser && (
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Icon as={FaUserCircle} boxSize={6} color="blue.500" />
                  <Box flex={1}>
                    <Text fontSize="sm" color="gray.600">
                      Họ tên
                    </Text>
                    <Text fontWeight="medium">{selectedUser.full_name}</Text>
                  </Box>
                </HStack>

                <Divider />

                <HStack>
                  <Icon as={FaEnvelope} boxSize={5} color="purple.500" />
                  <Box flex={1}>
                    <Text fontSize="sm" color="gray.600">
                      Email
                    </Text>
                    <Text fontWeight="medium">{selectedUser.email}</Text>
                  </Box>
                </HStack>

                <HStack>
                  <Icon as={FaPhone} boxSize={5} color="green.500" />
                  <Box flex={1}>
                    <Text fontSize="sm" color="gray.600">
                      Số điện thoại
                    </Text>
                    <Text fontWeight="medium">
                      {selectedUser.phone || (
                        <Text as="span" color="gray.400" fontStyle="italic">
                          Chưa cập nhật
                        </Text>
                      )}
                    </Text>
                  </Box>
                </HStack>

                <Divider />

                <HStack>
                  <Icon as={FaBuilding} boxSize={5} color="orange.500" />
                  <Box flex={1}>
                    <Text fontSize="sm" color="gray.600">
                      Tòa nhà
                    </Text>
                    <Text fontWeight="medium">
                      {selectedUser.building || (
                        <Text as="span" color="gray.400" fontStyle="italic">
                          Chưa có
                        </Text>
                      )}
                    </Text>
                  </Box>
                </HStack>

                <HStack>
                  <Icon as={FaHome} boxSize={5} color="teal.500" />
                  <Box flex={1}>
                    <Text fontSize="sm" color="gray.600">
                      Căn hộ
                    </Text>
                    <Text fontWeight="medium">
                      {selectedUser.apartment_number || (
                        <Text as="span" color="gray.400" fontStyle="italic">
                          Chưa có
                        </Text>
                      )}
                    </Text>
                  </Box>
                </HStack>

                <Divider />

                <HStack>
                  <Box flex={1}>
                    <Text fontSize="sm" color="gray.600">
                      Username
                    </Text>
                    <Text fontWeight="medium">{selectedUser.username}</Text>
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" color="gray.600">
                      Vai trò
                    </Text>
                    <Badge colorScheme={getRoleBadgeColor(selectedUser.role)}>
                      {selectedUser.role === 'admin'
                        ? 'Admin'
                        : selectedUser.role === 'manager'
                        ? 'Quản lý'
                        : 'Cư dân'}
                    </Badge>
                  </Box>
                </HStack>

                <HStack>
                  <Box flex={1}>
                    <Text fontSize="sm" color="gray.600">
                      Trạng thái
                    </Text>
                    <Badge colorScheme={selectedUser.is_active ? 'green' : 'gray'}>
                      {selectedUser.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                    </Badge>
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" color="gray.600">
                      Ngày tạo
                    </Text>
                    <Text fontWeight="medium">
                      {new Date(selectedUser.created_at).toLocaleDateString('vi-VN')}
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Chỉnh sửa thông tin người dùng</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedUser && (
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Họ tên</FormLabel>
                  <Input
                    value={selectedUser.full_name}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, full_name: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Số điện thoại</FormLabel>
                  <Input
                    value={selectedUser.phone ?? ''}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, phone: e.target.value || null })
                    }
                  />
                </FormControl>

                <HStack spacing={4} w="full">
                  <FormControl flex={1}>
                    <FormLabel>Tòa nhà</FormLabel>
                    <Input
                      value={selectedUser.building ?? ''}
                      onChange={(e) =>
                        setSelectedUser({ ...selectedUser, building: e.target.value || null })
                      }
                      placeholder="VD: A, B, C..."
                    />
                  </FormControl>

                  <FormControl flex={1}>
                    <FormLabel>Căn hộ</FormLabel>
                    <Input
                      value={selectedUser.apartment_number ?? ''}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          apartment_number: e.target.value || null,
                        })
                      }
                      placeholder="VD: 101, 102..."
                    />
                  </FormControl>
                </HStack>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Trạng thái hoạt động</FormLabel>
                  <Switch
                    isChecked={selectedUser.is_active}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, is_active: e.target.checked })
                    }
                    colorScheme="green"
                  />
                </FormControl>

                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="medium">Lưu ý:</Text>
                    <Text fontSize="sm">
                      - Không thể thay đổi username, email và vai trò
                    </Text>
                    <Text fontSize="sm">
                      - Tắt trạng thái hoạt động sẽ khóa tài khoản người dùng
                    </Text>
                  </Box>
                </Alert>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleUpdateUser}>
              Lưu thay đổi
            </Button>
            <Button onClick={onEditClose}>Hủy</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create User Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Thêm người dùng mới</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <HStack spacing={4} w="full">
                <FormControl flex={1} isRequired>
                  <FormLabel>Username</FormLabel>
                  <Input
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser({ ...newUser, username: e.target.value })
                    }
                    placeholder="username123"
                  />
                </FormControl>

                <FormControl flex={1} isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    placeholder="user@example.com"
                  />
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel>Họ tên</FormLabel>
                <Input
                  value={newUser.full_name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, full_name: e.target.value })
                  }
                  placeholder="Nguyễn Văn A"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Mật khẩu</FormLabel>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder="Mật khẩu"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Số điện thoại</FormLabel>
                <Input
                  value={newUser.phone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone: e.target.value })
                  }
                  placeholder="0901234567"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Vai trò</FormLabel>
                <Select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option value="user">Cư dân</option>
                  <option value="manager">Quản lý</option>
                  <option value="admin">Admin</option>
                </Select>
              </FormControl>

              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="medium">Lưu ý:</Text>
                  <Text fontSize="sm">
                    - Username và Email phải là duy nhất
                  </Text>
                  <Text fontSize="sm">
                    - Mật khẩu mặc định có thể thay đổi sau khi tạo
                  </Text>
                  <Text fontSize="sm">
                    - Người dùng mới sẽ được kích hoạt ngay lập tức
                  </Text>
                  <Text fontSize="sm">
                    - Tòa nhà và căn hộ sẽ được gán tự động khi thêm vào quản lý căn hộ
                  </Text>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="green" mr={3} onClick={handleCreateUser}>
              Tạo người dùng
            </Button>
            <Button onClick={onCreateClose}>Hủy</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Xóa người dùng
            </AlertDialogHeader>

            <AlertDialogBody>
              Bạn có chắc chắn muốn xóa người dùng{' '}
              <Text as="span" fontWeight="bold">
                {userToDelete?.full_name}
              </Text>{' '}
              ({userToDelete?.username})?
              <br />
              <br />
              <Text color="red.500" fontWeight="medium">
                ⚠️ Hành động này không thể hoàn tác!
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Hủy
              </Button>
              <Button colorScheme="red" onClick={handleDeleteUser} ml={3}>
                Xóa
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default UsersManagement;
