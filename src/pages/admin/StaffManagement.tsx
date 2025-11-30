import {
  Box,
  Button,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Text,
  Spinner,
  Center,
} from '@chakra-ui/react'
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi'
import { useState, useEffect, useRef } from 'react'
import { usersAPI } from '../../services/api'

interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  phone?: string
}

interface FormData {
  username: string
  email: string
  full_name: string
  password: string
  role: string
  phone?: string
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null)
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'receptionist',
    phone: '',
  })
  
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const toast = useToast()

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const response = await usersAPI.getAll()
      // Filter only staff members (accountant and receptionist)
      const staffMembers = response.filter((user: User) => 
        user.role === 'accountant' || user.role === 'receptionist'
      )
      setStaff(staffMembers)
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Không thể tải danh sách nhân viên',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setSelectedStaff(null)
    setFormData({
      username: '',
      email: '',
      full_name: '',
      password: '',
      role: 'receptionist',
      phone: '',
    })
    onOpen()
  }

  const openEditModal = (staffMember: User) => {
    setSelectedStaff(staffMember)
    setFormData({
      username: staffMember.username,
      email: staffMember.email,
      full_name: staffMember.full_name,
      password: '', // Don't populate password
      role: staffMember.role,
      phone: staffMember.phone || '',
    })
    onOpen()
  }

  const handleSubmit = async () => {
    try {
      if (selectedStaff) {
        // Update existing staff
        const updateData: any = {
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone,
        }
        
        await usersAPI.update(selectedStaff.id, updateData)
        toast({
          title: 'Thành công',
          description: 'Cập nhật nhân viên thành công',
          status: 'success',
          duration: 3000,
        })
      } else {
        // Create new staff
        const createData = {
          username: formData.username,
          email: formData.email,
          full_name: formData.full_name,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
          // Staff members don't need apartment info - use undefined instead of null
          occupier: 'owner', // Default value
          balance: 0,
        }
        
        await usersAPI.create(createData)
        toast({
          title: 'Thành công',
          description: 'Tạo nhân viên mới thành công',
          status: 'success',
          duration: 3000,
        })
      }
      
      onClose()
      fetchStaff()
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Không thể lưu thông tin nhân viên',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedStaff) return
    
    try {
      await usersAPI.delete(selectedStaff.id)
      toast({
        title: 'Thành công',
        description: 'Xóa nhân viên thành công',
        status: 'success',
        duration: 3000,
      })
      onDeleteClose()
      fetchStaff()
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Không thể xóa nhân viên',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'accountant':
        return <Badge colorScheme="green">Kế toán</Badge>
      case 'receptionist':
        return <Badge colorScheme="blue">Lễ tân</Badge>
      default:
        return <Badge colorScheme="gray">{role}</Badge>
    }
  }

  if (loading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="purple.500" />
      </Center>
    )
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="purple.700">Quản lý Nhân viên</Heading>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="purple"
          onClick={openCreateModal}
        >
          Thêm nhân viên
        </Button>
      </Flex>

      <Box bg="white" borderRadius="lg" shadow="sm" overflow="hidden">
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>ID</Th>
              <Th>Tên đăng nhập</Th>
              <Th>Họ tên</Th>
              <Th>Email</Th>
              <Th>Số điện thoại</Th>
              <Th>Chức vụ</Th>
              <Th>Trạng thái</Th>
              <Th>Thao tác</Th>
            </Tr>
          </Thead>
          <Tbody>
            {staff.length === 0 ? (
              <Tr>
                <Td colSpan={8} textAlign="center" py={8}>
                  <Text color="gray.500">Chưa có nhân viên nào</Text>
                </Td>
              </Tr>
            ) : (
              staff.map((member) => (
                <Tr key={member.id}>
                  <Td>{member.id}</Td>
                  <Td fontWeight="medium">{member.username}</Td>
                  <Td>{member.full_name}</Td>
                  <Td>{member.email}</Td>
                  <Td>{member.phone || '-'}</Td>
                  <Td>{getRoleBadge(member.role)}</Td>
                  <Td>
                    <Badge colorScheme={member.is_active ? 'green' : 'red'}>
                      {member.is_active ? 'Hoạt động' : 'Khóa'}
                    </Badge>
                  </Td>
                  <Td>
                    <Flex gap={2}>
                      <IconButton
                        aria-label="Edit"
                        icon={<FiEdit2 />}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        onClick={() => openEditModal(member)}
                      />
                      <IconButton
                        aria-label="Delete"
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => {
                          setSelectedStaff(member)
                          onDeleteOpen()
                        }}
                      />
                    </Flex>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedStaff ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4} isRequired>
              <FormLabel>Tên đăng nhập</FormLabel>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={!!selectedStaff}
                placeholder="Nhập tên đăng nhập"
              />
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel>Họ tên</FormLabel>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nhập họ tên"
              />
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Nhập email"
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Số điện thoại</FormLabel>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Nhập số điện thoại"
              />
            </FormControl>

            {!selectedStaff && (
              <FormControl mb={4} isRequired>
                <FormLabel>Mật khẩu</FormLabel>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                />
              </FormControl>
            )}

            <FormControl mb={4} isRequired>
              <FormLabel>Chức vụ</FormLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="receptionist">Lễ tân</option>
                <option value="accountant">Kế toán</option>
              </Select>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Hủy
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleSubmit}
              isDisabled={
                !formData.username ||
                !formData.full_name ||
                !formData.email ||
                !formData.role ||
                (!selectedStaff && !formData.password)
              }
            >
              {selectedStaff ? 'Cập nhật' : 'Tạo mới'}
            </Button>
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
              Xóa nhân viên
            </AlertDialogHeader>

            <AlertDialogBody>
              Bạn có chắc chắn muốn xóa nhân viên <strong>{selectedStaff?.full_name}</strong>? 
              Hành động này không thể hoàn tác.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Hủy
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Xóa
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}
