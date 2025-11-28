import {
  Box,
  Card,
  CardBody,
  Text,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
  Badge,
  useToast,
  Spinner,
  Center,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';
import { FiEdit, FiSave, FiLock } from 'react-icons/fi';
import { useState, useEffect } from 'react';

// GIẢ ĐỊNH: Import authAPI (chứa getCurrentUser) và usersAPI (chứa updateCurrentUser)
import { authAPI, usersAPI } from '../services/api'; 

interface UserProfile {
  id: string; 
  name: string;
  email: string;
  phone: string;
  unit: string;
  relationship: string; 
  joinDate: string;
  balance: number;
}

// Hàm chuyển đổi dữ liệu thô từ API sang UserProfile format
const mapApiToProfile = (data: any): UserProfile => {
  const unit = data.apartment_number && data.building 
      ? `${data.apartment_number} (Tòa ${data.building})` 
      : 'N/A';
      
  const residentRelationship = data.occupier ? (data.occupier === 'owner' ? 'Chủ hộ' : 'Người thuê') : 'N/A';

  return {
      id: data.id ? data.id.toString() : 'N/A',
      name: data.full_name || data.username || 'N/A',
      email: data.email || 'N/A',
      phone: data.phone || 'N/A',
      unit: unit,
      relationship: residentRelationship,
      joinDate: data.created_at || new Date().toISOString(),
      balance: data.balance || 0,
  };
};

// ===================================
// COMPONENT ĐỔI MẬT KHẨU
// ===================================
interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ isOpen, onClose, userId }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Reset state khi mở/đóng modal
  useEffect(() => {
      if (!isOpen) {
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
      }
  }, [isOpen]);

  const handlePasswordChange = async () => {
      if (newPassword !== confirmPassword) {
          toast({
              title: 'Lỗi',
              description: 'Mật khẩu mới và xác nhận mật khẩu không khớp.',
              status: 'error',
              duration: 3000,
              isClosable: true,
          });
          return;
      }

      if (newPassword.length < 6) { 
          toast({
              title: 'Lỗi',
              description: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
              status: 'error',
              duration: 3000,
              isClosable: true,
          });
          return;
      }

      setIsLoading(true);
      try {
          // Gọi API đổi mật khẩu: POST /users/change-password
          await authAPI.changePassword({ 
              old_password: oldPassword, 
              new_password: newPassword 
          });

          toast({
              title: 'Thành công',
              description: 'Mật khẩu đã được thay đổi thành công.',
              status: 'success',
              duration: 5000,
              isClosable: true,
          });
          onClose();
      } catch (error: any) {
           const errorMessage = error.response?.data?.detail || 'Thay đổi mật khẩu thất bại.';
          toast({
              title: 'Lỗi bảo mật',
              description: errorMessage,
              status: 'error',
              duration: 5000,
              isClosable: true,
          });
      } finally {
          setIsLoading(false);
      }
  };

  return (
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent>
              <ModalHeader>Đổi Mật Khẩu</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                  <VStack spacing={4}>
                      <FormControl isRequired>
                          <FormLabel>Mật khẩu cũ</FormLabel>
                          <Input 
                              type="password" 
                              value={oldPassword} 
                              onChange={(e) => setOldPassword(e.target.value)}
                          />
                      </FormControl>

                      <FormControl isRequired>
                          <FormLabel>Mật khẩu mới</FormLabel>
                          <Input 
                              type="password" 
                              value={newPassword} 
                              onChange={(e) => setNewPassword(e.target.value)}
                          />
                      </FormControl>

                      <FormControl isRequired>
                          <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                          <Input 
                              type="password" 
                              value={confirmPassword} 
                              onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                      </FormControl>
                  </VStack>
              </ModalBody>

              <ModalFooter>
                  <Button colorScheme='blue' mr={3} onClick={handlePasswordChange} isLoading={isLoading}>
                      Xác nhận đổi
                  </Button>
                  <Button variant='ghost' onClick={onClose}>Hủy</Button>
              </ModalFooter>
          </ModalContent>
      </Modal>
  );
};


// ===================================
// MAIN PROFILE COMPONENT
// ===================================
export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOpen: isPwdModalOpen, onOpen: onPwdModalOpen, onClose: onPwdModalClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
      const loadProfile = async () => {
          setLoading(true);
          try {
              const rawData = await authAPI.getCurrentUser();
              
              if (!rawData || !rawData.id) {
                  setProfile(null);
                  throw new Error("User data not found or invalid.");
              }

              const mappedData = mapApiToProfile(rawData);
              setProfile(mappedData);
          } catch (error) {
              console.error('Error fetching profile:', error);
              toast({
                  title: 'Lỗi tải hồ sơ',
                  description: `Không thể tải hồ sơ người dùng hiện tại. Vui lòng đăng nhập lại.`,
                  status: 'error',
                  duration: 5000,
                  isClosable: true,
              });
              setProfile(null);
          } finally {
              setLoading(false);
          }
      };
      loadProfile();
  }, [toast]);

  const handleSave = async () => {
      if (!profile) return;
      
      // Chỉ gửi các trường có thể chỉnh sửa: email và phone
      const updatePayload = {
          email: profile.email,
          phone: profile.phone,
      };

      try {
          // Gọi PUT /users/me (updateCurrentUser từ usersAPI)
          const updatedRawData = await usersAPI.updateCurrentUser(updatePayload); 
          
          setIsEditing(false);
          toast({
              title: 'Hồ sơ đã lưu',
              description: 'Các thay đổi đã được lưu thành công.',
              status: 'success',
              duration: 3000,
              isClosable: true,
          });
          
          // Cập nhật lại profile state bằng dữ liệu mới nhất (updatedRawData)
          const newProfile = mapApiToProfile(updatedRawData);
          setProfile(newProfile);

      } catch (error) {
          console.error('Save failed:', error);
          toast({
              title: 'Lưu thất bại',
              description: 'Không thể lưu thay đổi hồ sơ.',
              status: 'error',
              duration: 3000,
              isClosable: true,
          });
      }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
      if (profile) {
          setProfile({ ...profile, [field]: value });
      }
  };

  if (loading) {
      return (
          <Center h="50vh">
              <Spinner size="xl" />
          </Center>
      );
  }

  if (!profile) {
      return (
          <Center h="50vh">
              <Text>Không thể tải dữ liệu hồ sơ người dùng. Vui lòng kiểm tra đăng nhập.</Text>
          </Center>
      );
  }

  return (
      <Box>
          {/* Header */}
          <HStack justify="space-between" mb="6">
              <Box>
                  <Text fontSize="2xl" fontWeight="semibold">
                      Profile Settings
                  </Text>
                  <Text color="gray.600">
                      Manage your personal information
                  </Text>
              </Box>
              <HStack spacing={4}>
                  <Button
                      leftIcon={<FiLock />}
                      colorScheme='orange'
                      onClick={onPwdModalOpen}
                  >
                      Đổi mật khẩu
                  </Button>
                  <Button
                      leftIcon={isEditing ? <FiSave /> : <FiEdit />}
                      colorScheme={isEditing ? 'green' : 'blue'}
                      onClick={isEditing ? handleSave : () => setIsEditing(true)}
                  >
                      {isEditing ? 'Save Changes' : 'Edit Profile'}
                  </Button>
              </HStack>
          </HStack>

          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing="6">
              {/* Profile/Unit Info Card */}
              <Card>
                  <CardBody>
                      <VStack spacing="3" align="stretch">
                          <HStack justify="space-between">
                              <Text color="gray.600">Full Name:</Text>
                              <Text fontWeight="medium">{profile.name}</Text>
                          </HStack>
                          
                          <HStack justify="space-between">
                              <Text color="gray.600">Unit/Address:</Text>
                              <Text fontWeight="medium">{profile.unit}</Text>
                          </HStack>

                          <HStack justify="space-between">
                              <Text color="gray.600">Vai trò cư dân:</Text>
                              <Badge colorScheme={profile.relationship === 'Chủ hộ' ? 'blue' : 'purple'}>
                                  {profile.relationship}
                              </Badge>
                          </HStack>

                          <HStack justify="space-between">
                              <Text color="gray.600">Join Date:</Text>
                              <Text fontWeight="medium">
                                  {new Date(profile.joinDate).toLocaleDateString('vi-VN')}
                              </Text>
                          </HStack>

                          <HStack justify="space-between" pt={2} borderTop="1px" borderColor="gray.200">
                              <Text color="gray.600" fontWeight="semibold">Số dư:</Text>
                              <Text fontWeight="bold" fontSize="lg" color="green.500">
                                  {profile.balance.toLocaleString('vi-VN')} VNĐ
                              </Text>
                          </HStack>
                      </VStack>
                  </CardBody>
              </Card>

              {/* Personal Information Card */}
              <Card gridColumn={{ lg: 'span 2' }}>
                  <CardBody>
                      <Text fontSize="lg" fontWeight="semibold" mb="6">
                          Personal Information
                      </Text>

                      <VStack spacing="4" align="stretch">
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing="4">
                              
                              {/* Full Name (KHÓA EDIT) */}
                              <FormControl>
                                  <FormLabel>Full Name</FormLabel>
                                  <Input
                                      value={profile.name}
                                      readOnly
                                      bg="gray.50"
                                  />
                              </FormControl>

                              {/* Email Address */}
                              <FormControl>
                                  <FormLabel>Email Address</FormLabel>
                                  <Input
                                      type="email"
                                      value={profile.email}
                                      readOnly={!isEditing}
                                      onChange={(e) => handleChange('email', e.target.value)}
                                  />
                              </FormControl>

                              {/* Phone Number */}
                              <FormControl>
                                  <FormLabel>Phone Number</FormLabel>
                                  <Input
                                      value={profile.phone}
                                      readOnly={!isEditing}
                                      onChange={(e) => handleChange('phone', e.target.value)}
                                  />
                              </FormControl>

                              {/* Unit Number (KHÓA EDIT) */}
                              <FormControl>
                                  <FormLabel>Unit Number</FormLabel>
                                  <Input
                                      value={profile.unit}
                                      readOnly
                                      bg="gray.50"
                                  />
                              </FormControl>
                          </SimpleGrid>

                          {/* Address đã được loại bỏ */}
                      </VStack>
                  </CardBody>
              </Card>
          </SimpleGrid>
          
          {/* Modal Đổi Mật khẩu */}
          <PasswordChangeModal 
              isOpen={isPwdModalOpen} 
              onClose={onPwdModalClose} 
              userId={profile?.id || "N/A"} 
          />
      </Box>
  );
}