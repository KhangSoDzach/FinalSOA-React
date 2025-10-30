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
  InputGroup,
  InputLeftElement,
  Checkbox,
  Link,
  Container,
  Flex,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading } = useAuth()
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    rememberMe: false
  })
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || '/'

  const handleLogin = async () => {
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password')
      return
    }

    try {
      setError('')
      await login(credentials.username, credentials.password)
      navigate(from, { replace: true })
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Login failed. Please try again.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="md" centerContent>
        <Flex align="center" justify="center" minH="100vh">
          <Card w="full" maxW="400px">
            <CardBody p="8">
              <VStack spacing="6">
                {/* Logo */}
                <Box textAlign="center">
                  <Text
                    fontSize="3xl"
                    fontWeight="bold"
                    color="brand.500"
                    letterSpacing="-0.5px"
                    mb="2"
                  >
                    SKYHOME
                  </Text>
                  <Text color="gray.600" fontSize="sm">
                    Apartment Management System
                  </Text>
                </Box>

                {/* Login Form */}
                <VStack spacing="4" w="full">
                  {error && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      {error}
                    </Alert>
                  )}

                  <FormControl>
                    <FormLabel>Username / Email</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <FiUser color="gray.300" />
                      </InputLeftElement>
                      <Input
                        placeholder="Enter your username or email"
                        value={credentials.username}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          username: e.target.value
                        })}
                        onKeyPress={handleKeyPress}
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Password</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <FiLock color="gray.300" />
                      </InputLeftElement>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={credentials.password}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          password: e.target.value
                        })}
                        onKeyPress={handleKeyPress}
                      />
                    </InputGroup>
                  </FormControl>

                  <HStack w="full" justify="space-between">
                    <Checkbox
                      isChecked={credentials.rememberMe}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        rememberMe: e.target.checked
                      })}
                    >
                      Remember me
                    </Checkbox>
                    <Link color="brand.500" fontSize="sm">
                      Forgot password?
                    </Link>
                  </HStack>

                  <Button
                    w="full"
                    colorScheme="brand"
                    size="lg"
                    leftIcon={<FiLogIn />}
                    onClick={handleLogin}
                    isLoading={isLoading}
                    loadingText="Signing in..."
                  >
                    Sign In
                  </Button>
                </VStack>

                {/* Footer */}
                <Box textAlign="center" pt="4">
                  <Text fontSize="sm" color="gray.600">
                    Don't have an account?{' '}
                    <Link color="brand.500">Contact Management</Link>
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </Flex>
      </Container>
    </Box>
  )
}