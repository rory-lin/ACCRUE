import { create } from 'zustand';
import { getSummary, getByCategory } from '../api/stats';
import { getTransactions } from '../api/transactions';
import type { Transaction } from '../types';

interface DashboardData {
  income: number;
  expense: number;
  recentTransactions: Transaction[];
  topCategories: { name: string; total: number; count: number }[];
}

interface DashboardStore extends DashboardData {
  loading: boolean;
  lastFetch: number;
  fetchDashboard: (force?: boolean) => Promise<void>;
}

const CACHE_TTL = 30 * 1000; // 30 seconds

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  income: 0,
  expense: 0,
  recentTransactions: [],
  topCategories: [],
  loading: false,
  lastFetch: 0,
  fetchDashboard: async (force?: boolean) => {
    const { lastFetch, recentTransactions } = get();
    if (!force && Date.now() - lastFetch < CACHE_TTL && recentTransactions.length > 0) return;

    set({ loading: true });
    try {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

      const [summaryRes, txnRes, catRes] = await Promise.all([
        getSummary(monthStart, monthEnd),
        getTransactions({ page: 1, page_size: 5 }),
        getByCategory('expense', monthStart, monthEnd),
      ]);

      const summary = summaryRes.data || [];
      const income = summary.find((s: any) => s.type === 'income')?.total || 0;
      const expense = summary.find((s: any) => s.type === 'expense')?.total || 0;

      set({
        income,
        expense,
        recentTransactions: txnRes.data?.items || [],
        topCategories: (catRes.data || []).slice(0, 5),
        lastFetch: Date.now(),
      });
    } finally {
      set({ loading: false });
    }
  },
}));
