import { api } from './client';
import type { ApiResponse, PaginatedData, Transaction, CreateTransactionRequest, TransactionQuery } from '../types';

function buildQuery(params: TransactionQuery): string {
  const qs = new URLSearchParams();
  if (params.type) qs.set('type', params.type);
  if (params.category_id) qs.set('category_id', String(params.category_id));
  if (params.account_id) qs.set('account_id', String(params.account_id));
  if (params.date_from) qs.set('date_from', params.date_from);
  if (params.date_to) qs.set('date_to', params.date_to);
  if (params.page) qs.set('page', String(params.page));
  if (params.page_size) qs.set('page_size', String(params.page_size));
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const getTransactions = (params: TransactionQuery = {}) =>
  api.get<ApiResponse<PaginatedData<Transaction>>>(`/transactions${buildQuery(params)}`);

export const getTransaction = (id: number) =>
  api.get<ApiResponse<Transaction>>(`/transactions/${id}`);

export const createTransaction = (data: CreateTransactionRequest) =>
  api.post<ApiResponse<Transaction>>('/transactions', data);

export const updateTransaction = (id: number, data: Partial<Transaction>) =>
  api.put<ApiResponse<Transaction>>(`/transactions/${id}`, data);

export const deleteTransaction = (id: number) =>
  api.delete<ApiResponse<{ deleted: boolean }>>(`/transactions/${id}`);
