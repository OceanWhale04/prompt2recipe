import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";

import type { McpEntry } from "../../../src/lib/types";

export function mergeMcpEntries(existing: McpEntry[], incoming: McpEntry[]): McpEntry[] {
  const merged = new Map<string, McpEntry>();

  for (const item of [...incoming, ...existing]) {
    if (!item.id || !item.name || !item.url) continue;
    const previous = merged.get(item.id);
    merged.set(item.id, {
      ...previous,
      ...item,
      stars: Math.max(previous?.stars ?? 0, item.stars ?? 0),
    });
  }

  return Array.from(merged.values()).sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));
}

export async function summarizeMcpsWithDeepSeek(items: McpEntry[]): Promise<McpEntry[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey || items.length === 0) return items;

  const provider = createDeepSeek({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com",
  });
  const model = provider(process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat");
  const input = items.slice(0, 20).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.oneLiner,
    tags: item.tags,
    stars: item.stars,
  }));

  const { text } = await generateText({
    model,
    system:
      "You summarize MCP tools for developers. Return valid JSON only as an object mapping each input id to { oneLiner, taskPatterns, securityNote }.",
    prompt: `Summarize these MCP repositories in JSON:\n${JSON.stringify(input, null, 2)}`,
  });

  const parsed = JSON.parse(text) as Record<
    string,
    {
      oneLiner?: string;
      taskPatterns?: string[];
      securityNote?: string;
    }
  >;

  return items.map((item) => {
    const summary = parsed[item.id];
    if (!summary) return item;

    return {
      ...item,
      oneLiner: summary.oneLiner?.trim() || item.oneLiner,
      taskPatterns: summary.taskPatterns?.filter(Boolean) ?? item.taskPatterns,
      securityNote: summary.securityNote?.trim() || item.securityNote,
    };
  });
}
