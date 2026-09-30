import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { ArchitectEngine } from "../services/architect-engine";
import { formatArchitectureRecipe } from "./format-result";

const RECOMMEND_TOOL = {
  name: "recommend_ai_stack",
  description:
    "针对用户的开发或自动化任务，推荐最佳的 AI 技术栈组合配方（包含推荐 LLM + MCP Server + Skill + 4步落地指南）",
  inputSchema: {
    type: "object",
    properties: {
      taskDescription: {
        type: "string",
        description: "需要解决的开发或自动化任务描述",
      },
    },
    required: ["taskDescription"],
  },
};

export function createStackForgeServer(engine: ArchitectEngine = new ArchitectEngine()) {
  const server = new Server(
    {
      name: "stackforge-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [RECOMMEND_TOOL],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== "recommend_ai_stack") {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    const taskDescription = request.params.arguments?.taskDescription;
    if (typeof taskDescription !== "string" || taskDescription.trim().length < 2) {
      throw new Error("taskDescription must be a non-empty string.");
    }

    const recipe = await engine.generateArchitectureRecipe(taskDescription.trim());
    return {
      content: [
        {
          type: "text",
          text: formatArchitectureRecipe(recipe),
        },
      ],
    };
  });

  return server;
}

export async function startMcpServer(engine: ArchitectEngine = new ArchitectEngine()) {
  const server = createStackForgeServer(engine);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return server;
}
