import { create } from 'zustand';
import { getCategories, createCategory, deleteCategory } from '../api/categories';
import type { CategoryTreeNode, CreateCategoryRequest } from '../types';

interface CategoryStore {
  expenseTree: CategoryTreeNode[];
  incomeTree: CategoryTreeNode[];
  loading: boolean;
  lastFetch: number;
  fetchCategories: (force?: boolean) => Promise<void>;
  addCategory: (data: CreateCategoryRequest) => Promise<void>;
  removeCategory: (id: number) => Promise<void>;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  expenseTree: [],
  incomeTree: [],
  loading: false,
  lastFetch: 0,
  fetchCategories: async (force?: boolean) => {
    const { expenseTree, incomeTree, lastFetch } = get();
    if (!force && Date.now() - lastFetch < CACHE_TTL && expenseTree.length > 0 && incomeTree.length > 0) return;
    set({ loading: true });
    try {
      const [expRes, incRes] = await Promise.all([
        getCategories('expense'),
        getCategories('income'),
      ]);
      set({ expenseTree: expRes.data || [], incomeTree: incRes.data || [], lastFetch: Date.now() });
    } finally {
      set({ loading: false });
    }
  },
  addCategory: async (data) => {
    await createCategory(data);
    await get().fetchCategories(true);
  },
  removeCategory: async (id) => {
    await deleteCategory(id);
    await get().fetchCategories(true);
  },
}));
