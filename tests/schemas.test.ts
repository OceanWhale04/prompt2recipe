import { describe, expect, it } from "vitest";

import {
  comboItemSchema,
  recommendRequestSchema,
  workflowPlanSchema,
} from "../src/lib/schemas";

describe("recommendRequestSchema", () => {
  it("accepts a valid combo request", () => {
    const result = recommendRequestSchema.safeParse({
      task: "解析 PDF 财报并导出 Excel",
      stage: "combo",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a workflow request with a combo", () => {
    const result = recommendRequestSchema.safeParse({
      task: "解析 PDF 财报并导出 Excel",
      stage: "workflow",
      combo: {
        task: "解析 PDF 财报并导出 Excel",
        rationale: "test",
        models: [],
        mcps: [],
        skills: [],
        generatedBy: "local",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a workflow request without a combo", () => {
    const result = recommendRequestSchema.safeParse({
      task: "解析 PDF 财报并导出 Excel",
      stage: "workflow",
    });
    expect(result.success).toBe(false);
  });
});

describe("provider request schemas", () => {
  it("accepts BYOK, Ollama, and demo provider modes", () => {
    expect(
      recommendRequestSchema.safeParse({
        task: "RSS 监控",
        stage: "combo",
        provider: {
          mode: "byok",
          baseURL: "https://api.deepseek.com",
          apiKey: "secret",
          model: "deepseek-chat",
        },
      }).success,
    ).toBe(true);
    expect(
      recommendRequestSchema.safeParse({
        task: "RSS 监控",
        stage: "combo",
        provider: {
          mode: "ollama",
          baseURL: "http://localhost:11434",
          model: "deepseek-r1:7b",
        },
      }).success,
    ).toBe(true);
    expect(
      recommendRequestSchema.safeParse({
        task: "RSS 监控",
        stage: "combo",
        provider: { mode: "demo" },
      }).success,
    ).toBe(true);
  });

  it("rejects BYOK requests without an API key", () => {
    expect(
      recommendRequestSchema.safeParse({
        task: "RSS 监控",
        stage: "combo",
        provider: {
          mode: "byok",
          baseURL: "https://api.deepseek.com",
          apiKey: "",
          model: "deepseek-chat",
        },
      }).success,
    ).toBe(false);
  });
});

describe("strict decision schemas", () => {
  it("requires reasoning on every recommended item", () => {
    const result = comboItemSchema.safeParse({
      kind: "mcp",
      id: "github",
      name: "GitHub MCP",
      url: "https://github.com/modelcontextprotocol/servers",
      oneLiner: "GitHub operations",
      role: "PR automation",
    });
    expect(result.success).toBe(false);
  });

  it("requires exactly four workflow steps", () => {
    const step = (id: string, phase: "prepare" | "configure" | "run" | "verify") => ({
      id,
      phase,
      title: `Step ${id}`,
      action: "Task-specific action",
      detail: "Task-specific detail",
      rationale: "Task-specific reason",
    });

    expect(
      workflowPlanSchema.safeParse({
        steps: [step("1", "prepare"), step("2", "configure"), step("3", "run")],
      }).success,
    ).toBe(false);

    expect(
      workflowPlanSchema.safeParse({
        steps: [
          step("1", "prepare"),
          step("2", "configure"),
          step("3", "run"),
          step("4", "verify"),
        ],
      }).success,
    ).toBe(true);
  });
});