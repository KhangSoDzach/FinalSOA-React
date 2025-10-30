import {
  Box,
  Card,
  CardBody,
  Text,
  Button,
  VStack,
  HStack,
  Avatar,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  SimpleGrid,
  Badge,
} from '@chakra-ui/react'
import { FiEdit, FiSave } from 'react-icons/fi'
import { useState } from 'react'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  unit: string
  role: string
  avatar?: string
  address: string
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  joinDate: string
}

const mockProfile: UserProfile = {
  id: 'USR-001',
  name: 'John Doe',
  email: 'john.doe@email.com',
  phone: '+84 123 456 789',
  unit: '303A',
  role: 'RESIDENT',
  address: 'SkyHome Apartment Complex, District 1, Ho Chi Minh City',
  emergencyContact: {
    name: 'Jane Doe',
    phone: '+84 987 654 321',
    relationship: 'Spouse'
  },
  joinDate: '2025-01-15'
}

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState(mockProfile)

  const handleSave = () => {
    setIsEditing(false)
    // Here you would typically save to backend
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
            Manage your personal information and preferences
          </Text>
        </Box>
        <Button
          leftIcon={isEditing ? <FiSave /> : <FiEdit />}
          colorScheme={isEditing ? 'green' : 'brand'}
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </HStack>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing="6">
        {/* Profile Card */}
        <Card>
          <CardBody textAlign="center">
            <VStack spacing="4">
              <Avatar size="2xl" name={profile.name} />
              <Box>
                <Text fontSize="xl" fontWeight="semibold">
                  {profile.name}
                </Text>
                <Text color="gray.600">{profile.email}</Text>
                <Badge colorScheme="blue" mt="2">
                  {profile.role}
                </Badge>
              </Box>
              <Button variant="outline" size="sm">
                Change Avatar
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Personal Information */}
        <Card gridColumn={{ lg: "span 2" }}>
          <CardBody>
            <Text fontSize="lg" fontWeight="semibold" mb="6">
              Personal Information
            </Text>
            
            <VStack spacing="4" align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing="4">
                <FormControl>
                  <FormLabel>Full Name</FormLabel>
                  <Input
                    value={profile.name}
                    readOnly={!isEditing}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    type="email"
                    value={profile.email}
                    readOnly={!isEditing}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Phone Number</FormLabel>
                  <Input
                    value={profile.phone}
                    readOnly={!isEditing}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Unit Number</FormLabel>
                  <Input
                    value={profile.unit}
                    readOnly
                    bg="gray.50"
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Address</FormLabel>
                <Textarea
                  value={profile.address}
                  readOnly={!isEditing}
                  onChange={(e) => setProfile({...profile, address: e.target.value})}
                />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Unit Information */}
        <Card>
          <CardBody>
            <Text fontSize="lg" fontWeight="semibold" mb="4">
              Unit Information
            </Text>
            
            <VStack spacing="3" align="stretch">
              <HStack justify="space-between">
                <Text color="gray.600">Unit:</Text>
                <Text fontWeight="medium">{profile.unit}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text color="gray.600">Role:</Text>
                <Badge colorScheme="blue">{profile.role}</Badge>
              </HStack>
              <HStack justify="space-between">
                <Text color="gray.600">Join Date:</Text>
                <Text fontWeight="medium">
                  {new Date(profile.joinDate).toLocaleDateString()}
                </Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Emergency Contact */}
        <Card gridColumn={{ lg: "span 2" }}>
          <CardBody>
            <Text fontSize="lg" fontWeight="semibold" mb="6">
              Emergency Contact
            </Text>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing="4">
              <FormControl>
                <FormLabel>Contact Name</FormLabel>
                <Input
                  value={profile.emergencyContact.name}
                  readOnly={!isEditing}
                  onChange={(e) => setProfile({
                    ...profile,
                    emergencyContact: {
                      ...profile.emergencyContact,
                      name: e.target.value
                    }
                  })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  value={profile.emergencyContact.phone}
                  readOnly={!isEditing}
                  onChange={(e) => setProfile({
                    ...profile,
                    emergencyContact: {
                      ...profile.emergencyContact,
                      phone: e.target.value
                    }
                  })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Relationship</FormLabel>
                <Input
                  value={profile.emergencyContact.relationship}
                  readOnly={!isEditing}
                  onChange={(e) => setProfile({
                    ...profile,
                    emergencyContact: {
                      ...profile.emergencyContact,
                      relationship: e.target.value
                    }
                  })}
                />
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Account Statistics */}
        <Card gridColumn={{ lg: "span 3" }}>
          <CardBody>
            <Text fontSize="lg" fontWeight="semibold" mb="6">
              Account Statistics
            </Text>
            
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing="6">
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  12
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Bills Paid This Year
                </Text>
              </VStack>
              
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  8
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Service Requests
                </Text>
              </VStack>
              
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  2
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Registered Vehicles
                </Text>
              </VStack>
              
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                  4
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Utility Bookings
                </Text>
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  )
}