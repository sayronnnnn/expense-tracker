export interface User {
  id: string
  email: string
  name: string | null
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Category {
  id: string
  name: string
  slug: string
  type: string
  user_id: string | null
}

export interface Expense {
  id: string
  user_id: string
  category_id: string
  amount: string
  currency: string
  date: string
  note: string | null
  is_recurring: boolean
  recurring_rule_id: string | null
  created_at: string
  updated_at: string
}

export interface ExpenseCreate {
  category_id: string
  amount: string
  currency?: string
  date: string
  note?: string | null
  is_recurring?: boolean
  recurring_rule_id?: string | null
}

export interface BudgetWithActual {
  id: string
  user_id: string
  month: number
  year: number
  amount: string
  currency: string
  category_id: string | null
  created_at: string
  updated_at: string
  actual_spent: string
  exceeded: boolean
}

export interface RecurringRule {
  id: string
  user_id: string
  category_id: string
  amount: string
  currency: string
  note: string | null
  frequency: string
  next_run_at: string
  last_run_at: string | null
  created_at: string
  updated_at: string
}

export interface MonthlyTotal {
  month: number
  year: number
  total: string
  currency: string
}

export interface CategoryBreakdownItem {
  category_id: string
  category_name: string
  total: string
  currency: string
}

export interface CategoryDistribution {
  month: number
  year: number
  total: string
  currency: string
  by_category: CategoryBreakdownItem[]
}

export interface TrendPoint {
  month: number
  year: number
  total: string
  currency: string
}

export interface SpendingTrend {
  points: TrendPoint[]
  currency: string
}

export interface DailyBreakdownItem {
  day: number
  total: string
  currency: string
  transaction_count: number
}

export interface DailyBreakdown {
  month: number
  year: number
  total: string
  currency: string
  by_day: DailyBreakdownItem[]
}
