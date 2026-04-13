import { create } from 'zustand';
import { getSummary, getByCategory, getTrend, getBalanceOverview } from '../api/stats';
import type { Account } from '../types';

interface StatsData {
  summary: { type: string; total: number }[];
  categoryData: { name: string; total: number; count: number }[];
  trendData: { date: string; type: string; total: number }[];
  balanceData: Account[];
}

interface StatsStore extends StatsData {
  loading: boolean;
  lastFetchKey: string;
  loadStats: (dateFrom: string, dateTo: string, force?: boolean) => Promise<void>;
}

const CACHE_TTL = 30 * 1000; // 30 seconds

export const useStatsStore = create<StatsStore>((set, get) => ({
  summary: [],
  categoryData: [],
  trendData: [],
  balanceData: [],
  loading: false,
  lastFetchKey: '',
  loadStats: async (dateFrom: string, dateTo: string, force?: boolean) => {
    const key = `${dateFrom}_${dateTo}`;
    const { lastFetchKey, summary } = get();
    if (!force && lastFetchKey === key && summary.length > 0 && Date.now() - (get() as any)._lastFetch < CACHE_TTL) return;

    set({ loading: true });
    try {
      const [sumRes, catRes, trendRes, balRes] = await Promise.all([
        getSummary(dateFrom, dateTo),
        getByCategory('expense', dateFrom, dateTo),
        getTrend('daily', dateFrom, dateTo),
        getBalanceOverview(),
      ]);
      set({
        summary: sumRes.data || [],
        categoryData: catRes.data || [],
        trendData: trendRes.data || [],
        balanceData: balRes.data || [],
        lastFetchKey: key,
        _lastFetch: Date.now(),
      } as any);
    } finally {
      set({ loading: false });
    }
  },
}));
