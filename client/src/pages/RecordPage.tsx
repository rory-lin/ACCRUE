import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mic, Calendar, Sparkles } from 'lucide-react';
import CategoryIcon from '@/components/category/CategoryIcon';
import NumberPad from '@/components/record/NumberPad';
import AmountDisplay from '@/components/record/AmountDisplay';
import { useAccountStore } from '@/stores/accountStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTransactionStore } from '@/stores/transactionStore';
import { parseInput } from '@/api/ai';
import { getSetting } from '@/api/settings';
import dayjs from 'dayjs';
import type { CategoryTreeNode } from '@/types';

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
  const [selectedCat, setSelectedCat] = useState<CategoryTreeNode | null>(null);
  const [selectedSubCatId, setSelectedSubCatId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [nature, setNature] = useState<string | null>(null);
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [listening, setListening] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');

  const tree = txType === 'expense' ? expenseTree : incomeTree;

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchCategories(), fetchAccounts()]);
      try {
        const res = await getSetting('default_account_id');
        if (res.data?.value) setAccountId(parseInt(res.data.value, 10));
      } catch { /* ignore */ }
    };
    init();
  }, []);

  const handleCatSelect = (cat: CategoryTreeNode) => {
    setSelectedCat(cat);
    setSelectedSubCatId(null);
    if (txType === 'expense' && cat.expense_nature) setNature(cat.expense_nature);
    else setNature(null);
  };

  const handleSubCatSelect = (subId: number, cat: CategoryTreeNode) => {
    setSelectedSubCatId(subId);
    setSelectedCat(cat);
    const sub = cat.children?.find(c => c.id === subId);
    if (txType === 'expense' && sub?.expense_nature) setNature(sub.expense_nature);
    else if (cat.expense_nature) setNature(cat.expense_nature);
  };

  const handleKeyInput = (key: string) => {
    if (key === '.' && amount.includes('.')) return;
    const lastPart = amount.split('.')[1];
    if (lastPart && lastPart.length >= 2) return;
    setAmount(prev => prev + key);
  };

  const handleDelete = () => setAmount(prev => prev.slice(0, -1));

  const handleConfirm = async () => {
    if (!selectedCat || !amount || parseFloat(amount) <= 0) return;
    if (!accountId) return;
    try {
      await addTransaction({
        type: txType,
        amount: parseFloat(amount),
        category_id: selectedSubCatId || selectedCat.id,
        sub_category_id: selectedSubCatId || null,
        account_id: accountId,
        date,
        note,
        tags: [],
        expense_nature: txType === 'expense' ? nature as 'fixed' | 'variable' | 'discretionary' | null : null,
      });
      navigate(-1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleAiParse = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const res = await parseInput(aiInput);
      console.log('[AI parse] response:', res);
      if (res.data) {
        const d = res.data;
        if (d.type) setTxType(d.type);
        if (d.category_id) {
          const cats = d.type === 'expense' ? expenseTree : incomeTree;
          console.log('[AI parse] looking for cat_id:', d.category_id, 'in', cats);
          const cat = cats.find(c => c.id === d.category_id);
          if (cat) {
            setSelectedCat(cat);
            if (d.sub_category_id) setSelectedSubCatId(d.sub_category_id);
          } else {
            console.warn('[AI parse] category not found:', d.category_id);
          }
        }
        if (d.amount) setAmount(String(d.amount));
        if (d.note) setNote(d.note);
        if (d.expense_nature) setNature(d.expense_nature);
      } else {
        alert('AI 未能解析，请重试');
      }
    } catch (err) {
      console.error('[AI parse] error:', err);
      alert('AI 解析失败');
    }
    finally { setAiLoading(false); }
  };

  const handleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('浏览器不支持语音'); return; }
    const rec = new SR();
    rec.lang = 'zh-CN';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = async (e: any) => {
      const text = e.results[0]?.[0]?.transcript;
      if (!text) return;
      setAiInput(text);
      try {
        const res = await parseInput(text);
        if (res.data) {
          const d = res.data;
          if (d.type) setTxType(d.type);
          if (d.category_id) {
            const cats = d.type === 'expense' ? expenseTree : incomeTree;
            const cat = cats.find(c => c.id === d.category_id);
            if (cat) { setSelectedCat(cat); if (d.sub_category_id) setSelectedSubCatId(d.sub_category_id); }
          }
          if (d.amount) setAmount(String(d.amount));
          if (d.note) setNote(d.note);
          if (d.expense_nature) setNature(d.expense_nature);
        }
      } catch { /* ignore */ }
    };
    rec.start();
  };

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto">

      {/* Top bar */}
      <div className="flex items-center h-12 px-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></button>
        <span className="ml-2 font-semibold">记一笔</span>
      </div>

      {/* Type toggle */}
      <div className="flex mx-4 mt-4 bg-gray-100 rounded-xl p-1">
        {(['expense', 'income'] as const).map(t => (
          <button key={t} onClick={() => { setTxType(t); setSelectedCat(null); setSelectedSubCatId(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${txType === t ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}>
            {t === 'expense' ? '支出' : '收入'}
          </button>
        ))}
      </div>

      {/* AI row */}
      <div className="mx-4 mt-3 flex gap-2">
        <input value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="说一句话，让 AI 帮你记账..."
          className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary"
          onKeyDown={e => e.key === 'Enter' && handleAiParse()} />
        <button onClick={handleAiParse} disabled={aiLoading}
          className="h-9 px-3 rounded-lg bg-purple-500 text-white text-sm flex items-center gap-1 active:scale-95 transition">
          <Sparkles className="w-4 h-4" /> AI
        </button>
        <button onClick={handleVoice}
          className={`h-9 px-3 rounded-lg border ${listening ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
          <Mic className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Category section */}
      <div className="flex-1 overflow-auto px-4 py-3">
        {(() => {
          // 3-column grid: row1=parents, row2=sub-cats (if selected), row3=remaining parents
          const COLS = 3;

          if (!selectedCat) {
            return (
              <div className="grid grid-cols-3 gap-2">
                {tree.map(cat => (
                  <button key={cat.id} onClick={() => handleCatSelect(cat)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50 border-2 border-transparent transition-all">
                    <CategoryIcon name={cat.name} icon={cat.icon} size="sm" />
                    <span className="text-xs text-text-secondary truncate w-full text-center">{cat.name}</span>
                    {cat.children && cat.children.length > 0 && (
                      <span className="text-[10px] text-primary">{cat.children.length}个子类</span>
                    )}
                  </button>
                ))}
              </div>
            );
          }

          const selectedIdx = tree.findIndex(c => c.id === selectedCat.id);
          const before = tree.slice(0, selectedIdx);
          const after = tree.slice(selectedIdx + 1);
          const hasSubCats = selectedCat.children && selectedCat.children.length > 0;

          // How many parents can fit in the selected parent's row after the selected parent
          const spotsInSelectedRow = COLS - (selectedIdx % COLS) - 1;
          const afterInSameRow = after.slice(0, spotsInSelectedRow);
          const afterInNextRows = after.slice(spotsInSelectedRow);

          return (
            <div className="space-y-2">
              {/* All parents in rows of 3 */}
              <div className="grid grid-cols-3 gap-2">
                {before.map(cat => (
                  <button key={cat.id} onClick={() => handleCatSelect(cat)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50 border-2 border-transparent transition-all">
                    <CategoryIcon name={cat.name} icon={cat.icon} size="sm" />
                    <span className="text-xs text-text-secondary truncate w-full text-center">{cat.name}</span>
                    {cat.children && cat.children.length > 0 && (
                      <span className="text-[10px] text-primary">{cat.children.length}个子类</span>
                    )}
                  </button>
                ))}

                {/* Selected parent */}
                <button onClick={() => handleCatSelect(selectedCat)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-blue-50 border-2 border-primary transition-all">
                  <CategoryIcon name={selectedCat.name} icon={selectedCat.icon} size="sm" />
                  <span className="text-xs text-text-secondary truncate w-full text-center">{selectedCat.name}</span>
                  {hasSubCats && (
                    <span className="text-[10px] text-primary">{selectedCat.children.length}个子类</span>
                  )}
                </button>

                {/* Other parents in the same row as selected */}
                {afterInSameRow.map(cat => (
                  <button key={cat.id} onClick={() => handleCatSelect(cat)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50 border-2 border-transparent transition-all">
                    <CategoryIcon name={cat.name} icon={cat.icon} size="sm" />
                    <span className="text-xs text-text-secondary truncate w-full text-center">{cat.name}</span>
                    {cat.children && cat.children.length > 0 && (
                      <span className="text-[10px] text-primary">{cat.children.length}个子类</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Sub-categories row — same card style as parents */}
              {hasSubCats && (
                <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-primary">
                  {selectedCat.children.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => handleSubCatSelect(sub.id, selectedCat)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-[80px] ${
                        selectedSubCatId === sub.id
                          ? 'bg-blue-50 border-2 border-primary'
                          : 'bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <CategoryIcon name={sub.name} icon={sub.icon} size="sm" />
                      <span className="text-xs text-text-secondary truncate w-full text-center">{sub.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Remaining parents */}
              {afterInNextRows.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {afterInNextRows.map(cat => (
                    <button key={cat.id} onClick={() => handleCatSelect(cat)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50 border-2 border-transparent transition-all">
                      <CategoryIcon name={cat.name} icon={cat.icon} size="sm" />
                      <span className="text-xs text-text-secondary truncate w-full text-center">{cat.name}</span>
                      {cat.children && cat.children.length > 0 && (
                        <span className="text-[10px] text-primary">{cat.children.length}个子类</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Remark + options */}
      <div className="px-4 pb-2 space-y-2">
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="添加备注..."
          className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary" />
        <div className="flex gap-2 text-xs">
          <select value={accountId ?? ''} onChange={e => setAccountId(Number(e.target.value))}
            className="flex-1 h-8 px-2 rounded-lg border border-gray-200 bg-white text-sm">
            <option value="">选择账户</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {txType === 'expense' && (
            <select value={nature ?? ''} onChange={e => setNature(e.target.value || null)}
              className="flex-1 h-8 px-2 rounded-lg border border-gray-200 bg-white text-sm">
              <option value="">属性</option>
              {NATURE_OPTIONS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
          )}
          <button onClick={() => { const d = prompt('日期 (YYYY-MM-DD)', date); if (d) setDate(d); }}
            className="h-8 px-3 rounded-lg border border-gray-200 flex items-center gap-1 text-sm">
            <Calendar className="w-3.5 h-3.5" /> {date.slice(5)}
          </button>
        </div>
      </div>

      <AmountDisplay amount={amount} />
      <NumberPad onInput={handleKeyInput} onDelete={handleDelete} onConfirm={handleConfirm} />
    </motion.div>
  );
}
