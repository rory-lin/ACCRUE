# Accrue - AI 智能记账助手

通过 AI 自然语言解析，快速记录每一笔收支。支持多账户管理、分类统计、预算跟踪、CSV/Excel 导出。

## 技术栈

- **前端**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **后端**: FastAPI + Python 3.11+
- **数据库**: MySQL 8.0
- **AI**: OpenAI 兼容 API（默认 SiliconFlow / DeepSeek）

## 快速开始（本地开发）

### 前置条件

- Python 3.11+
- Node.js 18+
- MySQL 8.0

### 1. 克隆项目

```bash
git clone https://github.com/rory-lin/ACCRUE.git
cd ACCRUE
```

### 2. 配置数据库和 AI

复制配置模板并填写实际值：

```bash
cp config.example.yaml config.yaml
```

编辑 `config.yaml`：

```yaml
llm:
  base_url: "https://api.siliconflow.cn/v1"   # LLM API 地址
  api_key: "sk-your-api-key"                    # 你的 API Key
  model: "Pro/deepseek-ai/DeepSeek-V3.2"        # 模型名称
  temperature: 0.1

mysql:
  host: "localhost"     # 数据库地址
  port: 3306
  user: "root"
  password: "your_pwd"  # 数据库密码
  database: "accrue"
```

> 首次启动会自动创建数据库表和种子数据（默认账户、分类）。

### 3. 启动后端

```bash
cd server
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

后端运行在 http://localhost:3001

### 4. 启动前端

```bash
cd client
npm install
npm run dev
```

前端运行在 http://localhost:5173，自动代理 `/api` 请求到后端。

### 5. 登录

默认账号：`rory` / `qaz.007.008`

---

## 部署到 Vercel（一键部署）

支持将前后端一起部署到 Vercel Serverless，无需自己的服务器。

### 前置条件

- 一个可从公网访问的 MySQL 数据库（如云数据库 RDS）
- 一个 OpenAI 兼容的 LLM API Key

### 步骤

1. **Fork 或导入仓库**到你的 GitHub

2. **在 Vercel 导入项目**：打开 [vercel.com/new](https://vercel.com/new)，选择该仓库

3. **Framework Preset** 选择 **Other**

4. **配置环境变量**（Settings → Environment Variables）：

   **必填（5 个）：**

   | 变量名 | 说明 | 示例 |
   |--------|------|------|
   | `DATABASE_URL` | 数据库连接字符串 | `mysql://user:password@host:3306/accrue` |
   | `LLM_BASE_URL` | LLM API 地址 | `https://api.siliconflow.cn/v1` |
   | `LLM_API_KEY` | LLM API Key | `sk-xxx...` |
   | `LLM_MODEL` | 模型名称 | `Pro/deepseek-ai/DeepSeek-V3.2` |
   | `JWT_SECRET` | JWT 签名密钥（随机字符串） | `my-secret-key-abc123` |

   **可选（有默认值）：**

   | 变量名 | 说明 | 默认值 |
   |--------|------|--------|
   | `ADMIN_USERNAME` | 登录用户名 | `rory` |
   | `ADMIN_PASSWORD` | 登录密码 | `qaz.007.008` |

5. **点击 Deploy**

> 生成随机 JWT 密钥：`python -c "import secrets; print(secrets.token_urlsafe(32))"`

### 部署架构

```
Vercel CDN (前端静态文件)
  ├── /             → React SPA
  ├── /assets/*     → JS/CSS 静态资源
  └── /api/*        → Python Serverless Function (FastAPI)
                        ↓
                    外部 MySQL 数据库
```

---

## 功能说明

- **AI 记账**: 输入"午饭花了 25"自动解析为分类、金额、日期
- **分类管理**: 自定义收支分类，支持 emoji 图标和图片上传
- **多账户**: 支付宝、微信、银行卡、信用卡、现金等多账户管理
- **统计报表**: 月度/年度汇总、分类占比、趋势图表
- **数据导出**: CSV / Excel 格式导出交易记录
- **日历视图**: 按日期查看收支情况

## 项目结构

```
├── api/index.py              # Vercel Serverless 入口
├── vercel.json               # Vercel 部署配置
├── config.example.yaml       # 配置模板
├── server/                   # 后端
│   ├── main.py               # FastAPI 入口
│   ├── config.py             # 配置（支持 env var）
│   ├── controller/           # API 路由层
│   ├── service/              # 业务逻辑层
│   ├── dao/                  # 数据访问层
│   ├── db/                   # 数据库迁移和种子
│   ├── middleware/            # 认证中间件
│   ├── llm/                  # AI 解析模块
│   └── models/               # Pydantic 数据模型
├── client/                   # 前端
│   ├── src/
│   │   ├── pages/            # 页面组件
│   │   ├── components/       # 通用组件
│   │   ├── stores/           # Zustand 状态管理
│   │   └── api/              # API 请求封装
│   └── vite.config.ts
└── requirements.txt          # Python 依赖（Vercel 用）
```
