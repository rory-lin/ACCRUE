import { cn } from '@/lib/utils';
import CategoryIcon from '@/components/category/CategoryIcon';
import type { Transaction } from '@/types';

const NATURE_LABELS: Record<string, string> = {
  fixed: '固定', variable: '可变', discretionary: '非必要',
};

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
}

export default function TransactionItem({ transaction: t, onClick }: TransactionItemProps) {
  const isExpense = t.type === 'expense';
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 bg-white rounded-xl active:bg-gray-50 transition-colors text-left">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
        <CategoryIcon name={t.category_name || ''} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{t.category_name || ''}</span>
          {t.sub_category_name && <span className="text-xs text-gray-400">{t.sub_category_name}</span>}
          {t.expense_nature && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-primary">{NATURE_LABELS[t.expense_nature]}</span>}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">{t.note || t.account_name || ''}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className={cn('font-semibold text-sm', isExpense ? 'text-danger' : 'text-success')}>
          {isExpense ? '-' : '+'}¥{t.amount.toFixed(2)}
        </span>
        <div className="text-[10px] text-gray-300">{t.date}</div>
      </div>
    </button>
  );
}
