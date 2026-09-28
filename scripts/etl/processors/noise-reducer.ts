import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";

import { weeklyReportEditionSchema } from "../../../src/lib/schemas";
import type { WeeklyDataStore, WeeklyReportEdition } from "../../../src/types/weekly";
import type { NewsItem } from "../fetchers/rss-news";

function weekId(date: Date) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-w${String(week).padStart(2, "0")}`;
}

function dateRange(date: Date) {
  const end = new Date(date);
  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() - 6);
  const format = (value: Date) => value.toISOString().slice(0, 10).replaceAll("-", ".");
  return `${format(start)} - ${format(end)}`;
}

function parseJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Noise reducer did not return a JSON object.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

export async function buildWeeklyEditionWithAi(
  news: NewsItem[],
  store: WeeklyDataStore,
  now = new Date(),
): Promise<WeeklyDataStore | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey || news.length === 0) return null;

  const provider = createDeepSeek({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com",
  });
  const model = provider(process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat");
  const editionId = weekId(now);
  const range = dateRange(now);

  const { text } = await generateText({
    model,
    system: `You are the editor of a high-signal AI engineering weekly.
Reduce marketing noise and return valid JSON only with:
{
  "title": "edition title",
  "summary": "three-sentence synthesis",
  "keyHighlights": [
    {
      "category": "Model | MCP | Workflow",
      "title": "signal title",
      "description": "why it matters",
      "impactScore": 1,
      "link": "source url"
    }
  ],
  "nextWeekOutlook": [
    {
      "topic": "event or trend",
      "expectedDate": "optional ISO date",
      "whyItMatters": "objective value after removing hype",
      "actionableAdvice": "what a developer should do next"
    }
  ],
  "fullMarkdownContent": "complete markdown report",
  "recommendedPrompts": ["prompt to apply in the decision engine"]
}`,
    prompt: `Generate the weekly edition for ${editionId} (${range}) from these recent items:\n${JSON.stringify(news.slice(0, 30), null, 2)}`,
  });

  const generated = parseJsonObject(text) as Omit<
    WeeklyReportEdition,
    "id" | "dateRange"
  >;
  const edition = weeklyReportEditionSchema.parse({
    id: editionId,
    dateRange: range,
    ...generated,
  });

  return {
    currentEditionId: edition.id,
    editions: [edition, ...store.editions.filter((item) => item.id !== edition.id)].slice(0, 24),
  };
}
