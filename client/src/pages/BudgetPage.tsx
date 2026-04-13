import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useCategoryStore } from '@/stores/categoryStore';
import { getBudgetStatus, setBudget } from '@/api/budgets';

export default function BudgetPage() {
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [budgets, setBudgets] = useState<any[]>([]);
  const [newAmounts, setNewAmounts] = useState<Record<number, string>>({});
  const { expenseTree, fetchCategories } = useCategoryStore();

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { getBudgetStatus(month).then(r => setBudgets(r.data || [])); }, [month]);

  const handleSet = async (catId: number) => {
    const amt = parseFloat(newAmounts[catId] || '0');
    if (amt > 0) { await setBudget({ category_id: catId, month, amount: amt }); setNewAmounts(p => { const n = {...p}; delete n[catId]; return n; }); }
    getBudgetStatus(month).then(r => setBudgets(r.data || []));
  };

  const budgetedIds = new Set(budgets.map(b => b.category_id));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-semibold text-lg">预算管理</h2>
        <input type="month" value={month.slice(0,7)} onChange={e => setMonth(e.target.value + '-01')}
          className="ml-auto text-sm border border-gray-200 rounded-lg px-2 py-1" />
      </div>
      {budgets.map(b => (
        <div key={b.category_id} className="p-4 bg-white rounded-2xl">
          <div className="flex justify-between mb-2"><span className="text-sm font-medium">{b.category_name}</span><span className="text-sm text-gray-400">¥{b.actual_spent.toFixed(2)} / ¥{b.budget_amount.toFixed(2)}</span></div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
            <div className={`h-full rounded-full ${b.is_over ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${Math.min(Math.round((b.actual_spent / b.budget_amount) * 100), 100)}%` }} />
          </div>
          <div className="text-xs text-gray-400">{Math.round((b.actual_spent / b.budget_amount) * 100)}% 已使用</div>
        </div>
      ))}
      {expenseTree.filter(c => !budgetedIds.has(c.id)).map(cat => (
        <div key={cat.id} className="flex items-center gap-2 p-3 bg-white rounded-xl">
          <span className="flex-1 text-sm">{cat.name}</span>
          <input type="number" placeholder="预算金额" value={newAmounts[cat.id] || ''}
            onChange={e => setNewAmounts(p => ({...p, [cat.id]: e.target.value}))}
            className="w-24 h-8 px-2 text-sm border border-gray-200 rounded-lg" />
          <button onClick={() => handleSet(cat.id)} className="h-8 px-3 rounded-lg bg-primary text-white text-xs">设置</button>
        </div>
      ))}
    </div>
  );
}