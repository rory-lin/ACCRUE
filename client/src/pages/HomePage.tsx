import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import GradientCard from '@/components/cards/GradientCard';
import TransactionItem from '@/components/transaction/TransactionItem';
import TransactionDetail from '@/components/transaction/TransactionDetail';
import { useDashboardStore } from '@/stores/dashboardStore';
import type { Transaction } from '@/types';

export default function HomePage() {
  const navigate = useNavigate();
  const { income, expense, recentTransactions, fetchDashboard } = useDashboardStore();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const balance = income - expense;

  return (
    <div className="p-4 space-y-4">
      <GradientCard>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-white/70">本月收入</div>
            <div className="text-lg font-bold">¥{income.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-white/70">本月支出</div>
            <div className="text-lg font-bold">¥{expense.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-white/70">本月结余</div>
            <div className="text-lg font-bold">¥{balance.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-white/70">交易笔数</div>
            <div className="text-lg font-bold">{recentTransactions.length}笔</div>
          </div>
        </div>
      </GradientCard>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/record')}
        className="w-full py-3 rounded-xl border-2 border-dashed border-primary/40 text-primary font-medium flex items-center justify-center gap-2 bg-white hover:bg-blue-50/50 transition-colors"
      >
        <Plus className="w-5 h-5" /> 新增一笔记账
      </motion.button>

      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-2">最近交易</h3>
        <div className="space-y-1">
          {recentTransactions.map(t => (
            <TransactionItem key={t.id} transaction={t} onClick={() => setSelectedTx(t)} />
          ))}
          {recentTransactions.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-300">暂无交易记录</div>
          )}
        </div>
      </div>

      <TransactionDetail transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
}
