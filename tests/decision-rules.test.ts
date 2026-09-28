import { describe, expect, it } from "vitest";

import { detectDecisionSignals } from "../src/lib/decision-rules";

describe("decision signals", () => {
  it("requires a web connector for monitoring tasks", () => {
    const signals = detectDecisionSignals("每天监控竞品博客和 RSS，发现更新后总结");
    expect(signals.needsWebMonitoring).toBe(true);
    expect(signals.mandatoryMcpIds).toEqual(expect.arrayContaining(["fetch", "puppeteer"]));
  });

  it("requires Filesystem and GitHub MCPs for repository tasks", () => {
    const signals = detectDecisionSignals("对比本地代码库并提交 Draft PR 到 GitHub");
    expect(signals.needsFilesystem).toBe(true);
    expect(signals.needsGithub).toBe(true);
    expect(signals.mandatoryMcpIds).toEqual(expect.arrayContaining(["filesystem", "github"]));
  });

  it("maps task outputs to required skills", () => {
    const signals = detectDecisionSignals("解析 PDF 财报并导出 Excel 报表");
    expect(signals.mandatorySkillIds).toEqual(expect.arrayContaining(["pdf", "xlsx"]));
  });
  it("allows XLSX only for explicit spreadsheet tasks", () => {
    expect(detectDecisionSignals("把财报导出成 Excel 报表").xlsxAllowed).toBe(true);
    expect(detectDecisionSignals("总结网页内容并生成 Markdown").xlsxAllowed).toBe(false);
  });
});
