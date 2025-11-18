import {
  Box,
  Card,
  CardBody,
  Text,
  Button,
  HStack,
  VStack,
  Badge,
  useDisclosure,
  Flex,
  Spacer,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalFooter, 
  ModalBody, 
  FormControl, 
  FormLabel, 
  Input, 
  Textarea, 
  Select, 
  useToast,
} from '@chakra-ui/react';
import { FiPlus, FiClock, FiCheckCircle, FiX, FiUser } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { ticketsAPI } from '../services/api'; 

// --- INTERFACES ---

interface UserBase {
    id: number;
    username: string;
}

interface TicketResponse { 
  id: number;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string; // Tồn tại trong SQLModel
  
  user?: UserBase; 
  assigned_user?: UserBase;
  resolved_by_user?: UserBase;
  
  assigned_to?: number; 
  resolved_at?: string;
  resolution_notes?: string;
}

interface TicketDetailResponse extends TicketResponse {} 

interface TicketFormData {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// --- CONSTANTS ---
// Đảm bảo các chuỗi này khớp với giá trị Enum trong Python (thường là chữ thường hoặc chữ hoa nhất quán)
const categories = ['maintenance', 'complaint', 'suggestion', 'facility', 'security', 'noise', 'cleaning', 'other'];
const displayCategories = categories.map(c => c.toUpperCase()); // Dùng để hiển thị
const priorities = ['low', 'normal', 'high', 'urgent'];

// --- COLOR HELPERS (Giữ nguyên) ---

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'blue';
    case 'assigned':
    case 'in_progress': return 'orange';
    case 'resolved': return 'green';
    case 'closed': return 'gray';
    case 'cancelled': return 'red';
    default: return 'gray';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
    case 'high': return 'red';
    case 'normal': return 'orange';
    case 'low': return 'green';
    default: return 'gray';
  }
};

// --- COMPONENT ---

export default function Tickets() {
  const { 
    isOpen: isCreateOpen, 
    onOpen: onCreateOpen, 
    onClose: onCreateClose 
  } = useDisclosure();
  const { 
    isOpen: isDetailOpen, 
    onOpen: onDetailOpen, 
    onClose: onDetailClose 
  } = useDisclosure();
  
  // Khởi tạo form với giá trị Enum chữ thường hợp lệ
  const initialFormData: TicketFormData = {
    title: '',
    description: '',
    category: categories[0] || 'maintenance', // Đảm bảo giá trị default là chữ thường
    priority: 'normal',
  };

  const [openTickets, setOpenTickets] = useState<TicketResponse[]>([]);
  const [closedTickets, setClosedTickets] = useState<TicketResponse[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetailResponse | null>(null);
  const [formData, setFormData] = useState<TicketFormData>(initialFormData);
  const toast = useToast();

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const fetchTickets = async () => {
    try {
      const open = await ticketsAPI.getMyTickets('open');
      const assigned = await ticketsAPI.getMyTickets('assigned');
      const inProgress = await ticketsAPI.getMyTickets('in_progress');
      setOpenTickets([...open, ...assigned, ...inProgress]);

      const resolved = await ticketsAPI.getMyTickets('resolved');
      const closed = await ticketsAPI.getMyTickets('closed');
      setClosedTickets([...resolved, ...closed]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({ title: 'Error loading tickets.', status: 'error', duration: 3000, isClosable: true });
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async () => {
    if (!formData.title || !formData.description) {
        toast({ title: 'Please enter title and description.', status: 'warning', duration: 3000, isClosable: true });
        return;
    }
    
    try {
      // Gửi formData đi (category và priority là chuỗi thường)
      await ticketsAPI.create(formData); 
      
      onCreateClose();
      resetForm(); 
      fetchTickets(); 
      
      toast({ title: 'Ticket created successfully!', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({ title: 'Failed to create ticket. Check console for details.', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleViewDetails = async (ticketId: number) => {
    try {
      const detail = await ticketsAPI.getTicketDetails(ticketId); 
      setSelectedTicket(detail);
      onDetailOpen();
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast({ title: 'Failed to load ticket details.', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const TicketCard = ({ ticket }: { ticket: TicketResponse }) => (
    <Card key={ticket.id}>
      <CardBody>
        <Flex align="start">
          <Box flex="1">
            <HStack spacing="3" mb="2">
              <Text fontWeight="semibold" fontSize="lg">{ticket.title}</Text>
              <Badge colorScheme={getStatusColor(ticket.status)}>
                {ticket.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge colorScheme={getPriorityColor(ticket.priority)} variant="outline">
                {ticket.priority.toUpperCase()}
              </Badge>
            </HStack>

            <Text color="gray.600" mb="3">{ticket.description}</Text>

            <HStack spacing="4" fontSize="sm" color="gray.500">
              <HStack><Text>ID:</Text><Text fontWeight="medium">{ticket.id}</Text></HStack>
              <HStack><Text>Category:</Text><Text fontWeight="medium">{ticket.category.toUpperCase()}</Text></HStack>
              <HStack><Icon as={FiClock} /><Text>{new Date(ticket.created_at).toLocaleDateString()}</Text></HStack>
              {ticket.assigned_to && (
                <HStack><Icon as={FiUser} /><Text>Assigned ID:</Text><Text fontWeight="medium">{ticket.assigned_to}</Text></HStack>
              )}
            </HStack>
          </Box>

          <VStack spacing="2" pl="4">
            <Button size="sm" variant="outline" onClick={() => handleViewDetails(ticket.id)}>
              View Details
            </Button>
          </VStack>
        </Flex>
      </CardBody>
    </Card>
  );

  return (
    <Box>
      <Flex mb="6" align="center">
        <Box>
          <Text fontSize="2xl" fontWeight="semibold">Support Tickets</Text>
          <Text color="gray.600">Submit feedback, complaints, or service requests</Text>
        </Box>
        <Spacer />
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onCreateOpen}>
          Create New Ticket
        </Button>
      </Flex>

      <Tabs>
        <TabList>
          <Tab>Open/Active Tickets ({openTickets.length})</Tab>
          <Tab>Resolved/Closed Tickets ({closedTickets.length})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel p="0" pt="6">
            <VStack spacing="4" align="stretch">
              {openTickets.length > 0 ? (
                openTickets.map((ticket) => (<TicketCard key={ticket.id} ticket={ticket} />))
              ) : (
                <Card><CardBody textAlign="center" py="12">
                    <Icon as={FiCheckCircle} boxSize="12" color="green.400" mb="4" />
                    <Text fontSize="lg" fontWeight="semibold" mb="2">No open tickets</Text>
                    <Text color="gray.600">All active tickets are displayed here.</Text>
                </CardBody></Card>
              )}
            </VStack>
          </TabPanel>

          <TabPanel p="0" pt="6">
            <VStack spacing="4" align="stretch">
              {closedTickets.map((ticket) => (<TicketCard key={ticket.id} ticket={ticket} />))}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* --- CREATE TICKET MODAL --- */}
      <Modal isOpen={isCreateOpen} onClose={() => { onCreateClose(); resetForm(); }} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Ticket</ModalHeader>
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input name="title" value={formData.title} onChange={handleInputChange} placeholder="Short summary" />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Detailed issue description" />
              </FormControl>

              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Select name="category" value={formData.category} onChange={handleInputChange}>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Priority</FormLabel>
                  <Select name="priority" value={formData.priority} onChange={handleInputChange}>
                    {priorities.map(p => (
                      <option key={p} value={p}>{p.toUpperCase()}</option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" onClick={handleCreateSubmit} mr={3} disabled={!formData.title || !formData.description}>
              Submit Ticket
            </Button>
            <Button onClick={() => { onCreateClose(); resetForm(); }} variant="ghost">Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>


      {/* --- TICKET DETAIL MODAL --- */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center">
              <Text fontWeight="bold">{selectedTicket?.title}</Text>
              <Spacer />
              <Badge colorScheme={getStatusColor(selectedTicket?.status || 'open')}>
                {selectedTicket?.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </Flex>
          </ModalHeader>
          <ModalBody>
            {selectedTicket ? (
              <VStack align="stretch" spacing={4} fontSize="md">
                <Text color="gray.600">{selectedTicket.description}</Text>
                
                <Card variant="outline">
                    <CardBody p={3}>
                        <HStack spacing={8}>
                            <VStack align="flex-start" spacing={1}>
                                <Text color="gray.500" fontSize="sm">Ticket ID</Text>
                                <Text fontWeight="medium">{selectedTicket.id}</Text>
                            </VStack>
                            <VStack align="flex-start" spacing={1}>
                                <Text color="gray.500" fontSize="sm">Created By</Text>
                                <Text fontWeight="medium">{selectedTicket.user?.username || 'N/A'}</Text>
                            </VStack>
                            <VStack align="flex-start" spacing={1}>
                                <Text color="gray.500" fontSize="sm">Assigned To</Text>
                                <Text fontWeight="medium">{selectedTicket.assigned_user?.username || 'Unassigned'}</Text>
                            </VStack>
                            <VStack align="flex-start" spacing={1}>
                                <Text color="gray.500" fontSize="sm">Created At</Text>
                                <Text fontWeight="medium">{new Date(selectedTicket.created_at).toLocaleString()}</Text>
                            </VStack>
                        </HStack>
                    </CardBody>
                </Card>

                {/* Phần Resolution */}
                {(selectedTicket.resolved_at || selectedTicket.resolution_notes) && (
                    <Box pt={2}>
                        <Text fontSize="lg" fontWeight="semibold" mb={1} color="green.600">Resolution Details</Text>
                        {selectedTicket.resolved_at && (
                            <Text color="gray.700">Resolved on: {new Date(selectedTicket.resolved_at).toLocaleString()} by {selectedTicket.resolved_by_user?.username || 'Staff'}</Text>
                        )}
                        {selectedTicket.resolution_notes && (
                            <Text color="gray.700">Notes: {selectedTicket.resolution_notes}</Text>
                        )}
                    </Box>
                )}
              </VStack>
            ) : (
              <Text>Loading details...</Text>
            )}
          </ModalBody>

          <ModalFooter>
             {selectedTicket?.status !== 'resolved' && selectedTicket?.status !== 'closed' && (
                <Button colorScheme="red" variant="outline" mr={3} leftIcon={<FiX />} 
                    isDisabled={true} 
                >
                    Cancel Ticket
                </Button>
            )}
            <Button onClick={onDetailClose} colorScheme="gray">
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}