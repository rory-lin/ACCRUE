# Accrue 前端 UI 重设计

**日期**: 2026-04-10
**状态**: 设计已批准

## 背景

将 Accrue 前端从 Ant Design + 内联样式的桌面端布局，重构为移动端优先的现代 SaaS 风格 UI。使用 React + Tailwind CSS + shadcn/ui + Framer Motion，参考 Stripe/Linear 设计风格。

## 约束

- **移动端为主，桌面端可用** — 手机浏览器是主要使用场景，桌面端通过响应式布局保持基本可用
- **后端 API 不变** — 所有 /api/* 端点保持现有接口，只改前端
- **Zustand stores 复用** — 现有的 accountStore、categoryStore、transactionStore、dashboardStore、statsStore 逻辑保留，只做微调

## 技术栈变更

| 现有 | 替换为 |
|------|--------|
| Ant Design 5 | shadcn/ui (Radix UI primitives) |
| 内联 style={{}} | Tailwind CSS |
| 无动效 | Framer Motion |
| CSS-in-JS 无 | Tailwind + CSS variables |

保留不变：React 19、TypeScript、Vite、Zustand、ECharts、dayjs、React Router DOM。

## 设计系统

### 色彩

```
主色:      #4F6BF6 (蓝色)
主色渐变:  #4F6BF6 → #6C8CFF
背景:      #F8F9FC (微灰白)
卡片:      #FFFFFF
文字主:    #1A1A2E
文字辅:    #6B7280 (灰色)
成功/收入: #10B981 (绿)
危险/支出: #EF4444 (红)
边框:      #E5E7EB
```

### 排版

- 页面标题: 18px font-bold
- 数据金额: 24px font-bold
- 辅助信息: 14px text-gray-500
- 分类文字: 13px

### 圆角 & 阴影

- 卡片: rounded-2xl shadow-sm
- 按钮: rounded-xl
- 底部 Tab: 无圆角，顶部 1px 边框
- 输入框: rounded-lg

### 动效 (Framer Motion)

- 记账页: 从底部 slide-up 进入，下滑关闭
- 交易详情: 点击展开 accordion
- Tab 切换: fade 过渡
- 卡片 hover: 微浮 translateY(-2px)
- 数字键盘: 按压 scale(0.95) 反馈

## 页面结构

### 导航: 底部 4 Tab + 中央记账按钮

```
[首页]  [日历]  [+ 记账]  [账户]  [统计]
                    ↑
            中间突出的大圆形按钮
            (主色背景，白色 + 号)
```

- 首页/日历/账户/统计为 Tab 切换，不离开页面
- "+" 按钮点击后全屏滑入记账页
- 记账页有独立返回按钮，保存后回到首页

### 页面 1: 首页

**布局**:
1. 顶栏: "Accrue" 品牌名 + 右侧设置齿轮图标
2. 本月概览卡片 (蓝色渐变背景):
   - 两行两列: 收入 / 支出 / 结余 / 预算剩余百分比
   - 白色文字，大字号金额
3. "＋ 新增一笔记账" 按钮 (白底蓝边，全宽，醒目)
4. 交易流水列表 (无限滚动):
   - 按日期分组: "今天 4月10日" / "昨天 4月9日" ...
   - 每条: 左侧分类图标 + 分类名 + 备注，右侧金额 + 时间
   - 支出红色金额，收入绿色金额
   - 点击展开详情: 分类、账户、属性标签、备注

**数据来源**: dashboardStore (月度汇总) + transactionStore (交易列表，分页加载)

### 页面 2: 记账页 (全屏滑入)

**布局** (从上到下):
1. 顶栏: ← 返回按钮 + "记一笔" 标题
2. 支出/收入切换: 两个 pill 按钮，选中项蓝色填充
3. 分类网格: 4 列，每格 = emoji 图标 + 分类名称。选中项蓝色边框 + 浅蓝背景。底部有 "✏️ 管理分类" 链接，点击弹出分类编辑弹窗
4. 备注输入: 单行文本框，右侧麦克风图标（语音输入）
5. 附加选项栏 (同一行): 账户选择 ▼ | 属性选择 ▼ | 日期 📅
6. 金额显示: 居中大字号 "¥ 25.00"
7. 自定义数字键盘:
   ```
   [1] [2] [3] [删除⌫]
   [4] [5] [6]
   [7] [8] [9] [确认 ✓]
   [.] [0] [+]
   ```
   - 删除: 删除末位数字
   - 确认: 提交交易，返回首页
   - +: 可用于表达式 (暂不实现，预留)

**交互**:
- 选择分类后自动聚焦金额区
- 语音: 点击麦克风 → Web Speech API → 转文字 → AI 解析 → 自动填充分类/金额/备注
- 分类管理弹窗: 树形列表，可添加子分类、设置默认属性、删除

**数据来源**: categoryStore (分类树), accountStore (账户列表), ai API (语音/AI 解析)

### 页面 3: 日历 Tab

**布局**:
1. 月份切换: ← 2026年4月 → 左右箭头
2. 月历网格:
   - 周一~周日表头
   - 每个日期格子下方: 有交易的显示小圆点 (红=有支出, 绿=有收入, 都有=两色)
   - 选中日期蓝色背景
3. 选中日期的交易列表:
   - 显示日期 + 当日总支出
   - 列出该日所有交易 (同首页样式)

**数据来源**: transactionStore (按日期范围查询), stats API (月度汇总)

### 页面 4: 账户 Tab

**布局**:
1. 顶栏: "账户管理" + 右侧 "+" 添加按钮
2. 总资产卡片 (蓝色渐变): 大字号显示所有账户余额之和
3. 账户网格 (2 列):
   - 每个账户: 白色卡片，图标 + 名称 + 余额
   - 信用卡余额为负数显示红色
   - 点击: 弹出编辑弹窗 (名称、类型、初始余额)
4. 底部: 转账按钮 → 转账弹窗 (选账户、输入金额)

**数据来源**: accountStore

### 页面 5: 统计 Tab

**布局**:
1. 顶栏: "统计分析" + 周/月/年 切换按钮组
2. 收支概览: 两列卡片 (收入绿 / 支出红)
3. 支出分类环形图 (ECharts): 居中显示总支出，外圈按分类占比着色
4. 支出排行: 横向条形图，每个分类一行 (名称 + 进度条 + 金额)
5. (月/年模式) 趋势折线图: 每日/月 收入 vs 支出双线

**数据来源**: statsStore

### 页面 6: 设置页 (从首页齿轮图标进入)

**布局** (列表形式，每行点击跳转):
1. 分类管理 → 分类编辑页 (树形列表，增删改)
2. 预算管理 → 预算设置页 (每月每个分类设预算 + 进度条)
3. 默认账户 → 选择默认支付账户
4. AI / 语音设置 → LLM 配置说明
5. 退出登录

## 组件清单

### 布局组件
- `MobileLayout` — 底部 Tab 栏 + 内容区域 + Framer Motion AnimatePresence
- `TabBar` — 4 Tab + 中央记账按钮
- `PageHeader` — 顶栏 (标题 + 右侧操作)

### 通用组件
- `GradientCard` — 蓝色渐变概览卡片
- `TransactionItem` — 单条交易行 (图标+名称+金额+时间)
- `TransactionDetail` — 交易详情展开面板
- `CategoryGrid` — 分类选择网格 (4列)
- `CategoryIcon` — 分类 emoji 图标
- `NumberPad` — 自定义数字键盘
- `AmountDisplay` — 金额显示组件 (大字号)
- `MonthPicker` — 月份切换器 (← 当前月 →)

### 表单组件
- `AccountSelector` — 账户下拉选择
- `NatureSelector` — 支出属性选择
- `DatePicker` — 日期选择 (使用 shadcn/ui Calendar)

### 弹窗/面板
- `RecordPage` — 全屏记账页 (slide-up 动画)
- `TransactionDetailSheet` — 交易详情底部弹出
- `CategoryManageSheet` — 分类管理弹窗
- `AccountFormDialog` — 账户编辑弹窗
- `TransferDialog` — 转账弹窗

## 文件结构

```
client/src/
├── App.tsx                     # 路由 + 认证守卫
├── main.tsx                    # 入口
├── index.css                   # Tailwind base + 自定义 CSS variables
├── components/
│   ├── ui/                     # shadcn/ui 基础组件 (Button, Dialog, Select...)
│   ├── layout/
│   │   ├── MobileLayout.tsx    # 主布局 (Tab 栏 + 内容)
│   │   ├── TabBar.tsx          # 底部导航
│   │   └── PageHeader.tsx      # 页面顶栏
│   ├── cards/
│   │   ├── GradientCard.tsx    # 渐变概览卡片
│   │   └── AccountCard.tsx     # 账户卡片
│   ├── transaction/
│   │   ├── TransactionItem.tsx # 交易列表项
│   │   └── TransactionDetail.tsx # 交易详情
│   ├── category/
│   │   ├── CategoryGrid.tsx    # 分类选择网格
│   │   └── CategoryIcon.tsx    # 分类图标
│   ├── record/
│   │   ├── NumberPad.tsx       # 数字键盘
│   │   └── AmountDisplay.tsx   # 金额显示
│   └── shared/
│       ├── MonthPicker.tsx     # 月份切换
│       └── DatePicker.tsx      # 日期选择
├── pages/
│   ├── HomePage.tsx            # 首页 Tab
│   ├── RecordPage.tsx          # 记账页 (全屏)
│   ├── CalendarPage.tsx        # 日历 Tab
│   ├── AccountsPage.tsx        # 账户 Tab
│   ├── StatisticsPage.tsx      # 统计 Tab
│   ├── SettingsPage.tsx        # 设置页
│   ├── CategoryManagePage.tsx  # 分类管理
│   ├── BudgetPage.tsx          # 预算管理
│   └── LoginPage.tsx           # 登录页
├── stores/                     # Zustand stores (复用现有)
├── api/                        # API 调用层 (复用现有)
└── types/                      # TypeScript 类型 (复用现有)
```

## 分类 Emoji 图标映射

```typescript
const CATEGORY_ICONS: Record<string, string> = {
  '消费购物': '🛍️', '食品饮食': '🍜', '休闲娱乐': '🎮',
  '交通出行': '🚗', '居住生活': '🏠', '医疗健康': '💊',
  '教育学习': '📚', '人情往来': '🎁', '金融保险': '🏦',
  '其他支出': '📌',
  '工资薪酬': '💰', '兼职外快': '💼', '投资理财': '📈',
  '补贴补助': '🧧', '奖金': '🏆', '其他收入': '💵',
};
```

## 桌面端适配

移动端为主，桌面端基本可用的策略：
- 最大宽度 `max-w-md mx-auto`，居中显示手机布局
- 或 `max-w-4xl` 时切换为侧边栏布局 (可选，后续迭代)
- 当前阶段: 桌面端 = 居中的手机宽度界面，不做特殊桌面布局

## 实施范围

**包含**: 6 个页面 + 15+ 组件 + 完整替换 Ant Design
**不包含**: 后端 API 变更、新增功能、PWA 离线支持
