import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { describe, expect, it } from "vitest";

import { createStackForgeServer } from "../src/mcp/server";
import type { ArchitectEngine } from "../src/services/architect-engine";

describe("StackForge MCP server", () => {
  it("exposes and calls recommend_ai_stack", async () => {
    const engine = {
      generateArchitectureRecipe: async (task: string) => ({
        task,
        dataSource: "fallback",
        combo: {
          task,
          rationale: "test rationale",
          models: [
            {
              kind: "model",
              id: "deepseek-chat",
              name: "DeepSeek V3.2",
              url: "https://api-docs.deepseek.com/",
              oneLiner: "low cost",
              role: "reasoning",
              reasoning: "test reasoning",
            },
          ],
          mcps: [],
          skills: [],
          generatedBy: "local",
        },
        workflow: {
          steps: [
            {
              id: "prepare-01",
              phase: "prepare",
              title: "准备",
              action: "确认输入",
              detail: "固定边界",
              rationale: "先定边界",
            },
            {
              id: "configure-02",
              phase: "configure",
              title: "配置",
              action: "配置模型",
              detail: "完成连接",
              rationale: "可用性",
            },
            {
              id: "run-03",
              phase: "run",
              title: "执行",
              action: "运行任务",
              detail: "处理数据",
              rationale: "完成核心",
            },
            {
              id: "verify-04",
              phase: "verify",
              title: "校验",
              action: "检查结果",
              detail: "验证交付",
              rationale: "确认质量",
            },
          ],
        },
      }),
    } as unknown as ArchitectEngine;

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "1.0.0" });
    const server = createStackForgeServer(engine);

    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toContain("recommend_ai_stack");

    const result = await client.callTool({
      name: "recommend_ai_stack",
      arguments: { taskDescription: "解析 PDF 财报并导出 Excel" },
    });
    const content = result.content as Array<{ type?: string; text?: string }>;
    const text = content.find((item) => item.type === "text");
    expect(text?.text).toContain("推荐方案");

    await client.close();
  });
});
