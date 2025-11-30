import {
  Box,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Spinner,
  Center,
  Card,
  CardBody,
  Icon,
  HStack,
} from '@chakra-ui/react'
import { FiUser, FiMail, FiPhone, FiShield } from 'react-icons/fi'
import { useState, useEffect } from 'react'
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

/**
 * StaffView - READ ONLY for Receptionist
 * Hiển thị danh sách nhân viên để Lễ tân biết được ai đang làm việc gì
 */
export default function StaffView() {
  const [staff, setStaff] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const response = await usersAPI.getAll()
      // Filter all staff members (manager, accountant, receptionist)
      const staffMembers = response.filter((user: User) => 
        user.role === 'manager' || user.role === 'accountant' || user.role === 'receptionist'
      )
      setStaff(staffMembers)
    } catch (error: any) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'manager':
        return <Badge colorScheme="purple">Quản lý</Badge>
      case 'accountant':
        return <Badge colorScheme="green">Kế toán</Badge>
      case 'receptionist':
        return <Badge colorScheme="blue">Lễ tân</Badge>
      default:
        return <Badge>{role}</Badge>
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
        <Box>
          <Heading size="lg">Danh sách Nhân viên</Heading>
          <Text color="gray.600" fontSize="sm" mt={1}>
            Xem thông tin các nhân viên đang làm việc
          </Text>
        </Box>
      </Flex>

      {/* Stats Cards */}
      <HStack spacing={4} mb={6}>
        <Card flex={1}>
          <CardBody>
            <HStack>
              <Icon as={FiShield} boxSize={6} color="purple.500" />
              <Box>
                <Text fontSize="sm" color="gray.600">Quản lý</Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {staff.filter(s => s.role === 'manager').length}
                </Text>
              </Box>
            </HStack>
          </CardBody>
        </Card>
        <Card flex={1}>
          <CardBody>
            <HStack>
              <Icon as={FiUser} boxSize={6} color="green.500" />
              <Box>
                <Text fontSize="sm" color="gray.600">Kế toán</Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {staff.filter(s => s.role === 'accountant').length}
                </Text>
              </Box>
            </HStack>
          </CardBody>
        </Card>
        <Card flex={1}>
          <CardBody>
            <HStack>
              <Icon as={FiUser} boxSize={6} color="blue.500" />
              <Box>
                <Text fontSize="sm" color="gray.600">Lễ tân</Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {staff.filter(s => s.role === 'receptionist').length}
                </Text>
              </Box>
            </HStack>
          </CardBody>
        </Card>
      </HStack>

      {/* Staff Table */}
      <Box bg="white" borderRadius="lg" shadow="sm" overflow="hidden">
        {staff.length === 0 ? (
          <Center p={8}>
            <Text color="gray.500">Không có nhân viên nào</Text>
          </Center>
        ) : (
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Họ tên</Th>
                <Th>Chức vụ</Th>
                <Th>Email</Th>
                <Th>Số điện thoại</Th>
                <Th>Trạng thái</Th>
              </Tr>
            </Thead>
            <Tbody>
              {staff.map((member) => (
                <Tr key={member.id} _hover={{ bg: 'gray.50' }}>
                  <Td>
                    <Flex align="center" gap={2}>
                      <Icon as={FiUser} color="gray.500" />
                      <Box>
                        <Text fontWeight="medium">{member.full_name}</Text>
                        <Text fontSize="sm" color="gray.500">
                          @{member.username}
                        </Text>
                      </Box>
                    </Flex>
                  </Td>
                  <Td>{getRoleBadge(member.role)}</Td>
                  <Td>
                    <Flex align="center" gap={2}>
                      <Icon as={FiMail} color="gray.400" boxSize={4} />
                      <Text fontSize="sm">{member.email}</Text>
                    </Flex>
                  </Td>
                  <Td>
                    {member.phone ? (
                      <Flex align="center" gap={2}>
                        <Icon as={FiPhone} color="gray.400" boxSize={4} />
                        <Text fontSize="sm">{member.phone}</Text>
                      </Flex>
                    ) : (
                      <Text fontSize="sm" color="gray.400">-</Text>
                    )}
                  </Td>
                  <Td>
                    <Badge colorScheme={member.is_active ? 'green' : 'red'}>
                      {member.is_active ? 'Hoạt động' : 'Không hoạt động'}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>

      <Box mt={4} p={4} bg="blue.50" borderRadius="md">
        <Text fontSize="sm" color="blue.800">
          <strong>Lưu ý:</strong> Đây là chế độ xem chỉ đọc. Bạn không thể chỉnh sửa thông tin nhân viên.
          Nếu cần thay đổi, vui lòng liên hệ Quản lý.
        </Text>
      </Box>
    </Box>
  )
}
