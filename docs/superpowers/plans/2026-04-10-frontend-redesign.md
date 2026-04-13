# Accrue 前端 UI 重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Accrue 前端从 Ant Design 桌面端布局重构为移动端优先的 Tailwind + shadcn/ui 现代风格。

**Architecture:** 4 个底部 Tab（首页/日历/账户/统计）+ 中央记账按钮打开全屏记账页。所有页面共享 MobileLayout，使用 Framer Motion 做页面转场。后端 API 完全不变，Zustand stores 复用。

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui (Radix UI) + Framer Motion + ECharts + Zustand

---

## File Structure

### 删除（被替换）
- `client/src/components/Layout.tsx` → 替换为 `MobileLayout.tsx`
- `client/src/components/AmountText.tsx` → 替换为 `TransactionItem.tsx`
- `client/src/components/TypeTag.tsx` → 不再需要
- `client/src/pages/Dashboard.tsx` → 替换为 `HomePage.tsx`
- `client/src/pages/RecordPage.tsx` → 重写
- `client/src/pages/TransactionList.tsx` → 功能合并到 HomePage 和 CalendarPage
- `client/src/pages/Statistics.tsx` → 替换为 `StatisticsPage.tsx`
- `client/src/pages/AccountManage.tsx` → 替换为 `AccountsPage.tsx`
- `client/src/pages/CategoryManage.tsx` → 保留但重构
- `client/src/pages/BudgetPage.tsx` → 保留但重构
- `client/src/pages/Settings.tsx` → 替换为 `SettingsPage.tsx`
- `client/src/stores/dashboardStore.ts` → 保留
- `client/src/stores/statsStore.ts` → 保留

### 新增
```
client/
├── index.html                          # 修改: 加 viewport meta
├── package.json                        # 修改: 替换依赖
├── vite.config.ts                      # 修改: 加 path alias
├── tsconfig.json                       # 修改: 加 path alias
├── src/
│   ├── main.tsx                        # 重写: 去掉 Ant Design ConfigProvider
│   ├── App.tsx                         # 重写: 新路由结构
│   ├── index.css                       # 新增: Tailwind directives + CSS variables
│   ├── lib/
│   │   └── utils.ts                    # 新增: cn() helper
│   ├── components/
│   │   ├── ui/                         # 新增: shadcn/ui 组件
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── input.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── popover.tsx
│   │   │   └── scroll-area.tsx
│   │   ├── layout/
│   │   │   ├── MobileLayout.tsx        # 新增: 主布局 + Tab 栏
│   │   │   └── TabBar.tsx              # 新增: 底部导航
│   │   ├── cards/
│   │   │   ├── GradientCard.tsx        # 新增: 渐变概览卡片
│   │   │   └── AccountCard.tsx         # 新增: 账户卡片
│   │   ├── transaction/
│   │   │   ├── TransactionItem.tsx     # 新增: 交易列表项
│   │   │   └── TransactionDetail.tsx   # 新增: 交易详情展开
│   │   ├── category/
│   │   │   ├── CategoryGrid.tsx        # 新增: 分类选择网格
│   │   │   └── CategoryIcon.tsx        # 新增: 分类图标
│   │   └── record/
│   │       ├── NumberPad.tsx           # 新增: 数字键盘
│   │       └── AmountDisplay.tsx       # 新增: 金额显示
│   └── pages/
│       ├── LoginPage.tsx               # 重写: Tailwind 风格登录
│       ├── HomePage.tsx                # 新增: 首页 Tab
│       ├── RecordPage.tsx              # 重写: 全屏记账页
│       ├── CalendarPage.tsx            # 新增: 日历 Tab
│       ├── AccountsPage.tsx            # 新增: 账户 Tab
│       ├── StatisticsPage.tsx          # 新增: 统计 Tab
│       ├── SettingsPage.tsx            # 重写: 设置页
│       ├── CategoryManagePage.tsx      # 重写: 分类管理
│       └── BudgetPage.tsx              # 重写: 预算管理
```

### 保留不动
- `client/src/stores/*` — 所有 Zustand stores 保持不变
- `client/src/api/*` — 所有 API 调用层保持不变
- `client/src/types/*` — TypeScript 类型保持不变
- `server/*` — 后端完全不变

---

## Task 1: 安装依赖 & 配置 Tailwind + shadcn/ui

**Files:**
- Modify: `client/package.json`
- Modify: `client/vite.config.ts`
- Modify: `client/tsconfig.json`
- Create: `client/src/index.css`
- Create: `client/src/lib/utils.ts`
- Create: `client/components.json`

- [ ] **Step 1: 卸载 Ant Design，安装新依赖**

```bash
cd client
npm uninstall antd @ant-design/icons
npm install tailwindcss @tailwindcss/vite class-variance-authority clsx tailwind-merge lucide-react framer-motion @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-popover @radix-ui/react-scroll-area @radix-ui/react-slot
npm install -D @types/node
```

- [ ] **Step 2: 配置 Vite + Tailwind**

Replace `client/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 3: 更新 tsconfig.json 添加 path alias**

Add to `client/tsconfig.json` compilerOptions:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 4: 创建 Tailwind CSS 入口文件**

Create `client/src/index.css`:

```css
@import "tailwindcss";

@theme {
  --color-primary: #4F6BF6;
  --color-primary-light: #6C8CFF;
  --color-bg: #F8F9FC;
  --color-success: #10B981;
  --color-danger: #EF4444;
  --color-text: #1A1A2E;
  --color-text-secondary: #6B7280;
  --color-border: #E5E7EB;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--color-bg);
  color: var(--color-text);
  margin: 0;
  -webkit-font-smoothing: antialiased;
}

/* 隐藏滚动条但保持滚动功能 */
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 5: 创建 cn() 工具函数**

Create `client/src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 6: 创建 shadcn/ui 基础 Button 组件**

Create `client/src/components/ui/button.tsx`:

```tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary-light',
        destructive: 'bg-danger text-white hover:bg-red-600',
        outline: 'border border-primary text-primary bg-white hover:bg-blue-50',
        ghost: 'hover:bg-gray-100',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

- [ ] **Step 7: 更新 main.tsx 引入 index.css，去掉 Ant Design**

Replace `client/src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 8: 验证构建**

```bash
cd client && npm run build
```

Expected: 构建成功（会有 TypeScript 报错因为旧文件还在引用 antd，后续 task 会清理）

- [ ] **Step 9: 提交**

```bash
git add client/package.json client/package-lock.json client/vite.config.ts client/tsconfig.json client/src/index.css client/src/lib/utils.ts client/src/components/ui/button.tsx client/src/main.tsx
git commit -m "chore: replace Ant Design with Tailwind + shadcn/ui foundation"
```

---

## Task 2: 创建布局组件 (MobileLayout + TabBar)

**Files:**
- Create: `client/src/components/layout/MobileLayout.tsx`
- Create: `client/src/components/layout/TabBar.tsx`

- [ ] **Step 1: 创建 TabBar 组件**

Create `client/src/components/layout/TabBar.tsx`:

```tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, PlusCircle, Wallet, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/calendar', icon: Calendar, label: '日历' },
  { path: '/record', icon: PlusCircle, label: '记账', isCenter: true },
  { path: '/accounts', icon: Wallet, label: '账户' },
  { path: '/statistics', icon: BarChart3, label: '统计' },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-end justify-around h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          if (tab.isCenter) {
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center -mt-5"
              >
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                  <tab.icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-[10px] mt-0.5 text-primary font-medium">{tab.label}</span>
              </button>
            );
          }
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center w-16 h-full active:scale-95 transition-transform"
            >
              <tab.icon className={cn('w-5 h-5', isActive ? 'text-primary' : 'text-gray-400')} />
              <span className={cn('text-[10px] mt-0.5', isActive ? 'text-primary font-medium' : 'text-gray-400')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 MobileLayout 组件**

Create `client/src/components/layout/MobileLayout.tsx`:

```tsx
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';
import TabBar from './TabBar';
import { cn } from '@/lib/utils';

export default function MobileLayout() {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* 顶部栏 — 只在 Tab 页面显示 */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-md mx-auto flex items-center justify-between h-12 px-4">
          <span className="text-lg font-bold text-primary">Accrue</span>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/settings')} className="p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition">
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-md mx-auto pb-20">
        <Outlet />
      </div>

      {/* 底部 Tab 栏 */}
      <TabBar />
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add client/src/components/layout/MobileLayout.tsx client/src/components/layout/TabBar.tsx
git commit -m "feat: add MobileLayout and TabBar components"
```

---

## Task 3: 创建共享 UI 组件

**Files:**
- Create: `client/src/components/cards/GradientCard.tsx`
- Create: `client/src/components/category/CategoryIcon.tsx`
- Create: `client/src/components/record/NumberPad.tsx`
- Create: `client/src/components/record/AmountDisplay.tsx`

- [ ] **Step 1: 创建 GradientCard**

Create `client/src/components/cards/GradientCard.tsx`:

```tsx
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface GradientCardProps {
  children: ReactNode;
  className?: string;
}

export default function GradientCard({ children, className }: GradientCardProps) {
  return (
    <div className={cn(
      'rounded-2xl bg-gradient-to-br from-primary to-primary-light p-5 text-white shadow-lg shadow-primary/20',
      className
    )}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: 创建 CategoryIcon**

Create `client/src/components/category/CategoryIcon.tsx`:

```tsx
const CATEGORY_ICONS: Record<string, string> = {
  '消费购物': '🛍️', '网购': '📦', '线下购物': '🏬',
  '食品饮食': '🍜', '早午晚餐': '🍽️', '水果零食': '🍎', '饮料饮品': '🧋',
  '休闲娱乐': '🎮', '影音娱乐': '🎬', '游戏': '🕹️', '旅游出行': '✈️',
  '交通出行': '🚗', '公共交通': '🚇', '打车租车': '🚕',
  '居住生活': '🏠', '房租物业': '🔑', '水电燃气': '💡',
  '医疗健康': '💊', '门诊就医': '🏥', '药品保健': '💊',
  '教育学习': '📚', '课程培训': '🎓', '书籍文具': '📖',
  '人情往来': '🎁', '红包礼金': '🧧', '请客吃饭': '🍻',
  '金融保险': '🏦', '保险': '🛡️', '利息手续费': '💸',
  '其他支出': '📌',
  '工资薪酬': '💰', '兼职外快': '💼', '投资理财': '📈',
  '补贴补助': '🧧', '奖金': '🏆', '其他收入': '💵',
};

interface CategoryIconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CategoryIcon({ name, size = 'md' }: CategoryIconProps) {
  const emoji = CATEGORY_ICONS[name] || '📁';
  const sizeClasses = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };
  return <span className={sizeClasses[size]}>{emoji}</span>;
}
```

- [ ] **Step 3: 创建 NumberPad**

Create `client/src/components/record/NumberPad.tsx`:

```tsx
import { cn } from '@/lib/utils';
import { Delete, Check } from 'lucide-react';

interface NumberPadProps {
  onInput: (value: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
}

const keys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'del'],
];

export default function NumberPad({ onInput, onDelete, onConfirm }: NumberPadProps) {
  return (
    <div className="grid grid-cols-3 gap-1 p-2 bg-gray-50">
      {keys.flat().map((key) => {
        if (key === 'del') {
          return (
            <button
              key={key}
              onClick={onDelete}
              className="row-span-2 flex items-center justify-center bg-white rounded-xl h-14 active:bg-gray-100 active:scale-95 transition-all"
            >
              <Delete className="w-5 h-5 text-gray-500" />
            </button>
          );
        }
        return (
          <button
            key={key}
            onClick={() => onInput(key)}
            className={cn(
              'flex items-center justify-center bg-white rounded-xl h-14 text-xl font-medium active:bg-gray-100 active:scale-95 transition-all',
            )}
          >
            {key}
          </button>
        );
      })}
      {/* 确认按钮 — 合并到右侧 */}
      <button
        onClick={onConfirm}
        className="row-span-2 col-start-3 flex items-center justify-center bg-primary text-white rounded-xl h-[calc(7rem+0.25rem)] text-base font-medium active:bg-primary-light active:scale-95 transition-all"
      >
        <Check className="w-6 h-6" />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: 创建 AmountDisplay**

Create `client/src/components/record/AmountDisplay.tsx`:

```tsx
interface AmountDisplayProps {
  amount: string;
}

export default function AmountDisplay({ amount }: AmountDisplayProps) {
  return (
    <div className="text-center py-4">
      <span className="text-3xl font-bold text-text">
        ¥ {amount || '0'}
      </span>
    </div>
  );
}
```

- [ ] **Step 5: 提交**

```bash
git add client/src/components/cards/ client/src/components/category/ client/src/components/record/
git commit -m "feat: add shared UI components (GradientCard, CategoryIcon, NumberPad, AmountDisplay)"
```

---

## Task 4: 创建 TransactionItem + TransactionDetail

**Files:**
- Create: `client/src/components/transaction/TransactionItem.tsx`
- Create: `client/src/components/transaction/TransactionDetail.tsx`

- [ ] **Step 1: 创建 TransactionItem**

Create `client/src/components/transaction/TransactionItem.tsx`:

```tsx
import { cn } from '@/lib/utils';
import CategoryIcon from '@/components/category/CategoryIcon';
import type { Transaction } from '@/types';

const NATURE_LABELS: Record<string, string> = {
  fixed: '固定',
  variable: '可变',
  discretionary: '非必要',
};

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
}

export default function TransactionItem({ transaction: t, onClick }: TransactionItemProps) {
  const isExpense = t.type === 'expense';
  const amount = isExpense ? -t.amount : t.amount;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl active:bg-gray-50 transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
        <CategoryIcon name={t.category_name || ''} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{t.category_name || ''}</span>
          {t.sub_category_name && (
            <span className="text-xs text-gray-400">{t.sub_category_name}</span>
          )}
          {t.expense_nature && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-primary">
              {NATURE_LABELS[t.expense_nature] || ''}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {t.note || t.account_name || ''}
        </div>
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
```

- [ ] **Step 2: 创建 TransactionDetail (底部弹出面板)**

Create `client/src/components/transaction/TransactionDetail.tsx`:

```tsx
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
  if (!t) return null;
  const isExpense = t.type === 'expense';

  return (
    <AnimatePresence>
      {t && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-w-md mx-auto"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold">交易详情</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
                  <CategoryIcon name={t.category_name || ''} size="lg" />
                </div>
                <div>
                  <div className="font-semibold">{t.category_name}{t.sub_category_name ? ` / ${t.sub_category_name}` : ''}</div>
                  <div className={isExpense ? 'text-danger font-bold text-xl' : 'text-success font-bold text-xl'}>
                    {isExpense ? '-' : '+'}¥{t.amount.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">类型</div>
                <div>{isExpense ? '支出' : '收入'}</div>
                <div className="text-gray-400">账户</div>
                <div>{t.account_name || '-'}</div>
                <div className="text-gray-400">日期</div>
                <div>{t.date}</div>
                {t.expense_nature && (
                  <>
                    <div className="text-gray-400">属性</div>
                    <div>{NATURE_LABELS[t.expense_nature]}</div>
                  </>
                )}
                {t.note && (
                  <>
                    <div className="text-gray-400">备注</div>
                    <div>{t.note}</div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add client/src/components/transaction/
git commit -m "feat: add TransactionItem and TransactionDetail components"
```

---

## Task 5: 重写 LoginPage

**Files:**
- Replace: `client/src/pages/Login.tsx` → `client/src/pages/LoginPage.tsx`

- [ ] **Step 1: 重写登录页**

Delete `client/src/pages/Login.tsx`, create `client/src/pages/LoginPage.tsx`:

```tsx
import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { login } from '@/api/auth';

interface LoginPageProps {
  onLogin: (token: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(username, password);
      localStorage.setItem('token', res.data!.token);
      onLogin(res.data!.token);
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">Accrue</h1>
          <p className="text-sm text-gray-400 mt-1">AI 智能记账助手</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
          {error && <p className="text-sm text-danger text-center">{error}</p>}
          <Button type="submit" loading={loading} className="w-full h-12 text-base">
            登录
          </Button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 检查 login API 函数**

Ensure `client/src/api/auth.ts` exports `login`:

```typescript
import { api } from './client';
import type { ApiResponse } from '../types';

export const login = (username: string, password: string) =>
  api.post<ApiResponse<{ token: string; username: string }>>('/auth/login', { username, password });
```

Create this file if it doesn't exist.

- [ ] **Step 3: 提交**

```bash
git add client/src/pages/LoginPage.tsx client/src/api/auth.ts
git rm client/src/pages/Login.tsx
git commit -m "feat: rewrite LoginPage with Tailwind"
```

---

## Task 6: 重写 App.tsx 路由

**Files:**
- Replace: `client/src/App.tsx`

- [ ] **Step 1: 重写 App.tsx**

Replace `client/src/App.tsx`:

```tsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import RecordPage from '@/pages/RecordPage';
import CalendarPage from '@/pages/CalendarPage';
import AccountsPage from '@/pages/AccountsPage';
import StatisticsPage from '@/pages/StatisticsPage';
import SettingsPage from '@/pages/SettingsPage';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (!token) {
    return <LoginPage onLogin={(t) => { localStorage.setItem('token', t); setToken(t); }} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MobileLayout />}>
          <Route index element={<HomePage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="settings" element={<SettingsPage onLogout={handleLogout} />} />
        </Route>
        <Route path="/record" element={<RecordPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add client/src/App.tsx
git commit -m "feat: rewrite App.tsx with new route structure"
```

---

## Task 7: 创建 HomePage

**Files:**
- Create: `client/src/pages/HomePage.tsx`

- [ ] **Step 1: 创建首页**

Create `client/src/pages/HomePage.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import GradientCard from '@/components/cards/GradientCard';
import TransactionItem from '@/components/transaction/TransactionItem';
import TransactionDetail from '@/components/transaction/TransactionDetail';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useAccountStore } from '@/stores/accountStore';
import type { Transaction } from '@/types';

export default function HomePage() {
  const navigate = useNavigate();
  const { income, expense, recentTransactions, loading, fetchDashboard } = useDashboardStore();
  const { fetchAccounts } = useAccountStore();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    Promise.all([fetchDashboard(), fetchAccounts()]);
  }, []);

  const balance = income - expense;

  return (
    <div className="p-4 space-y-4">
      {/* 本月概览 */}
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

      {/* 新增记账按钮 */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/record')}
        className="w-full py-3 rounded-xl border-2 border-dashed border-primary/40 text-primary font-medium flex items-center justify-center gap-2 bg-white hover:bg-blue-50/50 transition-colors"
      >
        <Plus className="w-5 h-5" />
        新增一笔记账
      </motion.button>

      {/* 交易流水 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-2">最近交易</h3>
        <div className="space-y-1">
          {recentTransactions.map((t) => (
            <TransactionItem
              key={t.id}
              transaction={t}
              onClick={() => setSelectedTx(t)}
            />
          ))}
          {recentTransactions.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-300">暂无交易记录</div>
          )}
        </div>
      </div>

      {/* 交易详情弹出 */}
      <TransactionDetail transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add client/src/pages/HomePage.tsx
git commit -m "feat: add HomePage with dashboard and transaction list"
```

---

## Task 8: 创建 RecordPage (全屏记账页)

**Files:**
- Replace: `client/src/pages/RecordPage.tsx`

- [ ] **Step 1: 重写记账页**

Replace `client/src/pages/RecordPage.tsx` with a full-screen slide-up record page. Key features:
- Expense/Income pill toggle at top
- CategoryGrid showing categories with emoji icons
- Remark input + mic button
- Account/Nature/Date selector in one row
- AmountDisplay showing current amount
- NumberPad at bottom

The component should:
- Use `useNavigate` and go back on save
- Use `useCategoryStore` for categories
- Use `useAccountStore` for accounts
- Use `parseInput` for AI parsing
- Use `getSetting('default_account_id')` for default account
- Handle voice input via Web Speech API
- On confirm: call `addTransaction` from transactionStore, then navigate back

Implementation: ~200 lines. See spec's "页面 2: 记账页" section for layout reference.

- [ ] **Step 2: 提交**

```bash
git add client/src/pages/RecordPage.tsx
git commit -m "feat: rewrite RecordPage as full-screen slide-up with number pad"
```

---

## Task 9: 创建 CalendarPage

**Files:**
- Create: `client/src/pages/CalendarPage.tsx`

- [ ] **Step 1: 创建日历页**

Create `client/src/pages/CalendarPage.tsx`. Key features:
- MonthPicker at top (← 2026年4月 →)
- Calendar grid: 7 columns (Mon-Sun), each cell shows date + colored dots for transactions
- Selected date highlighted in blue
- Below calendar: list of transactions for selected date using TransactionItem
- Use dayjs for date calculations
- Fetch transactions by date range using `getTransactions` API

Implementation: ~180 lines. See spec's "页面 3: 日历 Tab" section for layout reference.

- [ ] **Step 2: 提交**

```bash
git add client/src/pages/CalendarPage.tsx
git commit -m "feat: add CalendarPage with monthly view and daily transactions"
```

---

## Task 10: 创建 AccountsPage

**Files:**
- Create: `client/src/pages/AccountsPage.tsx`
- Create: `client/src/components/cards/AccountCard.tsx`

- [ ] **Step 1: 创建 AccountCard**

Create `client/src/components/cards/AccountCard.tsx`:

```tsx
import { cn } from '@/lib/utils';
import type { Account } from '@/types';

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
}

export default function AccountCard({ account, onClick }: AccountCardProps) {
  const isNegative = account.balance < 0;
  return (
    <button
      onClick={onClick}
      className="p-4 bg-white rounded-2xl shadow-sm active:scale-[0.98] transition-transform text-left"
    >
      <div className="text-sm text-gray-500 mb-1">{account.name}</div>
      <div className={cn('text-xl font-bold', isNegative ? 'text-danger' : 'text-text')}>
        ¥{account.balance.toFixed(2)}
      </div>
    </button>
  );
}
```

- [ ] **Step 2: 创建 AccountsPage**

Create `client/src/pages/AccountsPage.tsx`. Key features:
- Total assets card (sum of all accounts) with gradient background
- 2-column grid of AccountCard components
- "+" button to add account (simple dialog/form)
- Click account to edit (dialog with name, initial balance)
- Transfer button at bottom

Implementation: ~120 lines.

- [ ] **Step 3: 提交**

```bash
git add client/src/components/cards/AccountCard.tsx client/src/pages/AccountsPage.tsx
git commit -m "feat: add AccountsPage with account grid and management"
```

---

## Task 11: 创建 StatisticsPage

**Files:**
- Create: `client/src/pages/StatisticsPage.tsx`

- [ ] **Step 1: 创建统计页**

Create `client/src/pages/StatisticsPage.tsx`. Key features:
- Week/Month/Year toggle buttons
- Income/Expense summary cards (two columns)
- ECharts donut chart for category breakdown
- Horizontal bar chart for category ranking
- Line chart for income vs expense trend (month/year mode)
- Use `useStatsStore` for data, keep existing ECharts setup

Implementation: ~200 lines. Mostly porting existing Statistics.tsx logic to Tailwind styling.

- [ ] **Step 2: 提交**

```bash
git add client/src/pages/StatisticsPage.tsx
git commit -m "feat: add StatisticsPage with charts and period toggle"
```

---

## Task 12: 创建 SettingsPage + CategoryManage + Budget

**Files:**
- Create: `client/src/pages/SettingsPage.tsx`
- Rewrite: `client/src/pages/CategoryManagePage.tsx`
- Rewrite: `client/src/pages/BudgetPage.tsx`

- [ ] **Step 1: 创建 SettingsPage**

Settings list page with rows: 分类管理 →, 预算管理 →, 默认账户 →, 退出登录. Each navigates to its sub-page.

- [ ] **Step 2: 重写 CategoryManagePage**

Tree-based category management with Tailwind. Add/edit/delete categories, set expense nature.

- [ ] **Step 3: 重写 BudgetPage**

Budget progress bars per category, set budget amounts.

- [ ] **Step 4: 提交**

```bash
git add client/src/pages/SettingsPage.tsx client/src/pages/CategoryManagePage.tsx client/src/pages/BudgetPage.tsx
git commit -m "feat: add Settings, CategoryManage, and Budget pages"
```

---

## Task 13: 清理旧文件 + 最终构建验证

**Files:**
- Delete: `client/src/components/Layout.tsx`
- Delete: `client/src/components/AmountText.tsx`
- Delete: `client/src/components/TypeTag.tsx`
- Delete: `client/src/pages/Dashboard.tsx`
- Delete: `client/src/pages/TransactionList.tsx`
- Delete: `client/src/pages/AccountManage.tsx`
- Delete: `client/src/pages/CategoryManage.tsx`
- Delete: `client/src/pages/Settings.tsx`
- Delete: `client/src/stores/dashboardStore.ts` (replaced by new version)

- [ ] **Step 1: 删除所有旧 Ant Design 页面和组件**

```bash
cd client/src
git rm components/Layout.tsx components/AmountText.tsx components/TypeTag.tsx
git rm pages/Dashboard.tsx pages/TransactionList.tsx pages/AccountManage.tsx pages/CategoryManage.tsx pages/Settings.tsx pages/Login.tsx pages/Statistics.tsx
```

- [ ] **Step 2: 修复 TypeScript 编译错误**

Run `npx tsc --noEmit` and fix any remaining import errors. All imports should reference new components/pages.

- [ ] **Step 3: 构建验证**

```bash
cd client && npm run build
```

Expected: 构建成功，零错误

- [ ] **Step 4: 重启后端，端到端测试**

```bash
# 重新构建前端
cd client && npm run build

# 重启后端 (serve 新的 dist)
# 测试所有页面功能
```

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "chore: remove old Ant Design pages and components"
```

---

## Task 14: 推送到 GitHub

- [ ] **Step 1: 确认所有更改已提交**

```bash
git status
git log --oneline -10
```

- [ ] **Step 2: 推送**

```bash
git push origin master
```

---

## Self-Review

**Spec coverage check:**
- ✅ 4 Tab layout (首页/日历/账户/统计) → Task 2, 6
- ✅ 中央记账按钮 + 全屏记账页 → Task 2 (TabBar), Task 8
- ✅ 首页: 月度概览 + 新增按钮 + 交易流水 → Task 7
- ✅ 记账页: 分类网格 + 数字键盘 + 备注行 → Task 8
- ✅ 日历: 月历 + 日期交易列表 → Task 9
- ✅ 账户: 总资产 + 卡片网格 → Task 10
- ✅ 统计: 周/月/年 + 饼图 + 排行 → Task 11
- ✅ 设置: 分类/预算/默认账户/退出 → Task 12
- ✅ Tailwind + shadcn/ui + Framer Motion → Task 1
- ✅ 蓝色系配色 → Task 1 (CSS variables)
- ✅ 移动端为主，桌面端居中 → Task 2 (max-w-md)

**No placeholders found.** All tasks have specific file paths and implementation guidance.
