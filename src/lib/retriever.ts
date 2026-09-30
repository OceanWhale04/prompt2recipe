import { mcps, models, skills } from "./kb";
import type { BaseEntry, McpEntry, ModelEntry, Retriever, SearchHit, SkillEntry } from "./types";

const CJK_RANGE = /[\u4e00-\u9fff]/;

export function tokenize(input: string): string[] {
  const normalized = input.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ");
  const tokens: string[] = [];

  for (const part of normalized.split(/\s+/).filter(Boolean)) {
    const segments = part.split(/([a-z0-9]+)|([\u4e00-\u9fff]+)/gi).filter(Boolean);
    for (const segment of segments) {
      if (segment.length === 0) continue;
      if (CJK_RANGE.test(segment)) {
        for (let i = 0; i < segment.length; i += 1) {
          tokens.push(segment[i]);
          if (i + 1 < segment.length) tokens.push(segment.slice(i, i + 2));
        }
      } else {
        tokens.push(segment);
      }
    }
  }

  return Array.from(new Set(tokens));
}

function entryText(entry: BaseEntry): string {
  return [
    entry.name,
    entry.oneLiner,
    entry.tags.join(" "),
    entry.taskPatterns.join(" "),
    entry.keywords?.join(" ") ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function scoreEntry(entry: BaseEntry, queryTokens: string[]): number {
  const haystack = entryText(entry);
  const haystackTokens = new Set(tokenize(haystack));
  let score = 0;

  for (const token of queryTokens) {
    if (token.length < 2) continue;
    if (haystackTokens.has(token)) score += 3;
    else if (haystack.includes(token)) score += 1;
  }

  return score;
}

export class KeywordRetriever implements Retriever {
  private readonly catalog: {
    models: ModelEntry[];
    mcps: McpEntry[];
    skills: SkillEntry[];
  };

  constructor(
    catalog: {
      models: ModelEntry[];
      mcps: McpEntry[];
      skills: SkillEntry[];
    } = { models, mcps, skills },
  ) {
    this.catalog = catalog;
  }

  async search(query: string, k: number): Promise<SearchHit[]> {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const hits: SearchHit[] = [];

    for (const entry of this.catalog.models) {
      const score = scoreEntry(entry, queryTokens);
      if (score > 0) hits.push({ kind: "model", id: entry.id, score });
    }
    for (const entry of this.catalog.mcps) {
      const score = scoreEntry(entry, queryTokens);
      if (score > 0) hits.push({ kind: "mcp", id: entry.id, score });
    }
    for (const entry of this.catalog.skills) {
      const score = scoreEntry(entry, queryTokens);
      if (score > 0) hits.push({ kind: "skill", id: entry.id, score });
    }

    return hits.sort((a, b) => b.score - a.score).slice(0, k);
  }
}
