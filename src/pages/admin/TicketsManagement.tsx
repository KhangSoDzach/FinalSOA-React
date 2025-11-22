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
  Grid,
  GridItem,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiClock,
  FiCheckCircle,
  FiX,
  FiUser,
  FiMoreVertical,
  FiEdit,
  FiUserCheck,
  FiAlertCircle,
  FiMessageSquare,
} from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { ticketsAPI, usersAPI } from '../../services/api';

// --- INTERFACES ---

interface UserBase {
  id: number;
  username: string;
  full_name?: string;
}

interface TicketResponse {
  id: number;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  user_id: number;

  user?: UserBase;
  assigned_user?: UserBase;
  resolved_by_user?: UserBase;

  assigned_to?: number;
  resolved_at?: string;
  resolution_notes?: string;
}

interface TicketStats {
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  average_resolution_time_hours?: number;
  satisfaction_rating?: number;
}

// --- CONSTANTS ---
const categories = ['maintenance', 'complaint', 'suggestion', 'facility', 'security', 'noise', 'cleaning', 'other'];
const priorities = ['low', 'normal', 'high', 'urgent'];
const statuses = ['open', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled'];

// --- COLOR HELPERS ---

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return 'blue';
    case 'assigned':
    case 'in_progress':
      return 'orange';
    case 'resolved':
      return 'green';
    case 'closed':
      return 'gray';
    case 'cancelled':
      return 'red';
    default:
      return 'gray';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
    case 'high':
      return 'red';
    case 'normal':
      return 'orange';
    case 'low':
      return 'green';
    default:
      return 'gray';
  }
};

// --- COMPONENT ---

export default function TicketsManagement() {
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();
  const {
    isOpen: isAssignOpen,
    onOpen: onAssignOpen,
    onClose: onAssignClose,
  } = useDisclosure();
  const {
    isOpen: isResolveOpen,
    onOpen: onResolveOpen,
    onClose: onResolveClose,
  } = useDisclosure();

  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketResponse[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketResponse | null>(null);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [users, setUsers] = useState<UserBase[]>([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Form states
  const [assignedUserId, setAssignedUserId] = useState<number>(0);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  const toast = useToast();

  // Fetch data
  const fetchTickets = async () => {
    try {
      const data = await ticketsAPI.getAll();
      setTickets(data);
      setFilteredTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Error loading tickets.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchStats = async () => {
    try {
      const data = await ticketsAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchStats();
    fetchUsers();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...tickets];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((t) => t.priority === priorityFilter);
    }

    setFilteredTickets(filtered);
  }, [statusFilter, categoryFilter, priorityFilter, tickets]);

  // View ticket details
  const handleViewDetails = async (ticket: TicketResponse) => {
    try {
      const detail = await ticketsAPI.getTicketDetails(ticket.id);
      setSelectedTicket(detail);
      onDetailOpen();
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast({
        title: 'Failed to load ticket details.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Open assign modal
  const handleOpenAssign = (ticket: TicketResponse) => {
    setSelectedTicket(ticket);
    setAssignedUserId(ticket.assigned_to || 0);
    onAssignOpen();
  };

  // Assign ticket
  const handleAssignSubmit = async () => {
    if (!selectedTicket || !assignedUserId) {
      toast({
        title: 'Please select a user to assign.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await ticketsAPI.assignTicket(selectedTicket.id, assignedUserId);
      toast({
        title: 'Ticket assigned successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onAssignClose();
      fetchTickets();
      fetchStats();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: 'Failed to assign ticket.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Open resolve modal
  const handleOpenResolve = (ticket: TicketResponse) => {
    setSelectedTicket(ticket);
    setResolutionNotes('');
    onResolveOpen();
  };

  // Resolve ticket
  const handleResolveSubmit = async () => {
    if (!selectedTicket) return;

    if (!resolutionNotes.trim()) {
      toast({
        title: 'Please enter resolution notes.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await ticketsAPI.resolveTicket(selectedTicket.id, resolutionNotes);
      toast({
        title: 'Ticket resolved successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onResolveClose();
      fetchTickets();
      fetchStats();
    } catch (error) {
      console.error('Error resolving ticket:', error);
      toast({
        title: 'Failed to resolve ticket.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Update ticket status
  const handleUpdateStatus = async (ticketId: number, newStatus: string) => {
    try {
      await ticketsAPI.update(ticketId, { status: newStatus });
      toast({
        title: `Ticket status updated to ${newStatus.toUpperCase()}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchTickets();
      fetchStats();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: 'Failed to update ticket status.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      {/* Header */}
      <Flex mb="6" align="center">
        <Box>
          <Text fontSize="2xl" fontWeight="semibold">
            Tickets Management
          </Text>
          <Text color="gray.600">Manage and resolve all support tickets</Text>
        </Box>
      </Flex>

      {/* Statistics */}
      {stats && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="6" mb="6">
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Tickets</StatLabel>
                <StatNumber>{stats.total_tickets}</StatNumber>
                <StatHelpText>All time</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Open/Active</StatLabel>
                <StatNumber color="orange.500">{stats.open_tickets}</StatNumber>
                <StatHelpText>Needs attention</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Resolved</StatLabel>
                <StatNumber color="green.500">{stats.resolved_tickets}</StatNumber>
                <StatHelpText>Completed</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Avg Resolution Time</StatLabel>
                <StatNumber>
                  {stats.average_resolution_time_hours
                    ? `${stats.average_resolution_time_hours.toFixed(1)}h`
                    : 'N/A'}
                </StatNumber>
                <StatHelpText>Hours</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Filters */}
      <Card mb="6">
        <CardBody>
          <Grid templateColumns="repeat(3, 1fr)" gap="4">
            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">Status</FormLabel>
                <Select
                  size="sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">Category</FormLabel>
                <Select
                  size="sm"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c.toUpperCase()}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">Priority</FormLabel>
                <Select
                  size="sm"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p.toUpperCase()}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardBody>
          <Text fontSize="lg" fontWeight="semibold" mb="4">
            Tickets List ({filteredTickets.length})
          </Text>
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Title</Th>
                  <Th>User</Th>
                  <Th>Category</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                  <Th>Assigned To</Th>
                  <Th>Created</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredTickets.map((ticket) => (
                  <Tr key={ticket.id}>
                    <Td>{ticket.id}</Td>
                    <Td maxW="200px" isTruncated>
                      {ticket.title}
                    </Td>
                    <Td>{ticket.user?.username || `User ${ticket.user_id}`}</Td>
                    <Td>
                      <Badge colorScheme="purple" fontSize="xs">
                        {ticket.category.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getPriorityColor(ticket.priority)} fontSize="xs">
                        {ticket.priority.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(ticket.status)} fontSize="xs">
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </Td>
                    <Td>
                      {ticket.assigned_user?.username || (
                        <Text color="gray.400" fontSize="xs">
                          Unassigned
                        </Text>
                      )}
                    </Td>
                    <Td fontSize="xs">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FiMoreVertical />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem
                            icon={<FiEdit />}
                            onClick={() => handleViewDetails(ticket)}
                          >
                            View Details
                          </MenuItem>
                          <MenuItem
                            icon={<FiUserCheck />}
                            onClick={() => handleOpenAssign(ticket)}
                          >
                            Assign
                          </MenuItem>
                          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                            <>
                              <MenuItem
                                icon={<FiCheckCircle />}
                                onClick={() => handleOpenResolve(ticket)}
                              >
                                Resolve
                              </MenuItem>
                              {ticket.status !== 'in_progress' && (
                                <MenuItem
                                  onClick={() =>
                                    handleUpdateStatus(ticket.id, 'in_progress')
                                  }
                                >
                                  Mark In Progress
                                </MenuItem>
                              )}
                              <MenuItem
                                icon={<FiX />}
                                onClick={() => handleUpdateStatus(ticket.id, 'cancelled')}
                              >
                                Cancel
                              </MenuItem>
                            </>
                          )}
                          {ticket.status === 'resolved' && (
                            <MenuItem
                              onClick={() => handleUpdateStatus(ticket.id, 'closed')}
                            >
                              Close Ticket
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
          {filteredTickets.length === 0 && (
            <Box textAlign="center" py="12">
              <Icon as={FiAlertCircle} boxSize="12" color="gray.400" mb="4" />
              <Text fontSize="lg" fontWeight="semibold" mb="2">
                No tickets found
              </Text>
              <Text color="gray.600">Try adjusting your filters</Text>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* --- TICKET DETAIL MODAL --- */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center">
              <Text fontWeight="bold">Ticket #{selectedTicket?.id}</Text>
              <Spacer />
              <Badge colorScheme={getStatusColor(selectedTicket?.status || 'open')}>
                {selectedTicket?.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </Flex>
          </ModalHeader>
          <ModalBody>
            {selectedTicket ? (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="semibold" fontSize="lg" mb="2">
                    {selectedTicket.title}
                  </Text>
                  <Text color="gray.600">{selectedTicket.description}</Text>
                </Box>

                <Divider />

                <Grid templateColumns="repeat(2, 1fr)" gap="4">
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Created By
                    </Text>
                    <Text fontWeight="medium">
                      {selectedTicket.user?.full_name || selectedTicket.user?.username || 'N/A'}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Assigned To
                    </Text>
                    <Text fontWeight="medium">
                      {selectedTicket.assigned_user?.full_name ||
                        selectedTicket.assigned_user?.username ||
                        'Unassigned'}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Category
                    </Text>
                    <Badge colorScheme="purple">
                      {selectedTicket.category.toUpperCase()}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Priority
                    </Text>
                    <Badge colorScheme={getPriorityColor(selectedTicket.priority)}>
                      {selectedTicket.priority.toUpperCase()}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Created At
                    </Text>
                    <Text fontWeight="medium">
                      {new Date(selectedTicket.created_at).toLocaleString()}
                    </Text>
                  </Box>
                  {selectedTicket.resolved_at && (
                    <Box>
                      <Text fontSize="sm" color="gray.500">
                        Resolved At
                      </Text>
                      <Text fontWeight="medium">
                        {new Date(selectedTicket.resolved_at).toLocaleString()}
                      </Text>
                    </Box>
                  )}
                </Grid>

                {selectedTicket.resolution_notes && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb="2">
                        Resolution Notes
                      </Text>
                      <Text>{selectedTicket.resolution_notes}</Text>
                    </Box>
                  </>
                )}
              </VStack>
            ) : (
              <Text>Loading details...</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onDetailClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* --- ASSIGN TICKET MODAL --- */}
      <Modal isOpen={isAssignOpen} onClose={onAssignClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign Ticket #{selectedTicket?.id}</ModalHeader>
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Assign To</FormLabel>
              <Select
                placeholder="Select user"
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(Number(e.target.value))}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.username} (ID: {user.id})
                  </option>
                ))}
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              onClick={handleAssignSubmit}
              mr={3}
              disabled={!assignedUserId}
            >
              Assign
            </Button>
            <Button onClick={onAssignClose} variant="ghost">
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* --- RESOLVE TICKET MODAL --- */}
      <Modal isOpen={isResolveOpen} onClose={onResolveClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Resolve Ticket #{selectedTicket?.id}</ModalHeader>
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Resolution Notes</FormLabel>
              <Textarea
                placeholder="Describe how this ticket was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={5}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="green"
              onClick={handleResolveSubmit}
              mr={3}
              leftIcon={<FiCheckCircle />}
            >
              Resolve
            </Button>
            <Button onClick={onResolveClose} variant="ghost">
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
