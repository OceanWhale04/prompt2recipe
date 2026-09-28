import { afterEach, describe, expect, it, vi } from "vitest";

import { mergeModelEntries } from "../scripts/etl/processors/clean-models";
import { mergeSkillEntries } from "../scripts/etl/processors/clean-skills";
import { mergeMcpEntries } from "../scripts/etl/processors/summarize-mcps";
import { buildWeeklyEditionWithAi } from "../scripts/etl/processors/noise-reducer";
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

  it("uses an RSS-generated edition when no DeepSeek key is configured", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    const result = await buildWeeklyEditionWithAi(
      [
        {
          title: "MCP protocol update",
          link: "https://example.com/news",
          source: "Test",
          summary: "A new MCP capability was released.",
        },
      ],
      { currentEditionId: "test", editions: [] },
      new Date("2026-10-04T00:00:00.000Z"),
    );
    expect(result?.editions[0].generationMode).toBe("rss");
    expect(result?.editions[0].keyHighlights[0].category).toBe("MCP");
  });

  it("does not overwrite an existing edition for the same week", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    const first = await buildWeeklyEditionWithAi(
      [{ title: "Update", link: "https://example.com", source: "Test", summary: "Summary" }],
      { currentEditionId: "test", editions: [] },
      new Date("2026-09-28T00:00:00.000Z"),
    );
    const second = await buildWeeklyEditionWithAi(
      [{ title: "Update", link: "https://example.com", source: "Test", summary: "Summary" }],
      first!,
      new Date("2026-09-28T00:00:00.000Z"),
    );
    expect(second).toBe(first);
  });
});
