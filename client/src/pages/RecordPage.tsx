import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mic, Calendar } from 'lucide-react';
import CategoryIcon from '@/components/category/CategoryIcon';
import NumberPad from '@/components/record/NumberPad';
import AmountDisplay from '@/components/record/AmountDisplay';
import { useAccountStore } from '@/stores/accountStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTransactionStore } from '@/stores/transactionStore';
import { parseInput } from '@/api/ai';
import { getSetting } from '@/api/settings';
import dayjs from 'dayjs';

const NATURE_OPTIONS = [
  { label: '固定', value: 'fixed' },
  { label: '可变', value: 'variable' },
  { label: '非必要', value: 'discretionary' },
];

export default function RecordPage() {
  const navigate = useNavigate();
  const { accounts, fetchAccounts } = useAccountStore();
  const { expenseTree, incomeTree, fetchCategories } = useCategoryStore();
  const { addTransaction } = useTransactionStore();

  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [nature, setNature] = useState<string | null>(null);
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [listening, setListening] = useState(false);

  const tree = txType === 'expense' ? expenseTree : incomeTree;

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchCategories(), fetchAccounts()]);
      try {
        const res = await getSetting('default_account_id');
        if (res.data?.value) setAccountId(parseInt(res.data.value, 10));
      } catch { /* setting may not exist */ }
    };
    init();
  }, [fetchCategories, fetchAccounts]);

  const handleCategorySelect = (catId: number) => {
    setSelectedCatId(catId);
    const cat = tree.find(c => c.id === catId);
    if (cat?.expense_nature) setNature(cat.expense_nature);
    else setNature(null);
  };

  const handleKeyInput = (key: string) => {
    if (key === '.' && amount.includes('.')) return;
    if (amount.includes('.') && amount.split('.')[1]?.length !== undefined && amount.split('.')[1]!.length >= 2) return;
    setAmount(prev => prev + key);
  };

  const handleDelete = () => setAmount(prev => prev.slice(0, -1));

  const handleConfirm = async () => {
    if (!selectedCatId || !amount || parseFloat(amount) <= 0) return;
    if (!accountId) return;
    try {
      await addTransaction({
        type: txType,
        amount: parseFloat(amount),
        category_id: selectedCatId,
        sub_category_id: null,
        account_id: accountId,
        date,
        note,
        tags: [],
        expense_nature: txType === 'expense' ? nature as 'fixed' | 'variable' | 'discretionary' | null : null,
      });
      navigate(-1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '保存失败';
      alert(message);
    }
  };

  const handleVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { alert('浏览器不支持语音识别'); return; }
    const rec = new SR();
    rec.lang = 'zh-CN';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = async (e: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => {
      const text = e.results[0]?.[0]?.transcript;
      if (!text) return;
      setNote(text);
      try {
        const res = await parseInput(text);
        if (res.data) {
          const d = res.data;
          if (d.type) setTxType(d.type);
          if (d.category_id) setSelectedCatId(d.category_id);
          if (d.amount) setAmount(String(d.amount));
          if (d.note) setNote(d.note);
          if (d.expense_nature) setNature(d.expense_nature);
        }
      } catch { /* ai parse failed */ }
    };
    rec.start();
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto"
    >
      {/* Top bar */}
      <div className="flex items-center h-12 px-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="ml-2 font-semibold">记一笔</span>
      </div>

      {/* Type toggle */}
      <div className="flex mx-4 mt-4 bg-gray-100 rounded-xl p-1">
        {(['expense', 'income'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTxType(t); setSelectedCatId(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${txType === t ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
          >
            {t === 'expense' ? '支出' : '收入'}
          </button>
        ))}
      </div>

      {/* Category grid */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <div className="grid grid-cols-4 gap-2">
          {tree.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                selectedCatId === cat.id
                  ? 'bg-blue-50 border-2 border-primary'
                  : 'bg-gray-50 border-2 border-transparent'
              }`}
            >
              <CategoryIcon name={cat.name} size="sm" />
              <span className="text-xs text-text-secondary truncate w-full text-center">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Remark + options */}
      <div className="px-4 pb-2 space-y-2">
        <div className="flex gap-2">
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="添加备注..."
            className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleVoice}
            className={`px-3 rounded-lg border ${listening ? 'border-primary bg-blue-50' : 'border-gray-200'}`}
          >
            <Mic className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex gap-2 text-xs">
          <select
            value={accountId ?? ''}
            onChange={e => setAccountId(Number(e.target.value))}
            className="flex-1 h-8 px-2 rounded-lg border border-gray-200 bg-white text-sm"
          >
            <option value="">选择账户</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {txType === 'expense' && (
            <select
              value={nature ?? ''}
              onChange={e => setNature(e.target.value || null)}
              className="flex-1 h-8 px-2 rounded-lg border border-gray-200 bg-white text-sm"
            >
              <option value="">属性</option>
              {NATURE_OPTIONS.map(n => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => {
              const d = prompt('输入日期 (YYYY-MM-DD)', date);
              if (d) setDate(d);
            }}
            className="h-8 px-3 rounded-lg border border-gray-200 flex items-center gap-1 text-sm"
          >
            <Calendar className="w-3.5 h-3.5" /> {date.slice(5)}
          </button>
        </div>
      </div>

      {/* Amount */}
      <AmountDisplay amount={amount} />

      {/* Number pad */}
      <NumberPad onInput={handleKeyInput} onDelete={handleDelete} onConfirm={handleConfirm} />
    </motion.div>
  );
}
