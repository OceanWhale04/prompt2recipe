import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

import { weeklyReportEditionSchema } from "../../../src/lib/schemas";
import type { WeeklyDataStore, WeeklyReportEdition } from "../../../src/types/weekly";
import type { NewsItem } from "../fetchers/rss-news";

const REPORT_TIME_ZONE = process.env.WEEKLY_TIME_ZONE?.trim() || "Asia/Shanghai";

function zonedDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10).replaceAll("-", ".");
}

function weekId(date: Date) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-w${String(week).padStart(2, "0")}`;
}

export function getPreviousCompletedWeek(now = new Date()) {
  const { year, month, day } = zonedDateParts(now, REPORT_TIME_ZONE);
  const localDate = new Date(Date.UTC(year, month - 1, day));
  const weekday = localDate.getUTCDay() || 7;
  const currentMonday = new Date(localDate);
  currentMonday.setUTCDate(localDate.getUTCDate() - weekday + 1);

  const monday = new Date(currentMonday);
  monday.setUTCDate(currentMonday.getUTCDate() - 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    id: weekId(monday),
    dateRange: `${formatDate(monday)} - ${formatDate(sunday)}`,
    monday,
    sunday,
  };
}

function parseJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Noise reducer did not return a JSON object.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function getWeeklyModel() {
  const providerMode = process.env.WEEKLY_AI_PROVIDER?.trim().toLowerCase() || "deepseek";

  if (providerMode !== "ollama") {
    const deepSeekKey = process.env.DEEPSEEK_API_KEY?.trim();
    if (!deepSeekKey) return null;

    const provider = createDeepSeek({
      apiKey: deepSeekKey,
      baseURL: process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com",
    });
    return {
      model: provider(process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat"),
      source: "DeepSeek",
    };
  }

  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL?.trim();
  const ollamaModel = process.env.OLLAMA_MODEL?.trim();
  if (ollamaBaseUrl && ollamaModel) {
    const normalizedBaseUrl = ollamaBaseUrl.replace(/\/+$/, "").endsWith("/v1")
      ? ollamaBaseUrl.replace(/\/+$/, "")
      : `${ollamaBaseUrl.replace(/\/+$/, "")}/v1`;
    const provider = createOpenAICompatible({
      name: "ollama",
      baseURL: normalizedBaseUrl,
      apiKey: "ollama",
    });
    return { model: provider(ollamaModel), source: "Ollama" };
  }

  return null;
}

export async function buildWeeklyEditionWithAi(
  news: NewsItem[],
  store: WeeklyDataStore,
  now = new Date(),
): Promise<WeeklyDataStore | null> {
  if (news.length === 0) return null;

  const week = getPreviousCompletedWeek(now);
  const hasExistingEdition = store.editions.some((edition) => edition.id === week.id);
  if (hasExistingEdition) return store;

  const runtime = getWeeklyModel();
  if (!runtime) return store;

  const { text } = await generateText({
    model: runtime.model,
    system: `你是 AI 工程周报的中文编辑。请从资讯中去掉营销噪音，总结上一周真正影响技术选型和工作流设计的信号。
只输出合法 JSON，禁止 Markdown 代码围栏，格式必须为：
{
  "title": "中文期数标题",
  "summary": "三条以内的中文摘要",
  "keyHighlights": [
    {
      "category": "Model | MCP | Workflow",
      "title": "中文标题",
      "description": "中文说明",
      "impactScore": 1,
      "link": "来源链接"
    }
  ],
  "nextWeekOutlook": [
    {
      "topic": "中文主题",
      "expectedDate": "可选日期",
      "whyItMatters": "中文判断",
      "actionableAdvice": "中文行动建议"
    }
  ],
  "fullMarkdownContent": "完整中文 Markdown 周报",
  "recommendedPrompts": ["可直接用于决策引擎的中文 Prompt"]
}
除 MCP、API、RSS、LLM、Agent、JSON、PR 等通用术语缩写外，所有内容必须使用简体中文。`,
    prompt: `上一周范围：${week.dateRange}。请根据以下资讯生成第 ${week.id} 期周报：\n${JSON.stringify(news.slice(0, 30), null, 2)}`,
  });

  const generated = parseJsonObject(text) as Omit<WeeklyReportEdition, "id" | "dateRange" | "generationMode">;
  const edition = weeklyReportEditionSchema.parse({
    id: week.id,
    dateRange: week.dateRange,
    generationMode: "ai",
    ...generated,
  });

  return {
    currentEditionId: edition.id,
    editions: [edition, ...store.editions].slice(0, 24),
  };
}
