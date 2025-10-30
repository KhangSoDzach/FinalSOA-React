import { extendTheme } from '@chakra-ui/react'

// Base theme colors
const colors = {
  brand: {
    50: '#f3e5f5',
    100: '#e1bee7',
    200: '#ce93d8',
    300: '#ba68c8',
    400: '#ab47bc',
    500: '#9c27b0', // Primary admin color (purple)
    600: '#8e24aa',
    700: '#7b1fa2',
    800: '#6a1b9a',
    900: '#4a148c',
  },
  user: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3', // Primary user color (blue)
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
  admin: {
    50: '#f3e5f5',
    100: '#e1bee7',
    200: '#ce93d8',
    300: '#ba68c8',
    400: '#ab47bc',
    500: '#9c27b0',
    600: '#8e24aa',
    700: '#7b1fa2',
    800: '#6a1b9a',
    900: '#4a148c',
  }
}

// Dynamic theme based on user role
export const createTheme = (userRole: 'admin' | 'user' = 'user') => {
  const primaryColor = userRole === 'admin' ? 'admin' : 'user'
  
  return extendTheme({
    colors,
    config: {
      initialColorMode: 'light',
      useSystemColorMode: false,
    },
    semanticTokens: {
      colors: {
        brand: {
          default: `${primaryColor}.500`,
          _dark: `${primaryColor}.300`,
        },
      },
    },
    components: {
      Button: {
        variants: {
          solid: {
            bg: `${primaryColor}.500`,
            color: 'white',
            _hover: {
              bg: `${primaryColor}.600`,
            },
            _active: {
              bg: `${primaryColor}.700`,
            },
          },
        },
      },
      Card: {
        variants: {
          elevated: {
            container: {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              borderRadius: 'xl',
              bg: 'white',
              border: '1px solid',
              borderColor: 'gray.100',
            },
          },
          gradient: {
            container: {
              background: userRole === 'admin' 
                ? 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)'
                : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              borderRadius: 'xl',
              border: 'none',
            },
          },
        },
      },
      Sidebar: {
        variants: {
          admin: {
            bg: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)',
            borderRight: '1px solid',
            borderColor: 'admin.100',
          },
          user: {
            bg: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)',
            borderRight: '1px solid',
            borderColor: 'user.100',
          },
        },
      },
    },
    styles: {
      global: {
        body: {
          bg: 'gray.50',
        },
      },
    },
  })
}