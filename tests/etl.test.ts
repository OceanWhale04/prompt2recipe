import { afterEach, describe, expect, it, vi } from "vitest";

import { mergeModelEntries } from "../scripts/etl/processors/clean-models";
import { mergeSkillEntries } from "../scripts/etl/processors/clean-skills";
import { mergeMcpEntries } from "../scripts/etl/processors/summarize-mcps";
import { buildWeeklyEditionWithAi, getPreviousCompletedWeek } from "../scripts/etl/processors/noise-reducer";
import type { McpEntry, ModelEntry, SkillEntry } from "../src/lib/types";

const model: ModelEntry = {
  id: "test-model",
  name: "Test Model",
  provider: "Test",
  category: "general",
  costTier: "low",
  contextWindow: 128000,
  url: "https://example.com/model",
  oneLiner: "Test model",
  tags: ["test"],
  taskPatterns: ["testing"],
};

const mcp: McpEntry = {
  id: "test-mcp",
  name: "Test MCP",
  transport: "stdio",
  url: "https://github.com/example/test-mcp",
  github: "https://github.com/example/test-mcp",
  oneLiner: "Test MCP",
  tags: ["mcp"],
  taskPatterns: ["testing"],
  stars: 42,
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ETL processors", () => {
  it("deduplicates and cleans model entries", () => {
    const merged = mergeModelEntries([model], [{ ...model, oneLiner: "Updated model" }]);
    expect(merged).toHaveLength(1);
    expect(merged[0].oneLiner).toBe("Updated model");
  });

  it("deduplicates Skill entries and keeps refreshed metadata", () => {
    const skill: SkillEntry = {
      id: "test-skill",
      name: "Test Skill",
      url: "https://github.com/example/test-skill",
      oneLiner: "Old summary",
      tags: ["skill"],
      taskPatterns: ["testing"],
      stars: 10,
    };
    const merged = mergeSkillEntries(
      [skill],
      [{ ...skill, oneLiner: "Updated summary", stars: 20 }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].oneLiner).toBe("Updated summary");
    expect(merged[0].stars).toBe(20);
  });
  it("keeps the highest GitHub star count when merging MCPs", () => {
    const merged = mergeMcpEntries([{ ...mcp, stars: 100 }], [mcp]);
    expect(merged[0].stars).toBe(100);
  });

  it("selects the previous completed Monday-Sunday week", () => {
    const week = getPreviousCompletedWeek(new Date("2026-09-29T00:00:00.000Z"));
    expect(week.id).toBe("2026-w39");
    expect(week.dateRange).toBe("2026.09.21 - 2026.09.27");
  });

  it("does not generate weekly content without an AI provider", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    vi.stubEnv("OLLAMA_BASE_URL", "");
    vi.stubEnv("OLLAMA_MODEL", "");
    const store = { currentEditionId: "test", editions: [] };
    const result = await buildWeeklyEditionWithAi(
      [{ title: "Update", link: "https://example.com", source: "Test", summary: "Summary" }],
      store,
      new Date("2026-09-29T00:00:00.000Z"),
    );
    expect(result).toBe(store);
  });

  it("does not overwrite an existing edition for the same week", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    const store = {
      currentEditionId: "test",
      editions: [],
    };
    const existingId = getPreviousCompletedWeek(new Date("2026-09-29T00:00:00.000Z")).id;
    const existingStore = {
      currentEditionId: existingId,
      editions: [
        {
          id: existingId,
          title: "已有周报",
          dateRange: "2026.09.21 - 2026.09.27",
          summary: "已有内容",
          generationMode: "ai" as const,
          keyHighlights: [
            {
              category: "Workflow" as const,
              title: "已有信号",
              description: "已有描述",
              impactScore: 3,
            },
          ],
          nextWeekOutlook: [
            {
              topic: "已有主题",
              whyItMatters: "已有判断",
              actionableAdvice: "已有建议",
            },
          ],
          fullMarkdownContent: "# 已有周报",
        },
      ],
    };
    const result = await buildWeeklyEditionWithAi(
      [{ title: "Update", link: "https://example.com", source: "Test", summary: "Summary" }],
      existingStore,
      new Date("2026-09-29T00:00:00.000Z"),
    );
    expect(result).toBe(existingStore);
    expect(store.editions).toHaveLength(0);
  });
});
