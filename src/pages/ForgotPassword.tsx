import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  Input,
  Button,
  VStack,
  FormControl,
  FormLabel,
  useToast,
  PinInput,
  PinInputField,
  HStack,
} from '@chakra-ui/react'
import { authAPI } from '../services/api'

type Step = 'email' | 'verify' | 'reset'

const ForgotPassword = () => {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập email',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setLoading(true)
    try {
      await authAPI.forgotPassword(email)
      toast({
        title: 'Thành công',
        description: 'Mã OTP đã được gửi đến email của bạn (kiểm tra cả thư mục Spam)',
        status: 'success',
        duration: 5000,
      })
      setStep('verify')
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Có lỗi xảy ra',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập đầy đủ 6 số OTP',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setLoading(true)
    try {
      await authAPI.verifyResetOtp(email, otp)
      toast({
        title: 'Thành công',
        description: 'Mã OTP hợp lệ',
        status: 'success',
        duration: 3000,
      })
      setStep('reset')
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Mã OTP không hợp lệ',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập đầy đủ thông tin',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu xác nhận không khớp',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu phải có ít nhất 6 ký tự',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setLoading(true)
    try {
      await authAPI.resetPassword(email, otp, newPassword)
      toast({
        title: 'Thành công',
        description: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập',
        status: 'success',
        duration: 5000,
      })
      navigate('/login')
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Có lỗi xảy ra',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setLoading(true)
    try {
      await authAPI.forgotPassword(email)
      toast({
        title: 'Thành công',
        description: 'Mã OTP mới đã được gửi',
        status: 'success',
        duration: 3000,
      })
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.detail || 'Có lỗi xảy ra',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, blue.50, indigo.100)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Card maxW="md" w="full" shadow="xl">
        <CardBody p={8}>
          <VStack spacing={6} align="stretch">
            <Box textAlign="center">
              <Heading size="lg" mb={2}>
                Quên mật khẩu
              </Heading>
              <Text color="gray.600">
                {step === 'email' && 'Nhập email để nhận mã OTP'}
                {step === 'verify' && 'Nhập mã OTP đã gửi đến email'}
                {step === 'reset' && 'Đặt mật khẩu mới'}
              </Text>
            </Box>

            {/* Step 1: Enter Email */}
            {step === 'email' && (
              <form onSubmit={handleSendEmail}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      size="lg"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    isLoading={loading}
                    loadingText="Đang gửi..."
                  >
                    Gửi mã OTP
                  </Button>

                  <Link to="/login" style={{ width: '100%' }}>
                    <Button variant="ghost" w="full">
                      ← Quay lại đăng nhập
                    </Button>
                  </Link>
                </VStack>
              </form>
            )}

            {/* Step 2: Verify OTP */}
            {step === 'verify' && (
              <form onSubmit={handleVerifyOtp}>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel textAlign="center">
                      Mã OTP (6 chữ số)
                    </FormLabel>
                    <HStack justify="center">
                      <PinInput
                        otp
                        size="lg"
                        value={otp}
                        onChange={setOtp}
                      >
                        <PinInputField />
                        <PinInputField />
                        <PinInputField />
                        <PinInputField />
                        <PinInputField />
                        <PinInputField />
                      </PinInput>
                    </HStack>
                    <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
                      Mã có hiệu lực trong 10 phút
                    </Text>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    isLoading={loading}
                    loadingText="Đang xác thực..."
                  >
                    Xác thực
                  </Button>

                  <Button
                    variant="link"
                    colorScheme="blue"
                    onClick={handleResendOtp}
                    isDisabled={loading}
                  >
                    Gửi lại mã OTP
                  </Button>

                  <Button
                    variant="ghost"
                    w="full"
                    onClick={() => setStep('email')}
                  >
                    ← Thay đổi email
                  </Button>
                </VStack>
              </form>
            )}

            {/* Step 3: Reset Password */}
            {step === 'reset' && (
              <form onSubmit={handleResetPassword}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Mật khẩu mới</FormLabel>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ít nhất 6 ký tự"
                      size="lg"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Xác nhận mật khẩu</FormLabel>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      size="lg"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    isLoading={loading}
                    loadingText="Đang xử lý..."
                  >
                    Đặt lại mật khẩu
                  </Button>
                </VStack>
              </form>
            )}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}

export default ForgotPassword
