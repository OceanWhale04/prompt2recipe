import { describe, expect, it } from "vitest";

import { generateLocalCombo, generateLocalWorkflow } from "../src/lib/local-engine";
import { KeywordRetriever } from "../src/lib/retriever";
import { selectCandidates } from "../src/lib/selection";

describe("local fallback engine", () => {
  it("builds a recipe-backed combo for a known task", async () => {
    const task = "自动解析 100 份 PDF 财报并导出成 Excel";
    const candidates = await selectCandidates(task, new KeywordRetriever());
    const combo = generateLocalCombo(task, candidates);

    expect(combo.models.length).toBeGreaterThan(0);
    expect(combo.mcps.length).toBeGreaterThan(0);
    expect(combo.skills.length).toBeGreaterThan(0);
    expect(combo.generatedBy).toBe("local");
    expect(combo.fallbackReason).toBe("missing_key");
    expect(combo.skills.map((skill) => skill.id)).toEqual(expect.arrayContaining(["pdf", "xlsx"]));
    expect(combo.skills.every((skill) => skill.reasoning.length > 0)).toBe(true);
  });

  it("forces required MCPs from task intent", async () => {
    const task = "每天监控竞品博客并抓取 RSS，对比本地代码库后提交 GitHub Draft PR";
    const candidates = await selectCandidates(task, new KeywordRetriever());
    const combo = generateLocalCombo(task, candidates, "provider_error");

    const mcpIds = combo.mcps.map((entry) => entry.id);
    expect(mcpIds.some((id) => id === "fetch" || id === "puppeteer")).toBe(true);
    expect(mcpIds).toContain("filesystem");
    expect(mcpIds).toContain("github");
    expect(combo.fallbackReason).toBe("provider_error");
  });

  it("removes XLSX when the task does not mention spreadsheets", async () => {
    const task = "监控网页更新并总结成 Markdown";
    const candidates = await selectCandidates(task, new KeywordRetriever());
    const combo = generateLocalCombo(task, candidates);
    expect(combo.skills.some((entry) => entry.id === "xlsx")).toBe(false);
  });

  it("marks explicit demo mode without a fallback reason", async () => {
    const task = "总结网页内容并生成 Markdown";
    const candidates = await selectCandidates(task, new KeywordRetriever());
    const combo = generateLocalCombo(task, candidates, null, "demo");
    expect(combo.computeSource).toBe("demo");
    expect(combo.fallbackReason).toBeUndefined();
  });

  it("generates an ordered workflow plan", async () => {
    const task = "自动解析 100 份 PDF 财报并导出成 Excel";
    const candidates = await selectCandidates(task, new KeywordRetriever());
    const combo = generateLocalCombo(task, candidates);
    const plan = generateLocalWorkflow(task, combo);

    expect(plan.steps).toHaveLength(4);
    expect(plan.generatedBy).toBe("local");
    expect(plan.fallbackReason).toBe("missing_key");
    expect(plan.steps[0].phase).toBe("prepare");
    expect(plan.steps[plan.steps.length - 1].phase).toBe("verify");
  });
});
