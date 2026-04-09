import { create } from 'zustand';
import { getCategories, createCategory, deleteCategory } from '../api/categories';
import type { CategoryTreeNode, CreateCategoryRequest } from '../types';

interface CategoryStore {
  expenseTree: CategoryTreeNode[];
  incomeTree: CategoryTreeNode[];
  loading: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (data: CreateCategoryRequest) => Promise<void>;
  removeCategory: (id: number) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  expenseTree: [],
  incomeTree: [],
  loading: false,
  fetchCategories: async () => {
    set({ loading: true });
    try {
      const [expRes, incRes] = await Promise.all([
        getCategories('expense'),
        getCategories('income'),
      ]);
      set({ expenseTree: expRes.data || [], incomeTree: incRes.data || [] });
    } finally {
      set({ loading: false });
    }
  },
  addCategory: async (data) => {
    await createCategory(data);
    await get().fetchCategories();
  },
  removeCategory: async (id) => {
    await deleteCategory(id);
    await get().fetchCategories();
  },
}));
