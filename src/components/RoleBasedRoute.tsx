import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface RoleBasedRouteProps {
  children: React.ReactElement
  allowedRoles: string[]
  redirectTo?: string
}

/**
 * Route wrapper that checks if user has required role
 * Redirects to specified path if user doesn't have permission
 */
const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  children, 
  allowedRoles,
  redirectTo = '/dashboard'
}) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const hasRequiredRole = allowedRoles.includes(user.role)

  if (!hasRequiredRole) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}

export default RoleBasedRoute
