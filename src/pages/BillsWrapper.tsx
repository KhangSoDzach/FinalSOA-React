import { useAuth } from '../contexts/AuthContext'
import AccountantBills from './admin/AccountantBills'
import Bills from './Bills'

const BillsWrapper = () => {
  const { isAccountant } = useAuth()
  
  return isAccountant() ? <AccountantBills /> : <Bills />
}

export default BillsWrapper