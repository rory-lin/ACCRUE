import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import GradientCard from '@/components/cards/GradientCard';
import { useAccountStore } from '@/stores/accountStore';
import type { Account } from '@/types';

export default function AccountsPage() {
  const { accounts, fetchAccounts, addAccount, editAccount, removeAccount } = useAccountStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('0');

  useEffect(() => { fetchAccounts(); }, []);

  const total = accounts.reduce((s, a) => s + a.balance, 0);

  const openAdd = () => { setEditTarget(null); setName(''); setBalance('0'); setDialogOpen(true); };
  const openEdit = (a: Account) => { setEditTarget(a); setName(a.name); setBalance(String(a.initial_balance)); setDialogOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editTarget) {
      await editAccount(editTarget.id, { name, initial_balance: parseFloat(balance) || 0 });
    } else {
      await addAccount({ name, type: 'other', initial_balance: parseFloat(balance) || 0 });
    }
    setDialogOpen(false);
    fetchAccounts(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确认删除？')) { await removeAccount(id); fetchAccounts(true); }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">账户管理</h2>
        <button onClick={openAdd} className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center"><Plus className="w-5 h-5" /></button>
      </div>
      <GradientCard>
        <div className="text-xs text-white/70">总资产</div>
        <div className="text-2xl font-bold">¥{total.toFixed(2)}</div>
      </GradientCard>
      <div className="grid grid-cols-2 gap-3">
        {accounts.map(a => (
          <div key={a.id} className="relative group">
            <button onClick={() => openEdit(a)} className="w-full p-4 bg-white rounded-2xl shadow-sm text-left active:scale-[0.98] transition-transform">
              <div className="text-sm text-gray-500 mb-1">{a.name}</div>
              <div className={`text-xl font-bold ${a.balance < 0 ? 'text-danger' : 'text-text'}`}>¥{a.balance.toFixed(2)}</div>
            </button>
            <button onClick={() => handleDelete(a.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs text-gray-300 hover:text-danger transition-opacity">删除</button>
          </div>
        ))}
      </div>
      {dialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center" onClick={() => setDialogOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold">{editTarget ? '编辑账户' : '添加账户'}</h3>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="账户名称"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm" />
            <input value={balance} onChange={e => setBalance(e.target.value)} placeholder="初始余额" type="number"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm" />
            <div className="flex gap-2">
              <button onClick={() => setDialogOpen(false)} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm">取消</button>
              <button onClick={handleSave} className="flex-1 h-10 rounded-xl bg-primary text-white text-sm">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}