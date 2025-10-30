import {
  Box,
  Card,
  CardBody,
  Text,
  Button,
  HStack,
  VStack,
  Badge,
  Textarea,
  FormControl,
  FormLabel,
  Input,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Flex,
  Spacer,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react'
import { 
  FiPlus, 
  FiClock, 
  FiCheckCircle,
  FiStar,
  FiImage
} from 'react-icons/fi'
import { useState } from 'react'

interface Ticket {
  id: string
  title: string
  description: string
  category: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  assignedTo?: string
  rating?: number
}

const mockTickets: Ticket[] = [
  {
    id: 'TCK-001',
    title: 'Elevator noise issue',
    description: 'The elevator makes loud noises when moving between floors 2-3',
    category: 'Maintenance',
    status: 'in-progress',
    priority: 'high',
    createdAt: '2025-10-25',
    assignedTo: 'Maintenance Team'
  },
  {
    id: 'TCK-002',
    title: 'Air conditioning not working',
    description: 'AC unit in common area (floor 3) is not cooling properly',
    category: 'HVAC',
    status: 'resolved',
    priority: 'medium',
    createdAt: '2025-10-20',
    assignedTo: 'HVAC Specialist',
    rating: 5
  },
  {
    id: 'TCK-003',
    title: 'Parking space issue',
    description: 'Someone is using my assigned parking space #23',
    category: 'Security',
    status: 'open',
    priority: 'low',
    createdAt: '2025-10-28'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'blue'
    case 'in-progress': return 'orange' 
    case 'resolved': return 'green'
    case 'closed': return 'gray'
    default: return 'gray'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'red'
    case 'medium': return 'orange'
    case 'low': return 'green'
    default: return 'gray'
  }
}

export default function Tickets() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium'
  })

  const openTickets = mockTickets.filter(t => t.status === 'open' || t.status === 'in-progress')
  const closedTickets = mockTickets.filter(t => t.status === 'resolved' || t.status === 'closed')

  return (
    <Box>
      {/* Header */}
      <Flex mb="6" align="center">
        <Box>
          <Text fontSize="2xl" fontWeight="semibold">
            Support Tickets
          </Text>
          <Text color="gray.600">
            Submit feedback, complaints, or service requests
          </Text>
        </Box>
        <Spacer />
        <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={onOpen}>
          Create New Ticket
        </Button>
      </Flex>

      {/* Tickets Tabs */}
      <Tabs>
        <TabList>
          <Tab>Open Tickets ({openTickets.length})</Tab>
          <Tab>Closed Tickets ({closedTickets.length})</Tab>
        </TabList>

        <TabPanels>
          {/* Open Tickets */}
          <TabPanel p="0" pt="6">
            <VStack spacing="4" align="stretch">
              {openTickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardBody>
                    <Flex align="start">
                      <Box flex="1">
                        <HStack spacing="3" mb="2">
                          <Text fontWeight="semibold" fontSize="lg">
                            {ticket.title}
                          </Text>
                          <Badge colorScheme={getStatusColor(ticket.status)}>
                            {ticket.status.replace('-', ' ').toUpperCase()}
                          </Badge>
                          <Badge colorScheme={getPriorityColor(ticket.priority)} variant="outline">
                            {ticket.priority.toUpperCase()}
                          </Badge>
                        </HStack>
                        
                        <Text color="gray.600" mb="3">
                          {ticket.description}
                        </Text>
                        
                        <HStack spacing="4" fontSize="sm" color="gray.500">
                          <HStack>
                            <Text>ID:</Text>
                            <Text fontWeight="medium">{ticket.id}</Text>
                          </HStack>
                          <HStack>
                            <Text>Category:</Text>
                            <Text fontWeight="medium">{ticket.category}</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiClock} />
                            <Text>{new Date(ticket.createdAt).toLocaleDateString()}</Text>
                          </HStack>
                          {ticket.assignedTo && (
                            <HStack>
                              <Text>Assigned to:</Text>
                              <Text fontWeight="medium">{ticket.assignedTo}</Text>
                            </HStack>
                          )}
                        </HStack>
                      </Box>
                      
                      <VStack spacing="2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        {ticket.status === 'resolved' && !ticket.rating && (
                          <Button size="sm" colorScheme="green">
                            Rate & Close
                          </Button>
                        )}
                      </VStack>
                    </Flex>
                  </CardBody>
                </Card>
              ))}
              
              {openTickets.length === 0 && (
                <Card>
                  <CardBody textAlign="center" py="12">
                    <Icon as={FiCheckCircle} boxSize="12" color="green.400" mb="4" />
                    <Text fontSize="lg" fontWeight="semibold" mb="2">
                      No open tickets
                    </Text>
                    <Text color="gray.600">
                      All your tickets have been resolved!
                    </Text>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </TabPanel>

          {/* Closed Tickets */}
          <TabPanel p="0" pt="6">
            <VStack spacing="4" align="stretch">
              {closedTickets.map((ticket) => (
                <Card key={ticket.id} opacity="0.8">
                  <CardBody>
                    <Flex align="start">
                      <Box flex="1">
                        <HStack spacing="3" mb="2">
                          <Text fontWeight="semibold" fontSize="lg">
                            {ticket.title}
                          </Text>
                          <Badge colorScheme="green">
                            RESOLVED
                          </Badge>
                          {ticket.rating && (
                            <HStack spacing="1">
                              {[...Array(5)].map((_, i) => (
                                <Icon
                                  key={i}
                                  as={FiStar}
                                  color={i < ticket.rating! ? "yellow.400" : "gray.300"}
                                  fill={i < ticket.rating! ? "yellow.400" : "none"}
                                />
                              ))}
                            </HStack>
                          )}
                        </HStack>
                        
                        <Text color="gray.600" mb="3">
                          {ticket.description}
                        </Text>
                        
                        <HStack spacing="4" fontSize="sm" color="gray.500">
                          <HStack>
                            <Text>ID:</Text>
                            <Text fontWeight="medium">{ticket.id}</Text>
                          </HStack>
                          <HStack>
                            <Text>Category:</Text>
                            <Text fontWeight="medium">{ticket.category}</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiClock} />
                            <Text>{new Date(ticket.createdAt).toLocaleDateString()}</Text>
                          </HStack>
                        </HStack>
                      </Box>
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Create Ticket Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Ticket</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            <VStack spacing="4" align="stretch">
              <FormControl>
                <FormLabel>Title</FormLabel>
                <Input
                  placeholder="Brief description of the issue"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select
                  placeholder="Select category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="security">Security</option>
                  <option value="hvac">HVAC</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="noise">Noise Complaint</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Priority</FormLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Detailed description of the issue..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </FormControl>

              <Button leftIcon={<FiImage />} variant="outline">
                Add Photos
              </Button>

              <HStack spacing="3">
                <Button flex="1" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button flex="1" colorScheme="brand">
                  Submit Ticket
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}