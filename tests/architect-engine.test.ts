import { describe, expect, it } from "vitest";

import { ArchitectEngine } from "../src/services/architect-engine";
import type { Catalogs } from "../src/services/data-loader";

const catalogs: Catalogs = {
  models: [
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
      taskPatterns: ["summarization", "data extraction"],
    },
  ],
  mcps: [
    {
      id: "fetch",
      name: "Fetch MCP",
      transport: "npx",
      url: "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
      oneLiner: "抓取网页为 Markdown",
      tags: ["web", "fetch"],
      taskPatterns: ["fetch", "scrape"],
    },
    {
      id: "filesystem",
      name: "Filesystem MCP",
      transport: "npx",
      url: "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
      oneLiner: "读写本地文件",
      tags: ["files"],
      taskPatterns: ["local files"],
    },
  ],
  skills: [
    {
      id: "pdf",
      name: "PDF Skill",
      url: "https://github.com/anthropics/skills/tree/main/skills/pdf",
      oneLiner: "读取 PDF",
      tags: ["pdf"],
      taskPatterns: ["pdf reading"],
    },
    {
      id: "xlsx",
      name: "XLSX Skill",
      url: "https://github.com/anthropics/skills/tree/main/skills/xlsx",
      oneLiner: "生成 Excel",
      tags: ["excel"],
      taskPatterns: ["spreadsheet"],
    },
  ],
  recipes: [],
};

describe("ArchitectEngine", () => {
  it("returns a local recipe with four steps when no API key is configured", async () => {
    const engine = new ArchitectEngine();
    const recipe = await engine.generateRecipe("解析 PDF 财报并导出 Excel", catalogs);

    expect(recipe.combo.generatedBy).toBe("local");
    expect(recipe.workflow.steps).toHaveLength(4);
    expect(recipe.combo.skills.map((skill) => skill.id)).toEqual(
      expect.arrayContaining(["pdf", "xlsx"]),
    );
  });
});
