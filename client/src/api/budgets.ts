import { api } from './client';
import type { ApiResponse, BudgetStatus, CreateBudgetRequest, Budget } from '../types';

export const getBudgets = (month: string) =>
  api.get<ApiResponse<Budget[]>>(`/budgets?month=${month}`);

export const setBudget = (data: CreateBudgetRequest) =>
  api.post<ApiResponse<Budget>>('/budgets', data);

export const deleteBudget = (id: number) =>
  api.delete<ApiResponse<{ deleted: boolean }>>(`/budgets/${id}`);

export const getBudgetStatus = (month: string) =>
  api.get<ApiResponse<BudgetStatus[]>>(`/budgets/status?month=${month}`);
