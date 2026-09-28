import { describe, expect, it } from "vitest";

import { buildComboPrompt, buildWorkflowPrompt } from "../src/lib/prompt";
import { KeywordRetriever } from "../src/lib/retriever";
import { selectCandidates } from "../src/lib/selection";
import type { RecommendationCombo } from "../src/lib/types";

describe("decision prompts", () => {
  it("embeds hard MCP and XLSX constraints", async () => {
    const task = "监控竞品网页，对比本地代码库并提交 GitHub Draft PR";
    const candidates = await selectCandidates(task, new KeywordRetriever());
    const { system, prompt } = buildComboPrompt(task, candidates);

    expect(system).toContain("Fetch MCP");
    expect(system).toContain("Puppeteer MCP");
    expect(system).toContain("Filesystem MCP");
    expect(system).toContain("GitHub MCP");
    expect(system).toContain("XLSX Skill is allowed ONLY");
    expect(system.toLowerCase()).toContain("json");
    expect(system).toContain('"models": [{ "id"');
    expect(prompt).toContain("MANDATORY MCP IDS");
    expect(prompt).toContain("fetch, puppeteer, filesystem, github");
  });

  it("forbids generic four-step fallback language", () => {
    const combo: RecommendationCombo = {
      task: "监控 RSS",
      rationale: "test",
      models: [],
      mcps: [],
      skills: [],
      generatedBy: "ai",
    };
    const { system } = buildWorkflowPrompt(combo.task, combo);
    expect(system).toContain("exactly four");
    expect(system.toLowerCase()).toContain("json");
    expect(system).toContain("准备运行环境");
    expect(system).toContain("Each action must name the exact selected tool");
  });
});
