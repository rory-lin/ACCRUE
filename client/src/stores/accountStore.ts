import { create } from 'zustand';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api/accounts';
import type { Account, CreateAccountRequest } from '../types';

interface AccountStore {
  accounts: Account[];
  loading: boolean;
  fetchAccounts: () => Promise<void>;
  addAccount: (data: CreateAccountRequest) => Promise<void>;
  editAccount: (id: number, data: Partial<Account>) => Promise<void>;
  removeAccount: (id: number) => Promise<void>;
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  loading: false,
  fetchAccounts: async () => {
    set({ loading: true });
    try {
      const res = await getAccounts();
      set({ accounts: res.data || [] });
    } finally {
      set({ loading: false });
    }
  },
  addAccount: async (data) => {
    await createAccount(data);
    await get().fetchAccounts();
  },
  editAccount: async (id, data) => {
    await updateAccount(id, data);
    await get().fetchAccounts();
  },
  removeAccount: async (id) => {
    await deleteAccount(id);
    await get().fetchAccounts();
  },
}));
