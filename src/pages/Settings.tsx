import {
  Box,
  Card,
  CardBody,
  Text,
  Switch,
  VStack,
  HStack,
  Button,
  FormControl,
  FormLabel,
  Select,
  Divider,
  Badge,
  Icon,
} from '@chakra-ui/react'
import { 
  FiBell, 
  FiLock, 
  FiGlobe,
  FiShield,
  FiUser,
  FiMail
} from 'react-icons/fi'
import { useState } from 'react'

interface Settings {
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    bills: boolean
    announcements: boolean
    maintenance: boolean
  }
  privacy: {
    showProfile: boolean
    shareContact: boolean
    allowMarketing: boolean
  }
  display: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    timezone: string
  }
}

const mockSettings: Settings = {
  notifications: {
    email: true,
    sms: false,
    push: true,
    bills: true,
    announcements: true,
    maintenance: true
  },
  privacy: {
    showProfile: false,
    shareContact: false,
    allowMarketing: false
  },
  display: {
    theme: 'light',
    language: 'en',
    timezone: 'Asia/Ho_Chi_Minh'
  }
}

export default function Settings() {
  const [settings, setSettings] = useState(mockSettings)

  const updateNotification = (key: keyof typeof settings.notifications, value: boolean) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value
      }
    })
  }

  const updatePrivacy = (key: keyof typeof settings.privacy, value: boolean) => {
    setSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: value
      }
    })
  }

  const updateDisplay = (key: keyof typeof settings.display, value: string) => {
    setSettings({
      ...settings,
      display: {
        ...settings.display,
        [key]: value
      }
    })
  }

  return (
    <Box>
      {/* Header */}
      <Box mb="6">
        <Text fontSize="2xl" fontWeight="semibold" mb="2">
          Settings
        </Text>
        <Text color="gray.600">
          Manage your account preferences and privacy settings
        </Text>
      </Box>

      <VStack spacing="6" align="stretch">
        {/* Notifications */}
        <Card>
          <CardBody>
            <HStack mb="6">
              <Icon as={FiBell} color="blue.500" boxSize="5" />
              <Text fontSize="lg" fontWeight="semibold">
                Notifications
              </Text>
            </HStack>
            
            <VStack spacing="4" align="stretch">
              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="medium">Email Notifications</Text>
                  <Text fontSize="sm" color="gray.600">
                    Receive notifications via email
                  </Text>
                </Box>
                <Switch
                  isChecked={settings.notifications.email}
                  onChange={(e) => updateNotification('email', e.target.checked)}
                />
              </HStack>

              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="medium">SMS Notifications</Text>
                  <Text fontSize="sm" color="gray.600">
                    Receive notifications via SMS
                  </Text>
                </Box>
                <Switch
                  isChecked={settings.notifications.sms}
                  onChange={(e) => updateNotification('sms', e.target.checked)}
                />
              </HStack>

              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="medium">Push Notifications</Text>
                  <Text fontSize="sm" color="gray.600">
                    Receive push notifications in browser
                  </Text>
                </Box>
                <Switch
                  isChecked={settings.notifications.push}
                  onChange={(e) => updateNotification('push', e.target.checked)}
                />
              </HStack>

              <Divider />

              <Text fontSize="md" fontWeight="medium" color="gray.700">
                Notification Types
              </Text>

              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="medium">Bills & Payments</Text>
                  <Text fontSize="sm" color="gray.600">
                    Payment reminders and confirmations
                  </Text>
                </Box>
                <Switch
                  isChecked={settings.notifications.bills}
                  onChange={(e) => updateNotification('bills', e.target.checked)}
                />
              </HStack>

              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="medium">Announcements</Text>
                  <Text fontSize="sm" color="gray.600">
                    Building announcements and news
                  </Text>
                </Box>
                <Switch
                  isChecked={settings.notifications.announcements}
                  onChange={(e) => updateNotification('announcements', e.target.checked)}
                />
              </HStack>

              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="medium">Maintenance Updates</Text>
                  <Text fontSize="sm" color="gray.600">
                    Service request and maintenance updates
                  </Text>
                </Box>
                <Switch
                  isChecked={settings.notifications.maintenance}
                  onChange={(e) => updateNotification('maintenance', e.target.checked)}
                />
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Privacy */}
        <Card>
          <CardBody>
            <HStack mb="6">
              <Icon as={FiShield} color="green.500" boxSize="5" />
              <Text fontSize="lg" fontWeight="semibold">
                Privacy & Security
              </Text>
            </HStack>
            
            <VStack spacing="4" align="stretch">
              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="medium">Public Profile</Text>
                  <Text fontSize="sm" color="gray.600">
                    Allow other residents to see your profile
                  </Text>
                </Box>
                <Switch
                  isChecked={settings.privacy.showProfile}
                  onChange={(e) => updatePrivacy('showProfile', e.target.checked)}
                />
              </HStack>

              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="medium">Share Contact Info</Text>
                  <Text fontSize="sm" color="gray.600">
                    Allow building management to share your contact info
                  </Text>
                </Box>
                <Switch
                  isChecked={settings.privacy.shareContact}
                  onChange={(e) => updatePrivacy('shareContact', e.target.checked)}
                />
              </HStack>

              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="medium">Marketing Communications</Text>
                  <Text fontSize="sm" color="gray.600">
                    Receive promotional emails and offers
                  </Text>
                </Box>
                <Switch
                  isChecked={settings.privacy.allowMarketing}
                  onChange={(e) => updatePrivacy('allowMarketing', e.target.checked)}
                />
              </HStack>

              <Divider />

              <VStack spacing="3" align="stretch">
                <Button leftIcon={<FiLock />} variant="outline" size="sm">
                  Change Password
                </Button>
                <Button leftIcon={<FiUser />} variant="outline" size="sm">
                  Two-Factor Authentication
                </Button>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Display */}
        <Card>
          <CardBody>
            <HStack mb="6">
              <Icon as={FiGlobe} color="purple.500" boxSize="5" />
              <Text fontSize="lg" fontWeight="semibold">
                Display & Language
              </Text>
            </HStack>
            
            <VStack spacing="4" align="stretch">
              <FormControl>
                <FormLabel>Theme</FormLabel>
                <Select
                  value={settings.display.theme}
                  onChange={(e) => updateDisplay('theme', e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Language</FormLabel>
                <Select
                  value={settings.display.language}
                  onChange={(e) => updateDisplay('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="vi">Tiếng Việt</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Timezone</FormLabel>
                <Select
                  value={settings.display.timezone}
                  onChange={(e) => updateDisplay('timezone', e.target.value)}
                >
                  <option value="Asia/Ho_Chi_Minh">Ho Chi Minh City (UTC+7)</option>
                  <option value="Asia/Bangkok">Bangkok (UTC+7)</option>
                  <option value="Asia/Singapore">Singapore (UTC+8)</option>
                </Select>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Account */}
        <Card>
          <CardBody>
            <HStack mb="6">
              <Icon as={FiUser} color="orange.500" boxSize="5" />
              <Text fontSize="lg" fontWeight="semibold">
                Account Management
              </Text>
            </HStack>
            
            <VStack spacing="4" align="stretch">
              <Box p="4" bg="blue.50" borderRadius="md" borderLeft="4px solid" borderColor="blue.500">
                <Text fontWeight="medium" mb="1">Account Status</Text>
                <HStack>
                  <Badge colorScheme="green">Active</Badge>
                  <Text fontSize="sm" color="gray.600">
                    Account created on January 15, 2025
                  </Text>
                </HStack>
              </Box>

              <HStack spacing="3">
                <Button leftIcon={<FiMail />} variant="outline" size="sm">
                  Export Data
                </Button>
                <Button colorScheme="red" variant="outline" size="sm">
                  Deactivate Account
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Save Button */}
        <Box textAlign="center">
          <Button colorScheme="brand" size="lg" px="8">
            Save All Settings
          </Button>
        </Box>
      </VStack>
    </Box>
  )
}