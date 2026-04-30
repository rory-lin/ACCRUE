import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Trash2 } from 'lucide-react';
import CategoryIcon from '@/components/category/CategoryIcon';
import { useTransactionStore } from '@/stores/transactionStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import type { Transaction } from '@/types';

const NATURE_LABELS: Record<string, string> = {
  fixed: '固定支出', variable: '可变支出', discretionary: '非必要支出',
};

interface TransactionDetailProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export default function TransactionDetail({ transaction: t, onClose }: TransactionDetailProps) {
  const navigate = useNavigate();
  const { removeTransaction } = useTransactionStore();
  const { fetchDashboard } = useDashboardStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = () => {
    if (!t) return;
    onClose();
    navigate('/record', { state: { transaction: t } });
  };

  const handleDelete = async () => {
    if (!t) return;
    setDeleting(true);
    try {
      await removeTransaction(t.id);
      await fetchDashboard();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <AnimatePresence>
      {t && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/30 z-[60]" />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[60] max-w-md mx-auto max-h-[85vh] overflow-auto"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold">交易详情</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
                  <CategoryIcon name={t.category_name || ''} size="lg" />
                </div>
                <div>
                  <div className="font-semibold">{t.category_name}{t.sub_category_name ? ` / ${t.sub_category_name}` : ''}</div>
                  <div className={t.type === 'expense' ? 'text-danger font-bold text-xl' : 'text-success font-bold text-xl'}>
                    {t.type === 'expense' ? '-' : '+'}¥{t.amount.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">类型</div><div>{t.type === 'expense' ? '支出' : '收入'}</div>
                <div className="text-gray-400">账户</div><div>{t.account_name || '-'}</div>
                <div className="text-gray-400">日期</div><div>{t.date}</div>
                {t.expense_nature && <><div className="text-gray-400">属性</div><div>{NATURE_LABELS[t.expense_nature]}</div></>}
                {t.note && <><div className="text-gray-400">备注</div><div>{t.note}</div></>}
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-4 pb-4 flex gap-2">
              {!confirmDelete ? (
                <>
                  <button onClick={handleEdit}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium flex items-center justify-center gap-1.5 active:scale-95 transition">
                    <Pencil className="w-4 h-4" /> 编辑
                  </button>
                  <button onClick={() => setConfirmDelete(true)}
                    className="flex-1 py-2.5 rounded-xl border border-red-200 text-danger text-sm font-medium flex items-center justify-center gap-1.5 active:scale-95 transition">
                    <Trash2 className="w-4 h-4" /> 删除
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium active:scale-95 transition">
                    取消
                  </button>
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl bg-danger text-white text-sm font-medium flex items-center justify-center gap-1.5 active:scale-95 transition disabled:opacity-50">
                    {deleting ? '删除中...' : '确认删除'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
