import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Tags, PieChart, CreditCard } from 'lucide-react';
import { useAccountStore } from '@/stores/accountStore';
import { setSetting, getSetting } from '@/api/settings';
import { useState, useEffect } from 'react';

interface SettingsPageProps { onLogout: () => void; }

export default function SettingsPage({ onLogout }: SettingsPageProps) {
  const navigate = useNavigate();
  const { accounts, fetchAccounts } = useAccountStore();
  const [defaultId, setDefaultId] = useState('');

  useEffect(() => {
    fetchAccounts();
    getSetting('default_account_id').then(r => { if (r.data?.value) setDefaultId(r.data.value); }).catch(() => {});
  }, []);

  const handleDefault = async (val: string) => {
    setDefaultId(val);
    await setSetting('default_account_id', val);
  };

  return (
    <div className="p-4 space-y-1">
      <button onClick={() => navigate('/settings/categories')} className="w-full flex items-center justify-between p-4 bg-white rounded-xl active:bg-gray-50">
        <div className="flex items-center gap-3"><Tags className="w-5 h-5 text-gray-400" /><span className="text-sm">分类管理</span></div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </button>
      <button onClick={() => navigate('/settings/budgets')} className="w-full flex items-center justify-between p-4 bg-white rounded-xl active:bg-gray-50">
        <div className="flex items-center gap-3"><PieChart className="w-5 h-5 text-gray-400" /><span className="text-sm">预算管理</span></div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </button>
      <div className="flex items-center justify-between p-4 bg-white rounded-xl">
        <div className="flex items-center gap-3"><CreditCard className="w-5 h-5 text-gray-400" /><span className="text-sm">默认账户</span></div>
        <select value={defaultId} onChange={e => handleDefault(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1">
          <option value="">未设置</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <button onClick={onLogout} className="w-full flex items-center gap-3 p-4 bg-white rounded-xl active:bg-gray-50 text-danger">
        <LogOut className="w-5 h-5" /><span className="text-sm">退出登录</span>
      </button>
    </div>
  );
}