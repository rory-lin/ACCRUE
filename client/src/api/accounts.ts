import { api } from './client';
import type { ApiResponse, Account, CreateAccountRequest } from '../types';

export const getAccounts = () =>
  api.get<ApiResponse<Account[]>>('/accounts');

export const createAccount = (data: CreateAccountRequest) =>
  api.post<ApiResponse<Account>>('/accounts', data);

export const updateAccount = (id: number, data: Partial<Account>) =>
  api.put<ApiResponse<Account>>(`/accounts/${id}`, data);

export const deleteAccount = (id: number) =>
  api.delete<ApiResponse<{ deleted: boolean }>>(`/accounts/${id}`);
