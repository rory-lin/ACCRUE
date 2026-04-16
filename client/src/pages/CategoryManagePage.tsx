import { useState, useEffect, useRef } from 'react';
import { Plus, Upload, X, Trash2, Edit2, Loader2 } from 'lucide-react';
import { useCategoryStore } from '@/stores/categoryStore';
import { updateCategory, createCategory, deleteCategory } from '@/api/categories';
import CategoryIcon, { CATEGORY_ICONS } from '@/components/category/CategoryIcon';
import type { CategoryTreeNode } from '@/types';

const NATURE_MAP: Record<string, string> = { fixed: '固定', variable: '可变', discretionary: '非必要' };
const NATURE_OPTIONS = Object.entries(NATURE_MAP).map(([v, l]) => ({ value: v, label: l }));
const EMOJI_GRID = [...new Set(Object.values(CATEGORY_ICONS))];
const COLS = 3;

/* ─── Edit Dialog ─── */

interface EditDialogProps {
  mode: 'add-parent' | 'add-sub' | 'edit';
  parentCat?: CategoryTreeNode;
  editCat?: CategoryTreeNode;
  defaultType?: 'expense' | 'income';
  onClose: () => void;
  onSave: (data: { name: string; type: 'expense' | 'income'; icon: string; expense_nature?: string }) => void;
  onDelete?: () => void;
}

function EditDialog({ mode, parentCat, editCat, defaultType, onClose, onSave, onDelete }: EditDialogProps) {
  const isEdit = mode === 'edit';
  const [name, setName] = useState(editCat?.name || '');
  const [type, setType] = useState<'expense' | 'income'>(
    isEdit ? (editCat?.type as 'expense' | 'income') : (parentCat?.type as 'expense' | 'income') || defaultType || 'expense'
  );
  const [icon, setIcon] = useState(editCat?.icon || parentCat?.icon || '');
  const [nature, setNature] = useState(editCat?.expense_nature || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/icon', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.data?.url) setIcon(json.data.url);
    } catch { alert('上传失败'); }
    finally { setUploading(false); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{mode === 'add-parent' ? '添加父分类' : mode === 'add-sub' ? '添加子分类' : '编辑分类'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
            {icon ? <CategoryIcon name={name || '其他'} icon={icon} size="md" /> : <span className="text-gray-300 text-2xl">?</span>}
          </div>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-600">
            <Upload className="w-4 h-4" />{uploading ? '上传中...' : '上传图标'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {icon && <button onClick={() => setIcon('')} className="text-xs text-gray-400 hover:text-red-400">清除</button>}
        </div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="分类名称"
          className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm" />
        {mode === 'add-parent' && (
          <select value={type} onChange={e => setType(e.target.value as 'expense' | 'income')}
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm">
            <option value="expense">支出</option><option value="income">收入</option>
          </select>
        )}
        {type === 'expense' && (
          <select value={nature} onChange={e => setNature(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm">
            <option value="">默认属性（可选）</option>
            {NATURE_OPTIONS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
        )}
        <div>
          <div className="text-xs text-gray-400 mb-1.5">或选择 emoji</div>
          <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
            {EMOJI_GRID.map((e, i) => (
              <button key={i} onClick={() => setIcon(e)}
                className={`text-xl h-8 rounded-lg flex items-center justify-center ${icon === e ? 'bg-blue-50 ring-2 ring-primary' : 'hover:bg-gray-50'}`}>{e}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {isEdit && onDelete && (
            <button onClick={onDelete} className="flex items-center gap-1 h-10 px-3 rounded-xl border border-red-400 text-red-400 text-sm">
              <Trash2 className="w-4 h-4" />删除
            </button>
          )}
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm">取消</button>
          <button onClick={() => { if (name.trim()) onSave({ name: name.trim(), type, icon, expense_nature: nature || undefined }); }}
            className="flex-1 h-10 rounded-xl bg-primary text-white text-sm">保存</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function CategoryManagePage() {
  const { expenseTree, incomeTree, loading, fetchCategories } = useCategoryStore();
  const [selectedCat, setSelectedCat] = useState<CategoryTreeNode | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [dialog, setDialog] = useState<{ mode: 'add-parent' | 'add-sub' | 'edit'; cat?: CategoryTreeNode } | null>(null);

  useEffect(() => { fetchCategories(); }, []);

  const tree = [...expenseTree, ...incomeTree];

  const openEdit = (cat: CategoryTreeNode, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDialog({ mode: 'edit', cat });
  };

  const handleSave = async (data: { name: string; type: 'expense' | 'income'; icon: string; expense_nature?: string }) => {
    if (dialog?.mode === 'edit' && dialog.cat) {
      await updateCategory(dialog.cat.id, { name: data.name, icon: data.icon, expense_nature: data.expense_nature } as any);
    } else if (dialog?.mode === 'add-sub' && dialog.cat) {
      await createCategory({ name: data.name, type: dialog.cat.type, parent_id: dialog.cat.id, icon: data.icon });
    } else {
      await createCategory({ name: data.name, type: data.type, icon: data.icon });
    }
    setDialog(null);
    setSelectedCat(null);
    setSelectedSubId(null);
    fetchCategories(true);
  };

  const handleDelete = async () => {
    if (!dialog?.cat) return;
    if (!confirm(`确认删除「${dialog.cat.name}」？`)) return;
    await deleteCategory(dialog.cat.id);
    setDialog(null);
    setSelectedCat(null);
    fetchCategories(true);
  };

  const handleSubClick = (sub: CategoryTreeNode) => {
    setSelectedSubId(sub.id);
    openEdit(sub);
  };

  /* ─── Split logic (only when selectedCat exists) ─── */
  let before: CategoryTreeNode[] = [];
  let afterSame: CategoryTreeNode[] = [];
  let afterNext: CategoryTreeNode[] = [];

  if (selectedCat) {
    const idx = tree.findIndex(c => c.id === selectedCat.id);
    before = idx > 0 ? tree.slice(0, idx) : [];
    const after = tree.slice(idx + 1);
    const spots = COLS - (idx % COLS) - 1;
    afterSame = after.slice(0, spots);
    afterNext = after.slice(spots);
  }

  const hasSubCats = selectedCat?.children && selectedCat.children.length > 0;

  /* ─── CatCard helper ─── */
  const CatCard = ({ cat, selected }: { cat: CategoryTreeNode; selected: boolean }) => (
    <div className="relative group">
      <button
        onClick={() => { setSelectedCat(prev => prev?.id === cat.id ? null : cat); setSelectedSubId(null); }}
        className={`w-full flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
          selected ? 'bg-blue-50 border-2 border-primary' : 'bg-gray-50 border-2 border-transparent'
        }`}
      >
        <CategoryIcon name={cat.name} icon={cat.icon} size="sm" />
        <span className="text-xs text-text-secondary truncate w-full text-center">{cat.name}</span>
        {cat.children && cat.children.length > 0 && (
          <span className="text-[10px] text-primary">{cat.children.length}个子类</span>
        )}
      </button>
      <button onClick={e => openEdit(cat, e)}
        className="absolute top-1 right-1 w-5 h-5 rounded bg-white/90 text-gray-400 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-primary transition-all">
        <Edit2 className="w-3 h-3" />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-lg">分类管理</h2>
        <button onClick={() => setDialog({ mode: 'add-parent' })} className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-3">
        {loading && tree.length === 0 ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : tree.length === 0 ? (
          <div className="text-center text-gray-400 py-16">暂无分类，点 + 添加</div>
        ) : !selectedCat ? (
          /* ─── No selection → show ALL categories ─── */
          <div className="grid grid-cols-3 gap-2">
            {tree.map(cat => <CatCard key={cat.id} cat={cat} selected={false} />)}
          </div>
        ) : (
          /* ─── Category selected → split layout ─── */
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {before.map(cat => <CatCard key={cat.id} cat={cat} selected={false} />)}
              <CatCard cat={selectedCat} selected={true} />
              {afterSame.map(cat => <CatCard key={cat.id} cat={cat} selected={false} />)}
            </div>

            <button onClick={() => setDialog({ mode: 'add-sub', cat: selectedCat })}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-primary hover:text-primary transition-all">
              <Plus className="w-4 h-4" />添加子分类
            </button>

            {hasSubCats && (
              <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-primary">
                {selectedCat.children.map(sub => (
                  <button key={sub.id} onClick={() => handleSubClick(sub)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-[80px] ${
                      selectedSubId === sub.id ? 'bg-blue-50 border-2 border-primary' : 'bg-gray-50 border-2 border-transparent'
                    }`}>
                    <CategoryIcon name={sub.name} icon={sub.icon} size="sm" />
                    <span className="text-xs text-text-secondary truncate w-full text-center">{sub.name}</span>
                  </button>
                ))}
              </div>
            )}

            {afterNext.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {afterNext.map(cat => <CatCard key={cat.id} cat={cat} selected={false} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {dialog && (
        <EditDialog
          mode={dialog.mode}
          parentCat={dialog.mode === 'add-sub' ? dialog.cat : undefined}
          editCat={dialog.mode === 'edit' ? dialog.cat : undefined}
          defaultType="expense"
          onClose={() => setDialog(null)}
          onSave={handleSave}
          onDelete={dialog.mode === 'edit' ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
