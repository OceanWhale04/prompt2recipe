import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { DataLoader } from "../src/services/data-loader";

const catalogs = {
  models: {
    version: 1,
    updatedAt: "2026-09-30T00:00:00.000Z",
    items: [
      {
        id: "deepseek-chat",
        name: "DeepSeek V3.2",
        provider: "DeepSeek",
        category: "chat",
        costTier: "low",
        contextWindow: 128000,
        url: "https://api-docs.deepseek.com/",
        oneLiner: "低成本推理模型",
        tags: ["reasoning", "api"],
        taskPatterns: ["summarization"],
      },
    ],
  },
  mcps: {
    version: 1,
    updatedAt: "2026-09-30T00:00:00.000Z",
    items: [
      {
        id: "fetch",
        name: "Fetch MCP",
        transport: "npx",
        url: "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
        oneLiner: "抓取网页为 Markdown",
        tags: ["web"],
        taskPatterns: ["fetch"],
      },
    ],
  },
  skills: {
    version: 1,
    updatedAt: "2026-09-30T00:00:00.000Z",
    items: [
      {
        id: "pdf",
        name: "PDF Skill",
        url: "https://github.com/anthropics/skills/tree/main/skills/pdf",
        oneLiner: "读取 PDF",
        tags: ["pdf"],
        taskPatterns: ["pdf reading"],
      },
    ],
  },
  recipes: {
    version: 1,
    updatedAt: "2026-09-30T00:00:00.000Z",
    items: [],
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DataLoader", () => {
  it("falls back to bundled data when the network fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const cacheDir = await mkdtemp(path.join(os.tmpdir(), "stackforge-mcp-test-"));
    const loader = new DataLoader({ cacheDir, ttlMs: 1_000 });

    const result = await loader.load();

    expect(result.source).toBe("fallback");
    expect(result.models.length).toBeGreaterThan(0);
    expect(result.mcps.length).toBeGreaterThan(0);
    expect(result.skills.length).toBeGreaterThan(0);
  });

  it("loads remote data and reuses it from cache", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const filename = url.split("/").pop();
      const key = filename?.replace(".json", "") as keyof typeof catalogs;
      return new Response(JSON.stringify(catalogs[key]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const cacheDir = await mkdtemp(path.join(os.tmpdir(), "stackforge-mcp-test-"));
    const loader = new DataLoader({ cacheDir, ttlMs: 60_000 });

    const first = await loader.load();
    const second = await loader.load();

    expect(first.source).toBe("remote");
    expect(second.source).toBe("cache");
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(await readFile(path.join(cacheDir, "models.json"), "utf8")).toContain("deepseek-chat");
  });
});
