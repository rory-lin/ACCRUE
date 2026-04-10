import { api } from './client';
import type { ApiResponse } from '../types';

export const login = (username: string, password: string) =>
  api.post<ApiResponse<{ token: string; username: string }>>('/auth/login', { username, password });
