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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Spacer,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
} from '@chakra-ui/react'
import { 
  FiCreditCard, 
  FiDownload, 
  FiUpload, 
  FiCalendar,
  FiCheckCircle
} from 'react-icons/fi'

interface Bill {
  id: string
  type: string
  amount: number
  dueDate: string
  status: 'paid' | 'unpaid' | 'overdue'
  description: string
}

const mockBills: Bill[] = [
  {
    id: 'INV-1025-001',
    type: 'Electricity',
    amount: 2500000,
    dueDate: '2025-10-30',
    status: 'unpaid',
    description: 'Monthly electricity bill for Unit 303A'
  },
  {
    id: 'INV-1025-002',
    type: 'Management Fee',
    amount: 2000000,
    dueDate: '2025-11-15',
    status: 'unpaid',
    description: 'Monthly management and maintenance fee'
  },
  {
    id: 'INV-1024-001',
    type: 'Water',
    amount: 850000,
    dueDate: '2025-09-30',
    status: 'paid',
    description: 'Monthly water bill for Unit 303A'
  },
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'green'
    case 'overdue': return 'red'
    default: return 'orange'
  }
}

export default function Bills() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const unpaidBills = mockBills.filter(bill => bill.status !== 'paid')
  const paidBills = mockBills.filter(bill => bill.status === 'paid')
  const totalOutstanding = unpaidBills.reduce((sum, bill) => sum + bill.amount, 0)

  return (
    <Box>
      {/* Payment Summary */}
      <Card mb="8" bg="gradient.linear(to-r, brand.500, brand.600)" color="white">
        <CardBody>
          <Flex align="center">
            <Box>
              <Text fontSize="lg" mb="2" opacity="0.9">
                Total Outstanding Amount
              </Text>
              <Text fontSize="3xl" fontWeight="bold">
                {formatCurrency(totalOutstanding)}
              </Text>
              <HStack mt="2" spacing="2">
                <Icon as={FiCalendar} />
                <Text fontSize="sm" opacity="0.9">
                  Next Due Date: Oct 30, 2025
                </Text>
              </HStack>
            </Box>
            <Spacer />
            <Button
              size="lg"
              colorScheme="whiteAlpha"
              leftIcon={<FiCreditCard />}
              onClick={onOpen}
            >
              Pay All Outstanding Bills
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {/* Bills Tabs */}
      <Tabs>
        <TabList>
          <Tab>Unpaid Bills ({unpaidBills.length})</Tab>
          <Tab>Paid History ({paidBills.length})</Tab>
          <Tab>My Receipts</Tab>
        </TabList>

        <TabPanels>
          {/* Unpaid Bills */}
          <TabPanel p="0" pt="6">
            <VStack spacing="4" align="stretch">
              {unpaidBills.map((bill) => (
                <Card key={bill.id}>
                  <CardBody>
                    <Flex align="center">
                      <Box flex="1">
                        <HStack spacing="3" mb="2">
                          <Text fontWeight="semibold" fontSize="lg">
                            {bill.id}
                          </Text>
                          <Badge colorScheme={getStatusColor(bill.status)}>
                            {bill.status.toUpperCase()}
                          </Badge>
                        </HStack>
                        <Text color="gray.600" mb="1">
                          {bill.description}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Type: {bill.type}
                        </Text>
                      </Box>
                      
                      <VStack spacing="2" align="end">
                        <Text fontSize="xl" fontWeight="bold" color="red.500">
                          {formatCurrency(bill.amount)}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Due: {new Date(bill.dueDate).toLocaleDateString()}
                        </Text>
                        <HStack spacing="2">
                          <Button size="sm" variant="outline" leftIcon={<FiDownload />}>
                            Download
                          </Button>
                          <Button size="sm" colorScheme="brand" leftIcon={<FiCreditCard />}>
                            Pay Now
                          </Button>
                        </HStack>
                      </VStack>
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </TabPanel>

          {/* Paid History */}
          <TabPanel p="0" pt="6">
            <VStack spacing="4" align="stretch">
              {paidBills.map((bill) => (
                <Card key={bill.id}>
                  <CardBody>
                    <Flex align="center">
                      <Box flex="1">
                        <HStack spacing="3" mb="2">
                          <Text fontWeight="semibold" fontSize="lg">
                            {bill.id}
                          </Text>
                          <Badge colorScheme="green" display="flex" alignItems="center" gap="1">
                            <FiCheckCircle />
                            PAID
                          </Badge>
                        </HStack>
                        <Text color="gray.600" mb="1">
                          {bill.description}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Type: {bill.type}
                        </Text>
                      </Box>
                      
                      <VStack spacing="2" align="end">
                        <Text fontSize="xl" fontWeight="bold" color="green.500">
                          {formatCurrency(bill.amount)}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Paid: {new Date(bill.dueDate).toLocaleDateString()}
                        </Text>
                        <Button size="sm" variant="outline" leftIcon={<FiDownload />}>
                          Download Receipt
                        </Button>
                      </VStack>
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </TabPanel>

          {/* Receipts */}
          <TabPanel p="0" pt="6">
            <Card>
              <CardBody textAlign="center" py="12">
                <Icon as={FiUpload} boxSize="12" color="gray.400" mb="4" />
                <Text fontSize="lg" fontWeight="semibold" mb="2">
                  Upload Payment Proof
                </Text>
                <Text color="gray.600" mb="6">
                  Upload screenshots or documents as payment proof for manual verification
                </Text>
                <Button leftIcon={<FiUpload />} colorScheme="brand">
                  Upload Document
                </Button>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Payment Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Pay Outstanding Bills</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            <VStack spacing="4" align="stretch">
              <Box p="4" bg="gray.50" borderRadius="md">
                <Text fontWeight="semibold" mb="2">Payment Summary</Text>
                <Divider mb="3" />
                {unpaidBills.map((bill) => (
                  <Flex key={bill.id} justify="space-between" mb="2">
                    <Text>{bill.type}</Text>
                    <Text fontWeight="medium">{formatCurrency(bill.amount)}</Text>
                  </Flex>
                ))}
                <Divider my="3" />
                <Flex justify="space-between" fontWeight="bold" fontSize="lg">
                  <Text>Total</Text>
                  <Text color="brand.500">{formatCurrency(totalOutstanding)}</Text>
                </Flex>
              </Box>
              
              <SimpleGrid columns={2} spacing="4">
                <Button leftIcon={<FiCreditCard />} colorScheme="brand" size="lg">
                  Pay Online
                </Button>
                <Button leftIcon={<FiUpload />} variant="outline" size="lg">
                  Upload Proof
                </Button>
              </SimpleGrid>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}