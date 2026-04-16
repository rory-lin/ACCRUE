import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import TransactionItem from '@/components/transaction/TransactionItem';
import TransactionDetail from '@/components/transaction/TransactionDetail';
import { getTransactions } from '@/api/transactions';
import type { Transaction } from '@/types';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const monthStart = currentMonth.startOf('month').format('YYYY-MM-DD');
  const monthEnd = currentMonth.endOf('month').format('YYYY-MM-DD');

  useEffect(() => {
    getTransactions({ date_from: monthStart, date_to: monthEnd, page: 1, page_size: 500 }).then(res => {
      setTransactions(res.data?.items || []);
    });
  }, [monthStart, monthEnd]);

  const dateMap = useMemo(() => {
    const map: Record<string, { expense: boolean; income: boolean; expenseAmt: number; incomeAmt: number }> = {};
    transactions.forEach(t => {
      if (!map[t.date]) map[t.date] = { expense: false, income: false, expenseAmt: 0, incomeAmt: 0 };
      if (t.type === 'expense') { map[t.date]!.expense = true; map[t.date]!.expenseAmt += t.amount; }
      if (t.type === 'income') { map[t.date]!.income = true; map[t.date]!.incomeAmt += t.amount; }
    });
    return map;
  }, [transactions]);

  const selectedDayTransactions = transactions.filter(t => t.date === selectedDate);
  const dayInfo = dateMap[selectedDate];

  const startDay = currentMonth.startOf('month');
  const endDay = currentMonth.endOf('month');
  const startDow = startDay.day() === 0 ? 6 : startDay.day() - 1;
  const daysInMonth = endDay.date();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))} className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-5 h-5" /></button>
        <span className="font-semibold">{currentMonth.format('YYYY年M月')}</span>
        <button onClick={() => setCurrentMonth(m => m.add(1, 'month'))} className="p-2 rounded-lg hover:bg-gray-100"><ChevronRight className="w-5 h-5" /></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map(d => <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const dateStr = currentMonth.date(day).format('YYYY-MM-DD');
          const info = dateMap[dateStr];
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          return (
            <button key={dateStr} onClick={() => setSelectedDate(dateStr)} className="flex flex-col items-center py-1.5 rounded-lg">
              <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${isSelected ? 'bg-primary text-white font-bold' : isToday ? 'bg-blue-50 text-primary font-medium' : ''}`}>{day}</span>
              {info && (info.expense || info.income) && (
                <div className="flex gap-0.5 mt-0.5">
                  {info.expense && <div className="w-1.5 h-1.5 rounded-full bg-danger" />}
                  {info.income && <div className="w-1.5 h-1.5 rounded-full bg-success" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Daily summary */}
      {dayInfo && (
        <div className="mt-4 flex gap-3">
          {dayInfo.expenseAmt > 0 && (
            <div className="flex-1 p-3 bg-white rounded-xl border border-gray-100">
              <div className="text-xs text-gray-400 mb-1">支出</div>
              <div className="text-sm font-bold text-danger">-¥{dayInfo.expenseAmt.toFixed(2)}</div>
            </div>
          )}
          {dayInfo.incomeAmt > 0 && (
            <div className="flex-1 p-3 bg-white rounded-xl border border-gray-100">
              <div className="text-xs text-gray-400 mb-1">收入</div>
              <div className="text-sm font-bold text-success">+¥{dayInfo.incomeAmt.toFixed(2)}</div>
            </div>
          )}
          {!dayInfo.expense && !dayInfo.income && (
            <div className="w-full p-3 bg-white rounded-xl border border-gray-100 text-center text-sm text-gray-400">当日无交易</div>
          )}
        </div>
      )}

      <div className="mt-3">
        <div className="space-y-1">
          {selectedDayTransactions.map(t => <TransactionItem key={t.id} transaction={t} onClick={() => setSelectedTx(t)} />)}
        </div>
      </div>

      <TransactionDetail transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
}
