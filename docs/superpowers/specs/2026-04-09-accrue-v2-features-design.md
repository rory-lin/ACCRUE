# Accrue V2 Feature Design

## Context
Accrue v1 已完成基础记账功能。用户反馈了性能、AI 解析精度、交互便利性等问题，并提出了转账、支出属性分类、用户登录等新需求。

## 1. 性能优化 — 数据缓存 + 首屏加速

**根因**: 每次页面导航都重新请求 accounts/categories；Dashboard 的 fetchAccounts 阻塞后续请求。

**方案**:
- Zustand stores 增加 TTL 缓存（5 分钟），避免重复请求
- Dashboard: fetchAccounts 不再阻塞，改为与 stats 请求 Promise.all 并行
- 列表页/记账页: 仅在缓存过期时才重新 fetch accounts/categories

**改动文件**:
- `client/src/stores/accountStore.ts` — 增加 TTL 判断
- `client/src/stores/categoryStore.ts` — 增加 TTL 判断
- `client/src/pages/Dashboard.tsx` — 移除阻塞 await

## 2. AI 解析子分类

**根因**: prompt 只列一级分类，未告知 LLM 子分类列表；parser 用精确匹配。

**方案**:
- parser 在调用 LLM 前，从数据库查询完整分类树，动态注入 prompt
- sub_category 查找改用 LIKE 模糊匹配
- prompt 强调"必须从列表中选择"

**改动文件**:
- `server/llm/prompts.py` — 接收分类树参数
- `server/llm/parser.py` — 动态查询分类树 + 模糊匹配
- `server/dao/category_dao.py` — 新增 find_sub_by_name_fuzzy

## 3. 默认账户

**方案**:
- settings 表存 `default_account_id`
- 后端新增 `GET/PUT /api/settings/{key}`
- 前端 RecordPage 初始化时读取并预选默认账户

**改动文件**:
- `server/dao/settings_dao.py` — 新增
- `server/service/settings_service.py` — 新增
- `server/controller/settings_controller.py` — 新增
- `client/src/api/settings.ts` — 新增
- `client/src/pages/RecordPage.tsx` — 读取默认账户

## 4. 账户转账

**方案**:
- `POST /api/transfers` — 参数: from_account_id, to_account_id, amount, date, note
- 后端事务中创建两条记录: 一条 expense（扣款），一条 income（入账），note 标注 `[转账]`
- 前端 RecordPage 增加"转账"模式
- 交易列表显示 `[转账]` 标签

**改动文件**:
- `server/dao/transaction_dao.py` — 新增 transfer 操作
- `server/service/transaction_service.py` — 新增 create_transfer
- `server/controller/transaction_controller.py` — 新增 POST /api/transfers
- `client/src/api/transactions.ts` — 新增 transferTransfer
- `client/src/pages/RecordPage.tsx` — 转账模式 UI

## 5. 支出属性（固定/可变/非必要）

**方案**:
- categories 表新增 `expense_nature ENUM('fixed','variable','discretionary') DEFAULT NULL`
- transactions 表新增 `expense_nature ENUM('fixed','variable','discretionary') DEFAULT NULL`
- 预置默认: 居住生活→fixed, 食品饮食/交通出行→variable, 休闲娱乐/消费购物→discretionary 等
- 记账时从分类继承默认值，用户可手动改
- 统计报表按属性维度聚合

**改动文件**:
- `server/db/migrations.py` — Migration 3: ALTER TABLE 加字段
- `server/db/seed.py` — 更新预置数据
- `server/models/category.py` — 新增 expense_nature 字段
- `server/models/transaction.py` — 新增 expense_nature 字段
- `server/dao/category_dao.py` — 更新查询
- `server/dao/transaction_dao.py` — 更新查询
- `client/src/types/index.ts` — 新增类型
- `client/src/pages/RecordPage.tsx` — 属性下拉框
- `client/src/pages/CategoryManage.tsx` — 分类默认属性设置
- `client/src/pages/Statistics.tsx` — 按属性统计

## 6. 用户登录

**方案**:
- JWT 认证，单用户: rory / qaz.007.008（bcrypt 哈希）
- `POST /api/auth/login` 返回 JWT token
- 后端中间件校验所有 `/api/*` 请求（排除 `/api/auth/login`）
- 前端登录页，token 存 localStorage，请求拦截器附加 Authorization header

**改动文件**:
- `server/requirements.txt` — 新增 python-jose, passlib, bcrypt
- `server/db/migrations.py` — Migration 4: users 表
- `server/db/seed.py` — seed 用户 rory
- `server/middleware/auth.py` — JWT 校验中间件
- `server/controller/auth_controller.py` — 登录接口
- `client/src/pages/Login.tsx` — 登录页
- `client/src/api/client.ts` — 请求拦截器
- `client/src/App.tsx` — 路由守卫
