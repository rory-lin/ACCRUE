import { create } from 'zustand';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api/accounts';
import type { Account, CreateAccountRequest } from '../types';

interface AccountStore {
  accounts: Account[];
  loading: boolean;
  lastFetch: number;
  fetchAccounts: (force?: boolean) => Promise<void>;
  addAccount: (data: CreateAccountRequest) => Promise<void>;
  editAccount: (id: number, data: Partial<Account>) => Promise<void>;
  removeAccount: (id: number) => Promise<void>;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  loading: false,
  lastFetch: 0,
  fetchAccounts: async (force?: boolean) => {
    const { accounts, lastFetch } = get();
    if (!force && Date.now() - lastFetch < CACHE_TTL && accounts.length > 0) return;
    set({ loading: true });
    try {
      const res = await getAccounts();
      set({ accounts: res.data || [], lastFetch: Date.now() });
    } finally {
      set({ loading: false });
    }
  },
  addAccount: async (data) => {
    await createAccount(data);
    await get().fetchAccounts(true);
  },
  editAccount: async (id, data) => {
    await updateAccount(id, data);
    await get().fetchAccounts(true);
  },
  removeAccount: async (id) => {
    await deleteAccount(id);
    await get().fetchAccounts(true);
  },
}));
