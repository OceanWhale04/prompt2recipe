import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Catalog, McpEntry, ModelEntry } from "../../src/lib/types";
import type { WeeklyDataStore } from "../../src/types/weekly";
import { fetchGitHubMcpRepositories } from "./fetchers/github-mcps";
import { fetchOpenRouterModels } from "./fetchers/openrouter";
import { fetchRssNews } from "./fetchers/rss-news";
import { mergeModelEntries } from "./processors/clean-models";
import { buildWeeklyEditionWithAi } from "./processors/noise-reducer";
import { mergeMcpEntries, summarizeMcpsWithDeepSeek } from "./processors/summarize-mcps";

const dataDir = path.resolve(process.cwd(), "data");

export interface EtlResult {
  models: ModelEntry[];
  mcps: McpEntry[];
  weekly: WeeklyDataStore;
  refreshed: {
    models: boolean;
    mcps: boolean;
    weekly: boolean;
  };
}

async function readCatalog<T>(file: string): Promise<T[]> {
  const raw = await readFile(path.join(dataDir, file), "utf8");
  return (JSON.parse(raw) as Catalog<T>).items;
}

async function readWeekly(): Promise<WeeklyDataStore> {
  const raw = await readFile(path.join(dataDir, "weekly.json"), "utf8");
  return JSON.parse(raw) as WeeklyDataStore;
}

async function settle<T>(label: string, task: Promise<T>): Promise<T | null> {
  try {
    return await task;
  } catch (error) {
    console.warn(`[etl] ${label} skipped: ${String(error)}`);
    return null;
  }
}

export async function runEtlPipeline(): Promise<EtlResult> {
  const [existingModels, existingMcps, existingWeekly] = await Promise.all([
    readCatalog<ModelEntry>("models.json"),
    readCatalog<McpEntry>("mcps.json"),
    readWeekly(),
  ]);

  const shouldBuildWeekly = Boolean(process.env.DEEPSEEK_API_KEY?.trim());
  const [remoteModels, remoteMcps, news] = await Promise.all([
    settle("OpenRouter models", fetchOpenRouterModels()),
    settle("GitHub MCPs", fetchGitHubMcpRepositories()),
    shouldBuildWeekly ? settle("RSS news", fetchRssNews()) : Promise.resolve(null),
  ]);

  const models =
    remoteModels && remoteModels.length > 0
      ? mergeModelEntries(existingModels, remoteModels)
      : existingModels;

  let mcps =
    remoteMcps && remoteMcps.length > 0
      ? mergeMcpEntries(existingMcps, remoteMcps)
      : existingMcps;

  if (remoteMcps && remoteMcps.length > 0) {
    mcps = await settle("DeepSeek MCP summaries", summarizeMcpsWithDeepSeek(mcps)) ?? mcps;
  }

  const weekly =
    news && news.length > 0
      ? (await settle(
          "AI weekly noise reduction",
          buildWeeklyEditionWithAi(news, existingWeekly),
        )) ?? existingWeekly
      : existingWeekly;

  return {
    models,
    mcps,
    weekly,
    refreshed: {
      models: Boolean(remoteModels?.length),
      mcps: Boolean(remoteMcps?.length),
      weekly: weekly !== existingWeekly,
    },
  };
}
