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
  FormControl,
  FormLabel,
  Input,
  useToast,
  Link,
} from '@chakra-ui/react';
import { 
  FiCreditCard, 
  FiDownload, 
  FiCalendar,
  FiCheckCircle,
  FiMail,
} from 'react-icons/fi';
import { useEffect, useState, useRef } from 'react';
import { billsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext'; 

interface Bill {
  id: number; 
  title: string;
  type: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'overdue';
  description: string;
}

interface PaymentRequestResponse {
  payment_id: number; 
  message: string;
  bill_amount: number;
  // ĐÃ XÓA: otp_valid_until: string; 
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'green';
    case 'overdue': return 'red';
    default: return 'orange';
  }
};

export default function Bills() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuth(); 
  
  const [unpaidBills, setUnpaidBills] = useState<Bill[]>([]);
  const [paidBills, setPaidBills] = useState<Bill[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  
  // OTP State
  const [otpData, setOtpData] = useState<{
    paymentId: number | null; 
    otpCode: string;
    validUntil: Date | null;
    billAmount: number;
  }>({
    paymentId: null,
    otpCode: '',
    validUntil: null,
    billAmount: 0,
  });
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false); 
  const [isResending, setIsResending] = useState(false);
  const toast = useToast();
  const resendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const formatTimeRemaining = (time: Date | null) => {
    if (!time) return 'N/A';
    const now = new Date();
    const diff = time.getTime() - now.getTime();
    if (diff <= 0) return 'Hết hạn';
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const startResendTimer = () => {
    setResendCountdown(60); // 60 seconds countdown
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);

    resendTimerRef.current = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) {
          if (resendTimerRef.current) clearInterval(resendTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Effect theo dõi thời gian hiệu lực OTP (ĐÃ SỬA: Logic chỉ dựa vào validUntil cục bộ)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isOTPSent && otpData.validUntil) {
      const initialRemaining = otpData.validUntil!.getTime() - new Date().getTime();

      const updateCountdown = () => {
        const remaining = otpData.validUntil!.getTime() - new Date().getTime();
        
        if (remaining <= 0) {
          if (timer) clearInterval(timer);
          setIsOTPSent(false); 
          
          if (isOpen && initialRemaining > 0) { 
            toast({
              title: 'Mã OTP đã hết hạn',
              description: 'Vui lòng gửi lại yêu cầu OTP mới.',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        }
      };

      if (initialRemaining > 0) {
        updateCountdown();
        timer = setInterval(updateCountdown, 1000);
      } else {
        setIsOTPSent(false); 
        if (isOpen) {
          toast({
            title: 'Mã OTP đã hết hạn',
            description: 'Vui lòng gửi lại yêu cầu OTP mới.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    }
    
    return () => {
      if (timer) clearInterval(timer);
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, [isOTPSent, otpData.validUntil, isOpen]);

  const fetchBills = async () => {
    try {
      const unpaid = await billsAPI.getMyBills('pending');
      const formattedUnpaid: Bill[] = unpaid.map((b: any) => ({
        ...b,
        id: Number(b.id),
      }));
      setUnpaidBills(formattedUnpaid);

      const paid = await billsAPI.getMyBills('paid');
      const formattedPaid: Bill[] = paid.map((b: any) => ({
        ...b,
        id: Number(b.id),
      }));
      setPaidBills(formattedPaid);

      const total = formattedUnpaid.reduce((sum: number, bill: Bill) => {
        return Number(sum) + Number(bill.amount);
    }, 0); 
    setTotalOutstanding(total);

    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: 'Lỗi tải hóa đơn',
        description: 'Không thể tải danh sách hóa đơn.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handlePayBill = (billId: number) => { 
    setSelectedBillId(billId);
    setIsOTPSent(false);
    setOtpData({ paymentId: null, otpCode: '', validUntil: null, billAmount: 0 });
    onOpen();
  };

  const handleRequestOTP = async (billId: number, isResend = false) => {
    if (!billId) return;

    try {
      if (isResend) {
        setIsResending(true);
      } else {
        setIsRequesting(true);
      }
      
      const response: PaymentRequestResponse = isResend
        ? await billsAPI.resendOTP(billId)
        : await billsAPI.requestPayment(billId);

      // SỬA: Tự tính thời gian hết hạn (5 phút = 300,000 milliseconds)
      const validUntilDate = new Date(new Date().getTime() + 300000); 

      setOtpData({
        paymentId: response.payment_id,
        otpCode: '',
        validUntil: validUntilDate,
        billAmount: response.bill_amount,
      });
      setIsOTPSent(true); // Chuyển sang giao diện nhập OTP
      startResendTimer();
      
      toast({
        title: isResend ? 'Gửi lại OTP thành công' : 'Yêu cầu thanh toán thành công',
        description: response.message,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Lỗi gửi yêu cầu OTP.';
      toast({
        title: 'Thất bại',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsResending(false);
      setIsRequesting(false);
    }
  };

  const handleVerifyOTP = async () => {
    const paymentId = otpData.paymentId;
    
    if (paymentId === null || otpData.otpCode.length !== 6) { 
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập mã OTP gồm 6 chữ số.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Kiểm tra hết hạn trên frontend trước khi gửi
    if (otpData.validUntil && otpData.validUntil.getTime() <= new Date().getTime()) {
      setIsOTPSent(false);
      toast({
        title: 'Lỗi',
        description: 'Mã OTP đã hết hạn. Vui lòng gửi lại yêu cầu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsVerifying(true);
    try {
      const paymentResponse = await billsAPI.verifyOTP(paymentId, otpData.otpCode);
      
      toast({
        title: 'Thanh toán thành công!',
        description: `Mã giao dịch: ${paymentResponse.id}`, 
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onClose();
      await fetchBills();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Lỗi xác minh OTP.';
      toast({
        title: 'Thanh toán thất bại',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const selectedBillDetails = selectedBillId ? unpaidBills.find(b => b.id === selectedBillId) : null;

  return (
    <Box>
      {/* Payment Summary - ĐÃ XÓA NÚT THANH TOÁN TẤT CẢ */}
      <Card mb="8" bg="linear-gradient(to right, #4c66f5, #6c82ff)" color="white">
        <CardBody>
          <Flex align="center">
            <Box>
              <Text fontSize="lg" mb="2" opacity="0.9">
                Tổng tiền phải thanh toán
              </Text>
              <Text fontSize="3xl" fontWeight="bold">
                {formatCurrency(totalOutstanding)}
              </Text>

            </Box>
            <Spacer />
          </Flex>
        </CardBody>
      </Card>

      {/* Bills Tabs */}
      <Tabs>
        <TabList>
          <Tab>Hóa đơn chưa trả ({unpaidBills.length})</Tab>
          <Tab>Lịch sử đã trả ({paidBills.length})</Tab>
        </TabList>

        <TabPanels>
          {/* Unpaid Bills */}
          <TabPanel p="0" pt="6">
            <VStack spacing="4" align="stretch">
              {unpaidBills.length === 0 ? (
                <Card>
                  <CardBody textAlign="center">
                    <Text color="gray.500">Tuyệt vời! Bạn không có hóa đơn nào chưa thanh toán.</Text>
                  </CardBody>
                </Card>
              ) : (
                unpaidBills.map((bill) => (
                  <Card key={bill.id}>
                    <CardBody>
                      <Flex align="center">
                        <Box flex="1">
                          <HStack spacing="3" mb="2">
                            <Text fontWeight="semibold" fontSize="lg">
                              {bill.title}
                            </Text>
                            <Badge colorScheme={getStatusColor(bill.status)}>
                              {bill.status.toUpperCase()}
                            </Badge>
                          </HStack>
                          <Text color="gray.600" mb="1">
                            {bill.description}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            Loại: {bill.type}
                          </Text>
                        </Box>
                        
                        <VStack spacing="2" align="end">
                          <Text fontSize="xl" fontWeight="bold" color="red.500">
                            {formatCurrency(bill.amount)}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            Đến hạn: {new Date(bill.dueDate).toLocaleDateString('vi-VN')}
                          </Text>
                          <HStack spacing="2">
                            <Button size="sm" variant="outline" leftIcon={<FiDownload />}>
                              Tải xuống
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="brand"
                              leftIcon={<FiCreditCard />}
                              onClick={() => handlePayBill(bill.id)} // bill.id là number
                            >
                              Thanh toán ngay
                            </Button>
                          </HStack>
                        </VStack>
                      </Flex>
                    </CardBody>
                  </Card>
                ))
              )}
            </VStack>
          </TabPanel>

          {/* Paid History */}
          <TabPanel p="0" pt="6">
            <VStack spacing="4" align="stretch">
              {paidBills.length === 0 ? (
                <Card>
                  <CardBody textAlign="center">
                    <Text color="gray.500">Chưa có lịch sử thanh toán.</Text>
                  </CardBody>
                </Card>
              ) : (
                paidBills.map((bill) => (
                  <Card key={bill.id}>
                    <CardBody>
                      <Flex align="center">
                        <Box flex="1">
                          <HStack spacing="3" mb="2">
                            <Text fontWeight="semibold" fontSize="lg">
                              {bill.title}
                            </Text>
                            <Badge colorScheme="green" display="flex" alignItems="center" gap="1">
                              <FiCheckCircle />
                              ĐÃ THANH TOÁN
                            </Badge>
                          </HStack>
                          <Text color="gray.600" mb="1">
                            {bill.description}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            Loại: {bill.type}
                          </Text>
                        </Box>
                        
                        <VStack spacing="2" align="end">
                          <Text fontSize="xl" fontWeight="bold" color="green.500">
                            {formatCurrency(bill.amount)}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            Thanh toán: {new Date(bill.dueDate).toLocaleDateString('vi-VN')}
                          </Text>
                          <Button size="sm" variant="outline" leftIcon={<FiDownload />}>
                            Tải biên lai
                          </Button>
                        </VStack>
                      </Flex>
                    </CardBody>
                  </Card>
                ))
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* OTP Payment Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isOTPSent ? 'Xác minh OTP để thanh toán' : 'Gửi yêu cầu OTP'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedBillDetails ? (
              <VStack spacing={4}>
                <Card w="full" bg="blue.50">
                  <CardBody p={4}>
                    <Text fontWeight="semibold">{selectedBillDetails.title}</Text>
                    <Text fontSize="sm" color="gray.600">Đến hạn: {new Date(selectedBillDetails.dueDate).toLocaleDateString('vi-VN')}</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="brand.500" mt={2}>
                      {formatCurrency(selectedBillDetails.amount)}
                    </Text>
                  </CardBody>
                </Card>

                {/* Giao diện Gửi OTP (Bước 1) */}
                {!isOTPSent ? (
                  <VStack w="full" spacing={4}>
                    <Text textAlign="center" color="gray.700">
                      Vui lòng xác nhận để gửi mã OTP qua email **({user?.email || 'N/A'})** để hoàn tất thanh toán.
                    </Text>
                    <Button
                      w="full"
                      colorScheme="brand"
                      leftIcon={<FiMail />}
                      isLoading={isRequesting}
                      onClick={() => handleRequestOTP(selectedBillId!)}
                    >
                      Gửi mã OTP đến Email
                    </Button>
                  </VStack>
                ) : (
                  /* Giao diện Nhập OTP (Bước 2) */
                  <VStack w="full" spacing={4}>
                    <Text textAlign="center" color="gray.700">
                      Mã OTP đã được gửi đến email đăng ký của bạn. Vui lòng nhập mã dưới đây để xác minh.
                    </Text>
                    
                    <FormControl isRequired>
                      <FormLabel>Mã OTP (6 chữ số)</FormLabel>
                      <Input
                        placeholder="Nhập mã OTP"
                        value={otpData.otpCode}
                        onChange={(e) => setOtpData({...otpData, otpCode: e.target.value})}
                        maxLength={6}
                        type="number"
                      />
                    </FormControl>

                    <Flex w="full" justify="space-between" align="center" fontSize="sm" color="gray.500">
                      <HStack>
                        <Text>Hiệu lực:</Text>
                        <Text fontWeight="bold" color={formatTimeRemaining(otpData.validUntil) === 'Hết hạn' ? 'red.500' : 'green.600'}>
                          {formatTimeRemaining(otpData.validUntil)}
                        </Text>
                      </HStack>
                      <Button
                        variant="link"
                        size="sm"
                        colorScheme="orange"
                        isDisabled={resendCountdown > 0 || isResending}
                        onClick={() => handleRequestOTP(selectedBillId!, true)}
                        isLoading={isResending}
                      >
                        {resendCountdown > 0 ? `Gửi lại sau (${resendCountdown}s)` : 'Gửi lại OTP'}
                      </Button>
                    </Flex>
                    
                    <Button
                      w="full"
                      colorScheme="green"
                      leftIcon={<FiCheckCircle />}
                      isLoading={isVerifying}
                      onClick={handleVerifyOTP}
                      isDisabled={otpData.otpCode.length !== 6 || formatTimeRemaining(otpData.validUntil) === 'Hết hạn'}
                    >
                      Xác minh và Thanh toán
                    </Button>
                  </VStack>
                )}
              </VStack>
            ) : (
              <Text>Lỗi: Không tìm thấy chi tiết hóa đơn.</Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}