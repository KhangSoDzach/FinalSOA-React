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
} from '@chakra-ui/react'
import { 
  FiPlus, 
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiEdit,
  FiTrash
} from 'react-icons/fi'
import { useState } from 'react'

interface Vehicle {
  id: string
  licensePlate: string
  make: string
  model: string
  color: string
  type: 'car' | 'motorcycle' | 'bicycle'
  status: 'active' | 'pending' | 'expired'
  registeredAt: string
  expiresAt: string
  parkingSpot?: string
}

const mockVehicles: Vehicle[] = [
  {
    id: 'VH-001',
    licensePlate: '30A-123.45',
    make: 'Toyota',
    model: 'Camry',
    color: 'White',
    type: 'car',
    status: 'active',
    registeredAt: '2025-01-15',
    expiresAt: '2026-01-15',
    parkingSpot: 'P1-23'
  },
  {
    id: 'VH-002',
    licensePlate: '30A-678.90',
    make: 'Honda',
    model: 'Wave',
    color: 'Red',
    type: 'motorcycle',
    status: 'active',
    registeredAt: '2025-03-10',
    expiresAt: '2026-03-10',
    parkingSpot: 'M1-05'
  },
  {
    id: 'VH-003',
    licensePlate: '30A-999.88',
    make: 'Ford',
    model: 'Focus',
    color: 'Blue',
    type: 'car',
    status: 'pending',
    registeredAt: '2025-10-28',
    expiresAt: '2026-10-28'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'green'
    case 'pending': return 'orange'
    case 'expired': return 'red'
    default: return 'gray'
  }
}

const getTypeIcon = (_type: string) => {
  return FiTruck // Simplified for now
}

export default function Vehicles() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [formData, setFormData] = useState({
    licensePlate: '',
    make: '',
    model: '',
    color: '',
    type: 'car'
  })

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
        {mockVehicles.map((vehicle) => (
          <Card key={vehicle.id}>
            <CardBody>
              <VStack spacing="4" align="stretch">
                {/* Vehicle Icon/Image */}
                <Box textAlign="center" py="4" bg="gray.50" borderRadius="md">
                  <Icon as={getTypeIcon(vehicle.type)} boxSize="12" color="gray.400" />
                </Box>
                
                {/* Vehicle Info */}
                <VStack spacing="2" align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="bold" fontSize="lg">
                      {vehicle.licensePlate}
                    </Text>
                    <Badge colorScheme={getStatusColor(vehicle.status)}>
                      {vehicle.status.toUpperCase()}
                    </Badge>
                  </HStack>
                  
                  <Text color="gray.600">
                    {vehicle.make} {vehicle.model}
                  </Text>
                  
                  <HStack justify="space-between" fontSize="sm" color="gray.500">
                    <Text>Color: {vehicle.color}</Text>
                    <Text>Type: {vehicle.type}</Text>
                  </HStack>
                  
                  {vehicle.parkingSpot && (
                    <HStack justify="space-between" fontSize="sm">
                      <Text color="gray.500">Parking Spot:</Text>
                      <Text fontWeight="medium" color="brand.500">
                        {vehicle.parkingSpot}
                      </Text>
                    </HStack>
                  )}
                  
                  <HStack justify="space-between" fontSize="sm" color="gray.500">
                    <Text>Expires:</Text>
                    <Text>{new Date(vehicle.expiresAt).toLocaleDateString()}</Text>
                  </HStack>
                </VStack>
                
                {/* Action Buttons */}
                <HStack spacing="2">
                  <Button size="sm" variant="outline" leftIcon={<FiEdit />} flex="1">
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" colorScheme="red" leftIcon={<FiTrash />}>
                    Remove
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
        
        {/* Add New Vehicle Card */}
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
                Register New Vehicle
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Registration Guidelines */}
      <Card mt="8">
        <CardBody>
          <Text fontSize="lg" fontWeight="semibold" mb="4">
            Registration Guidelines
          </Text>
          <VStack spacing="3" align="stretch">
            <HStack>
              <Icon as={FiCheckCircle} color="green.500" />
              <Text>Each unit can register up to 2 cars and 2 motorcycles</Text>
            </HStack>
            <HStack>
              <Icon as={FiCheckCircle} color="green.500" />
              <Text>Vehicle registration is valid for 1 year</Text>
            </HStack>
            <HStack>
              <Icon as={FiCheckCircle} color="green.500" />
              <Text>Parking spots are assigned based on availability</Text>
            </HStack>
            <HStack>
              <Icon as={FiXCircle} color="red.500" />
              <Text>Unregistered vehicles will be towed</Text>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Register Vehicle Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Register New Vehicle</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            <VStack spacing="4" align="stretch">
              <FormControl>
                <FormLabel>License Plate</FormLabel>
                <Input
                  placeholder="e.g., 30A-123.45"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({...formData, licensePlate: e.target.value})}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Vehicle Type</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="bicycle">Bicycle</option>
                </Select>
              </FormControl>

              <HStack spacing="4">
                <FormControl>
                  <FormLabel>Make</FormLabel>
                  <Input
                    placeholder="e.g., Toyota"
                    value={formData.make}
                    onChange={(e) => setFormData({...formData, make: e.target.value})}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Model</FormLabel>
                  <Input
                    placeholder="e.g., Camry"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Color</FormLabel>
                <Input
                  placeholder="e.g., White"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                />
              </FormControl>

              <HStack spacing="3">
                <Button flex="1" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button flex="1" colorScheme="brand">
                  Register Vehicle
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}