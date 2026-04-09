export interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  initial_balance: number;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'expense' | 'income';
  parent_id: number | null;
  icon: string;
  sort_order: number;
  is_system: number;
  expense_nature?: 'fixed' | 'variable' | 'discretionary' | null;
  created_at: string;
}

export interface CategoryTreeNode {
  id: number;
  name: string;
  type: string;
  icon: string;
  sort_order: number;
  is_system: number;
  expense_nature?: 'fixed' | 'variable' | 'discretionary' | null;
  children: CategoryTreeNode[];
}

export interface Transaction {
  id: number;
  type: 'expense' | 'income';
  amount: number;
  category_id: number;
  sub_category_id: number | null;
  account_id: number;
  date: string;
  note: string;
  tags: string;
  expense_nature?: 'fixed' | 'variable' | 'discretionary' | null;
  created_at: string;
  updated_at: string;
  category_name?: string;
  sub_category_name?: string;
  account_name?: string;
}

export interface Budget {
  id: number;
  category_id: number;
  month: string;
  amount: number;
  created_at: string;
}

export interface BudgetStatus {
  category_id: number;
  category_name: string;
  budget_amount: number;
  actual_spent: number;
  percentage: number;
  is_over: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateAccountRequest {
  name: string;
  type: string;
  initial_balance?: number;
  icon?: string;
}

export interface CreateCategoryRequest {
  name: string;
  type: string;
  parent_id?: number | null;
  icon?: string;
  expense_nature?: string | null;
}

export interface CreateTransactionRequest {
  type: 'expense' | 'income';
  amount: number;
  category_id: number;
  sub_category_id?: number | null;
  account_id: number;
  date: string;
  note?: string;
  tags?: string[];
  expense_nature?: 'fixed' | 'variable' | 'discretionary' | null;
}

export interface TransactionQuery {
  type?: 'expense' | 'income';
  category_id?: number;
  account_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface CreateBudgetRequest {
  category_id: number;
  month: string;
  amount: number;
}

export interface TransferRequest {
  from_account_id: number;
  to_account_id: number;
  amount: number;
  date: string;
  note?: string;
}
