# Prompt2Recipe / StackForge

[中文](README.md) | [English](README.en.md)

Prompt2Recipe 是一个任务驱动的 AI 架构配置引擎。用户输入自然语言任务后，系统会推荐一套可执行的 AI 工具组合，并按需生成四步实施方案。

项目目前是预发布 MVP，保持无数据库、无登录、无用户历史的轻量架构。模型、MCP、Skill、Recipe 和周刊数据全部保存在版本化 JSON 文件中。

## 核心能力

- 两阶段决策：先快速生成工具组合，再按需生成完整实施工作流。
- 意图识别规则覆盖 Fetch、Puppeteer、Filesystem、GitHub、PDF、XLSX 等工具与 Skill。
- 支持服务端 DeepSeek、个人 API Key（BYOK）、本地 Ollama 和静态体验模式。
- 提供模型对比、MCP 广场、Agent Skill 广场和每周降噪 Portal。
- 周刊支持下周观察、Markdown 详情、往期归档和 Prompt 回填决策引擎。
- TypeScript ETL 自动抓取 OpenRouter、GitHub MCP、GitHub Skills 和 RSS，并执行清洗与归档。
- 中英文界面，桌面和移动端响应式布局。

## 项目结构

```text
Next.js App Router
├── /                          架构决策引擎
├── /portal/models             模型数据库
├── /portal/mcps               MCP 广场
├── /portal/skills             Agent Skill 广场
├── /portal/weekly             每周降噪与往期归档
├── /portal/weekly/[id]        静态生成的周刊详情
└── /api/recommend             Provider 代理与推荐接口

data/*.json                    静态知识库
scripts/etl/                   抓取、清洗、摘要和归档管线
.github/workflows/cron.yml     每周自动执行 ETL
```

决策引擎将检索与模型推理分离。系统先从静态知识库选出精简候选，模型只返回 `id`、`role` 和 `reasoning`，随后由服务端补齐名称、URL、简介和必要 Skill。

## 本地运行

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

打开 http://localhost:3000。

未配置服务端 API Key 时，网页默认使用体验模式。需要启用服务端 DeepSeek 时配置：

```env
DEEPSEEK_API_KEY=your_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

`GET /api/recommend` 可查看服务端 Provider 状态，不会返回密钥。

## 算力来源

网页设置支持三种模式：

- `自定义 API Key`：使用用户自己的 OpenAI-compatible Base URL、Model 和 API Key。密钥只保存在当前浏览器 `localStorage`，服务端不持久化。
- `本地 Ollama`：默认 `http://localhost:11434` 和 `qwen2.5:7b`，自动使用 `/v1` 接口。
- `体验模式`：只读取静态 JSON，不调用外部模型。

Ollama 模型需要支持 OpenAI-compatible `/v1/chat/completions`、JSON 输出和指令跟随。低于 3B 的模型不支持结构化工作流，3B 到 7B 属于实验范围，推荐使用 `qwen2.5:7b`、`qwen2.5-coder:7b`、`deepseek-r1:7b` 或 `llama3.1:8b`。

## 数据目录

```text
data/
  models.json
  mcps.json
  skills.json
  recipes.json
  weekly.json
  index.json
```

普通目录使用 `{ version, updatedAt, items }`。`weekly.json` 使用期次结构，保存当前期、往期归档、下周观察和完整 Markdown 内容。

## ETL 管线

```text
scripts/etl/
  fetchers/
    openrouter.ts
    github-mcps.ts
    github-skills.ts
    rss-news.ts
  processors/
    clean-models.ts
    clean-skills.ts
    summarize-mcps.ts
    noise-reducer.ts
  index.ts
```

环境变量：

- `OPENROUTER_API_KEY`：可选，用于提高 OpenRouter 模型刷新额度。
- `GITHUB_TOKEN`：用于抓取高星 MCP 和 Agent Skill 仓库。
- `DEEPSEEK_API_KEY`：用于 MCP 摘要和 AI 周刊降噪。
- `RSS_FEEDS`：可选，逗号分隔的自定义 RSS 来源。

执行：

```bash
pnpm kb:update
```

OpenRouter 模型接口可匿名访问。缺少 Token 或网络失败时会跳过对应来源，保留现有 JSON。每周一只总结上一周周一至周日的内容；周报必须通过 DeepSeek 或 Ollama 生成中文内容，无可用模型时不更新周报。

## 常用命令

- `pnpm dev`：启动开发服务器
- `pnpm build`：生产构建
- `pnpm lint`：ESLint
- `pnpm typecheck`：TypeScript 检查
- `pnpm test`：单元测试
- `pnpm e2e`：Playwright 端到端测试
- `pnpm kb:update`：执行 ETL、校验数据并重建索引

## 部署

项目可直接部署到 Vercel：

1. 在 Vercel 导入 GitHub 仓库。
2. 按需配置 DeepSeek 环境变量。
3. 部署。`/portal/*` 会静态生成，`/api/recommend` 保持动态。

`.github/workflows/cron.yml` 每周执行一次 ETL，并在数据变化时自动提交 JSON。

## 安全说明

- 不要提交 `.env.local`。
- 网页中保存的 API Key 位于浏览器 `localStorage`，生产环境必须使用 HTTPS。
- 用户 Provider Key 只在当前请求中转发，不写入数据库。
- 授予文件系统、数据库、GitHub 或浏览器 MCP 权限前，应检查最小权限范围。
