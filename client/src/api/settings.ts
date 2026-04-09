import { api } from './client';
import type { ApiResponse } from '../types';

export const getSetting = (key: string) =>
  api.get<ApiResponse<{ key: string; value: string }>>(`/settings/${key}`);

export const setSetting = (key: string, value: string) =>
  api.put<ApiResponse<{ key: string; value: string }>>(`/settings/${key}`, { value });
