import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Catalog, McpEntry, ModelEntry, SkillEntry } from "../../src/lib/types";
import type { WeeklyDataStore } from "../../src/types/weekly";
import { fetchGitHubMcpRepositories } from "./fetchers/github-mcps";
import { fetchGitHubSkillRepositories } from "./fetchers/github-skills";
import { fetchOpenRouterModels } from "./fetchers/openrouter";
import { fetchRssNews } from "./fetchers/rss-news";
import { mergeModelEntries } from "./processors/clean-models";
import { mergeSkillEntries } from "./processors/clean-skills";
import { buildWeeklyEditionWithAi } from "./processors/noise-reducer";
import { mergeMcpEntries, summarizeMcpsWithDeepSeek } from "./processors/summarize-mcps";

const dataDir = path.resolve(process.cwd(), "data");

export interface EtlResult {
  models: ModelEntry[];
  mcps: McpEntry[];
  skills: SkillEntry[];
  weekly: WeeklyDataStore;
  refreshed: {
    models: boolean;
    mcps: boolean;
    skills: boolean;
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
  const [existingModels, existingMcps, existingSkills, existingWeekly] = await Promise.all([
    readCatalog<ModelEntry>("models.json"),
    readCatalog<McpEntry>("mcps.json"),
    readCatalog<SkillEntry>("skills.json"),
    readWeekly(),
  ]);
  const [remoteModels, remoteMcps, remoteSkills, news] = await Promise.all([
    settle("OpenRouter models", fetchOpenRouterModels()),
    settle("GitHub MCPs", fetchGitHubMcpRepositories()),
    settle("GitHub Agent Skills", fetchGitHubSkillRepositories()),
    settle("RSS news", fetchRssNews()),
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

  const skills =
    remoteSkills && remoteSkills.length > 0
      ? mergeSkillEntries(existingSkills, remoteSkills)
      : existingSkills;

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
    skills,
    weekly,
    refreshed: {
      models: Boolean(remoteModels?.length),
      mcps: Boolean(remoteMcps?.length),
      skills: Boolean(remoteSkills?.length),
      weekly: weekly !== existingWeekly,
    },
  };
}
