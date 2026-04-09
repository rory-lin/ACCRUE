import { api } from './client';
import type { ApiResponse, Account } from '../types';

export const getSummary = (dateFrom: string, dateTo: string) =>
  api.get<ApiResponse<{ type: string; total: number }[]>>(`/stats/summary?date_from=${dateFrom}&date_to=${dateTo}`);

export const getByCategory = (type: string, dateFrom: string, dateTo: string) =>
  api.get<ApiResponse<{ category_id: number; name: string; total: number; count: number }[]>>(`/stats/by-category?type=${type}&date_from=${dateFrom}&date_to=${dateTo}`);

export const getTrend = (granularity: string, dateFrom: string, dateTo: string) =>
  api.get<ApiResponse<{ date: string; type: string; total: number }[]>>(`/stats/trend?granularity=${granularity}&date_from=${dateFrom}&date_to=${dateTo}`);

export const getBalanceOverview = () =>
  api.get<ApiResponse<Account[]>>('/stats/balance-overview');
