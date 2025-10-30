import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

export const theme = extendTheme({
  config,
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
    gray: {
      50: '#f4f7fa',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#1a202c',
      900: '#171923',
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
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          borderRadius: 'lg',
        },
      },
    },
  },
})