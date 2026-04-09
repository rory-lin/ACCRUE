import { api } from './client';
import type { ApiResponse, CategoryTreeNode, CreateCategoryRequest, Category } from '../types';

export const getCategories = (type?: string) =>
  api.get<ApiResponse<CategoryTreeNode[]>>(`/categories${type ? `?type=${type}` : ''}`);

export const createCategory = (data: CreateCategoryRequest) =>
  api.post<ApiResponse<Category>>('/categories', data);

export const updateCategory = (id: number, data: Partial<Category>) =>
  api.put<ApiResponse<Category>>(`/categories/${id}`, data);

export const deleteCategory = (id: number) =>
  api.delete<ApiResponse<{ deleted: boolean }>>(`/categories/${id}`);
