import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";

import { weeklyReportEditionSchema } from "../../../src/lib/schemas";
import type {
  WeeklyDataStore,
  WeeklyKeyHighlight,
  WeeklyReportEdition,
} from "../../../src/types/weekly";
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
  const day = date.getUTCDay() || 7;
  const start = new Date(date);
  const end = new Date(date);
  start.setUTCDate(start.getUTCDate() - day + 1);
  end.setUTCDate(start.getUTCDate() + 6);
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

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function categoryForNews(item: NewsItem): WeeklyKeyHighlight["category"] {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  if (/mcp|model context protocol|server|connector/.test(text)) return "MCP";
  if (/model|llm|gpt|claude|gemini|qwen|deepseek|reasoning/.test(text)) return "Model";
  return "Workflow";
}

function actionForCategory(category: WeeklyKeyHighlight["category"]) {
  if (category === "MCP") {
    return "复核该 MCP 的权限范围、凭据来源和调用审计，再决定是否进入试验环境。";
  }
  if (category === "Model") {
    return "用项目真实任务做小样本评测，不要仅根据跑分或宣传决定模型迁移。";
  }
  return "把该变化拆成一个可回滚的流程实验，补充输入输出和验证标准。";
}

function buildRssEdition(
  news: NewsItem[],
  editionId: string,
  range: string,
): WeeklyReportEdition {
  const highlights = news.slice(0, 5).map((item) => {
    const category = categoryForNews(item);
    return {
      category,
      title: item.title,
      description: stripHtml(item.summary || item.title).slice(0, 220),
      impactScore: category === "Workflow" ? 3 : 4,
      link: item.link,
    } satisfies WeeklyKeyHighlight;
  });

  const outlook = news.slice(0, 3).map((item) => ({
    topic: `持续跟踪：${item.title}`,
    whyItMatters: stripHtml(item.summary || item.title).slice(0, 220),
    actionableAdvice: actionForCategory(categoryForNews(item)),
  }));

  const markdown = [
    `# ${editionId} RSS 清洗摘要`,
    "",
    "> 本版由 RSS 标题与摘要进行结构化清洗生成，未经过大模型二次降噪。",
    "",
    "## 本周信号",
    ...news.slice(0, 10).map(
      (item, index) =>
        `${index + 1}. [${item.title}](${item.link}) — ${item.source}${item.publishedAt ? ` · ${item.publishedAt}` : ""}`,
    ),
    "",
    "## 下周观察",
    ...outlook.flatMap((item, index) => [
      `### ${index + 1}. ${item.topic}`,
      "",
      item.whyItMatters,
      "",
      `**开发者行动：** ${item.actionableAdvice}`,
      "",
    ]),
  ].join("\n");

  return {
    id: editionId,
    title: `第 ${editionId.replace(/^.*-w/, "")} 期：AI 工程信号速览`,
    dateRange: range,
    summary:
      highlights
        .slice(0, 3)
        .map((item) => item.title)
        .join("；")
        .slice(0, 320) || "本周暂无可提炼的新信号。",
    generationMode: "rss",
    keyHighlights: highlights,
    nextWeekOutlook: outlook,
    fullMarkdownContent: markdown,
    recommendedPrompts: highlights.slice(0, 3).map(
      (item) => `围绕“${item.title}”设计一个可验证的 AI 工作流，并说明需要的模型、MCP 与验证方式`,
    ),
  };
}

export async function buildWeeklyEditionWithAi(
  news: NewsItem[],
  store: WeeklyDataStore,
  now = new Date(),
): Promise<WeeklyDataStore | null> {
  if (news.length === 0) return null;

  const editionId = weekId(now);
  const range = dateRange(now);
  const existing = store.editions.find((edition) => edition.id === editionId);
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    if (existing) return store;
    const edition = buildRssEdition(news, editionId, range);
    return {
      currentEditionId: edition.id,
      editions: [edition, ...store.editions].slice(0, 24),
    };
  }

  const provider = createDeepSeek({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com",
  });
  const model = provider(process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat");

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
    "id" | "dateRange" | "generationMode"
  >;
  const edition = weeklyReportEditionSchema.parse({
    id: editionId,
    dateRange: range,
    generationMode: "ai",
    ...generated,
  });

  return {
    currentEditionId: edition.id,
    editions: [edition, ...store.editions.filter((item) => item.id !== edition.id)].slice(0, 24),
  };
}
