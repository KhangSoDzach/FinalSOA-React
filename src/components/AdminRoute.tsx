import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user } = useAuth()
  
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}
