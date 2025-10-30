import { extendTheme } from '@chakra-ui/react'

// Export the extended theme for easier import
export const theme = extendTheme({
  colors: {
    brand: {
      50: '#e9f5ff',
      100: '#bee3f8',
      200: '#90cdf4',
      300: '#63b3ed',
      400: '#4299e1',
      500: '#007bff',
      600: '#0056b3',
      700: '#2c5aa0',
      800: '#2a4a8b',
      900: '#1a365d',
    },
  },
  fonts: {
    heading: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    body: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
  },
})