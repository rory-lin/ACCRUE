import { create } from 'zustand';
import { getTransactions, createTransaction, deleteTransaction, updateTransaction } from '../api/transactions';
import type { Transaction, CreateTransactionRequest, TransactionQuery } from '../types';

interface TransactionStore {
  transactions: Transaction[];
  total: number;
  loading: boolean;
  query: TransactionQuery;
  fetchTransactions: (query?: TransactionQuery) => Promise<void>;
  addTransaction: (data: CreateTransactionRequest) => Promise<void>;
  editTransaction: (id: number, data: Partial<Transaction>) => Promise<void>;
  removeTransaction: (id: number) => Promise<void>;
  setQuery: (query: TransactionQuery) => void;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  total: 0,
  loading: false,
  query: { page: 1, page_size: 20 },
  fetchTransactions: async (query?: TransactionQuery) => {
    const q = query || get().query;
    set({ loading: true, query: q });
    try {
      const res = await getTransactions(q);
      set({ transactions: res.data?.items || [], total: res.data?.total || 0 });
    } finally {
      set({ loading: false });
    }
  },
  addTransaction: async (data) => {
    await createTransaction(data);
    await get().fetchTransactions();
  },
  editTransaction: async (id, data) => {
    await updateTransaction(id, data);
    await get().fetchTransactions();
  },
  removeTransaction: async (id) => {
    await deleteTransaction(id);
    await get().fetchTransactions();
  },
  setQuery: (query) => set({ query }),
}));
