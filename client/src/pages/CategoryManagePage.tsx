import { useEffect } from 'react';
import { useCategoryStore } from '@/stores/categoryStore';
import { updateCategory } from '@/api/categories';
import CategoryIcon from '@/components/category/CategoryIcon';

const NATURE_MAP: Record<string, string> = { fixed: '固定', variable: '可变', discretionary: '非必要' };

export default function CategoryManagePage() {
  const { expenseTree, incomeTree, fetchCategories } = useCategoryStore();

  useEffect(() => { fetchCategories(); }, []);

  const handleNatureChange = async (catId: number, nature: string) => {
    await updateCategory(catId, { expense_nature: nature } as any);
    fetchCategories(true);
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="font-semibold text-lg">支出分类</h2>
      <div className="space-y-2">
        {expenseTree.map(cat => (
          <div key={cat.id} className="flex items-center gap-3 p-3 bg-white rounded-xl">
            <CategoryIcon name={cat.name} size="sm" />
            <span className="flex-1 text-sm">{cat.name}</span>
            <select value={cat.expense_nature || ''} onChange={e => handleNatureChange(cat.id, e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1">
              <option value="">未设置</option>
              {Object.entries(NATURE_MAP).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        ))}
      </div>
      <h2 className="font-semibold text-lg">收入分类</h2>
      <div className="space-y-2">
        {incomeTree.map(cat => (
          <div key={cat.id} className="flex items-center gap-3 p-3 bg-white rounded-xl">
            <CategoryIcon name={cat.name} size="sm" />
            <span className="flex-1 text-sm">{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}