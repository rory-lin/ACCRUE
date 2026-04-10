import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import CategoryIcon from '@/components/category/CategoryIcon';
import type { Transaction } from '@/types';

const NATURE_LABELS: Record<string, string> = {
  fixed: '固定支出', variable: '可变支出', discretionary: '非必要支出',
};

interface TransactionDetailProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export default function TransactionDetail({ transaction: t, onClose }: TransactionDetailProps) {
  return (
    <AnimatePresence>
      {t && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/30 z-50" />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-w-md mx-auto"
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
