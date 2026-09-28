import { afterEach, describe, expect, it, vi } from "vitest";

import { mergeModelEntries } from "../scripts/etl/processors/clean-models";
import { mergeMcpEntries } from "../scripts/etl/processors/summarize-mcps";
import { buildWeeklyEditionWithAi } from "../scripts/etl/processors/noise-reducer";
import type { McpEntry, ModelEntry } from "../src/lib/types";

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

  it("keeps the highest GitHub star count when merging MCPs", () => {
    const merged = mergeMcpEntries([{ ...mcp, stars: 100 }], [mcp]);
    expect(merged[0].stars).toBe(100);
  });

  it("skips AI noise reduction when no DeepSeek key is configured", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    const result = await buildWeeklyEditionWithAi(
      [{ title: "News", link: "https://example.com", source: "Test", summary: "Summary" }],
      { currentEditionId: "test", editions: [] },
    );
    expect(result).toBeNull();
  });
});
