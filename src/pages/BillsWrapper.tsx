import { useAuth } from '../contexts/AuthContext'
import AdminBills from './AdminBills'
import Bills from './Bills'

const BillsWrapper = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  
  return isAdmin ? <AdminBills /> : <Bills />
}

export default BillsWrapper