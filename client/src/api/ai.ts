import { api } from './client';
import type { ApiResponse, CreateTransactionRequest } from '../types';

export const parseInput = (input: string) =>
  api.post<ApiResponse<CreateTransactionRequest>>('/ai/parse', { input });
