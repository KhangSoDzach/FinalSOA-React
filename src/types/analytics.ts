// Occupancy Rate
export interface OccupancyRate {
  total: number
  occupied: number
  available: number
  maintenance: number
  occupancy_rate: number
}

// Monthly Revenue
export interface MonthlyRevenue {
  month: string
  year: number
  month_number: number
  paid: number
  expected: number
}

// Outstanding Bills
export interface OutstandingBills {
  total_outstanding: number
  pending: {
    amount: number
    count: number
  }
  overdue: {
    amount: number
    count: number
  }
}

// Top Debtors
export interface TopDebtor {
  user_id: number
  name: string
  apartment_number: string
  phone: string
  total_debt: number
  bill_count: number
}

// Ticket Heatmap
export interface TicketHeatmap {
  category: string
  total: number
  open: number
  in_progress: number
  resolved: number
}

// Dashboard Summary
export interface DashboardSummary {
  occupancy_rate: OccupancyRate
  monthly_revenue: MonthlyRevenue[]
  outstanding_bills: OutstandingBills
  top_debtors: TopDebtor[]
  ticket_heatmap: TicketHeatmap[]
}
