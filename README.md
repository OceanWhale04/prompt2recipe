# Prompt2Recipe / StackForge

Prompt2Recipe is a task-driven AI architecture configuration engine. Users describe a task in natural language and receive a structured tool combination plus an optional four-step implementation plan.

The project is currently a pre-release MVP. It intentionally stays lightweight: no database, no authentication, and no user history. Knowledge and weekly reports are stored as versioned JSON files.

## Features

- Two-stage decision engine: fast tool combination first, optional deep workflow second.
- Intent-aware recommendations for Fetch, Puppeteer, Filesystem, GitHub, and XLSX capabilities.
- Per-request compute sources: server DeepSeek, personal API Key (BYOK), local Ollama, or static experience mode.
- Static intelligence portal for model comparison, MCP discovery, and weekly signal reports.
- Weekly editions with next-week outlook, Markdown detail pages, archive navigation, and prompt handoff back to the decision engine.
- TypeScript ETL pipeline for OpenRouter models, GitHub MCP repositories, RSS news, and AI noise reduction.
- Bilingual Chinese/English interface with responsive desktop and mobile layouts.

## Architecture

```text
Next.js App Router
├── /                          Decision engine
├── /portal/models             Model intelligence
├── /portal/mcps               MCP directory
├── /portal/weekly             Weekly report and archive
├── /portal/weekly/[id]        Statically generated weekly detail
└── /api/recommend             Provider proxy and recommendation API

data/*.json                    Static knowledge base
scripts/etl/                   Fetch, clean, summarize, and archive pipeline
.github/workflows/cron.yml     Weekly ETL automation
```

The decision engine keeps retrieval and LLM orchestration separate. Keyword retrieval selects a compact candidate set, then the configured provider returns a lightweight selection containing only `id`, `role`, and `reasoning`. The server hydrates names, URLs, and descriptions from the local JSON catalog.

## Getting Started

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000.

Without a server API key, the UI defaults to Experience mode and uses static matching. To enable server-side DeepSeek, configure:

```env
DEEPSEEK_API_KEY=your_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

`GET /api/recommend` reports server provider status without exposing the key.

## Compute Sources

The settings button in the top navigation supports three per-browser modes:

- `BYOK`: sends a user-provided OpenAI-compatible Base URL, API Key, and model with each request. The key is stored only in browser `localStorage` and is not persisted by the server.
- `Ollama`: sends a user-provided Ollama Base URL and model. The endpoint is normalized to `/v1`.
- `Experience mode`: uses local static JSON only and does not call an external model API.

When a request includes an explicit BYOK or Ollama provider, server environment variables are ignored. Provider failures return an error instead of silently switching to static matching. Requests without a provider field retain the server DeepSeek compatibility path.

Ollama models must support OpenAI-compatible `/v1/chat/completions`, JSON output, and instruction following. Models below 3B are not supported for this structured workflow. Models between 3B and 7B are experimental. Recommended models are `qwen2.5:7b`, `qwen2.5-coder:7b`, `deepseek-r1:7b`, and `llama3.1:8b`.

## Knowledge Base

```text
data/
  models.json
  mcps.json
  skills.json
  recipes.json
  weekly.json
  index.json
```

Catalog files use `{ version, updatedAt, items }`. `weekly.json` uses an edition-based store:

```text
{
  currentEditionId,
  editions: [
    {
      id,
      title,
      dateRange,
      summary,
      keyHighlights,
      nextWeekOutlook,
      fullMarkdownContent,
      recommendedPrompts
    }
  ]
}
```

## ETL Pipeline

The ETL entry point is `scripts/update-kb.ts`.

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

External steps require environment variables:

- `OPENROUTER_API_KEY` for model and pricing refresh
- `GITHUB_TOKEN` for high-star MCP repository discovery
- `DEEPSEEK_API_KEY` for MCP summaries and AI weekly noise reduction
- `RSS_FEEDS` as an optional comma-separated RSS source list

Run locally:

```bash
pnpm kb:update
```

OpenRouter model discovery works without an API key. When tokens or network access are unavailable, external steps are skipped and existing JSON remains unchanged. When RSS news is available but DeepSeek is unavailable, the pipeline creates an RSS-cleaned draft edition and does not overwrite an existing edition for the same week. The script still validates data and rebuilds `data/index.json`.

## Scripts

- `pnpm dev` - start the development server
- `pnpm build` - create a production build
- `pnpm lint` - run ESLint
- `pnpm typecheck` - run TypeScript checks
- `pnpm test` - run unit tests
- `pnpm e2e` - run Playwright smoke tests
- `pnpm kb:update` - run ETL, validate data, and rebuild the index

## Deployment

The project is ready for Vercel:

1. Import the GitHub repository into Vercel.
2. Configure the DeepSeek variables when server-side inference is desired.
3. Deploy. The `/portal/*` pages are statically generated; `/api/recommend` remains dynamic.

The weekly GitHub Actions workflow is `.github/workflows/cron.yml`. It runs every Sunday at 16:00 UTC, calls the ETL pipeline, and commits updated JSON files when data changes.

## Security Notes

- Never commit `.env.local`.
- API Keys entered in the settings dialog are stored in browser `localStorage`; use the application only over HTTPS outside local development.
- Provider keys are forwarded only for the current request and are not written to the repository or a database.
- Review MCP permissions before granting filesystem, database, GitHub, or browser access.

## License

No license has been selected yet.
