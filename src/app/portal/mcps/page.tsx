import type { Metadata } from "next";
import { Network } from "lucide-react";

import { McpExplorer } from "@/components/mcp-explorer";
import { PortalHeader } from "@/components/portal-header";
import { mcps } from "@/lib/kb";

export const metadata: Metadata = {
  title: "MCP 广场 MCPs | StackForge",
  description: "按标签浏览和搜索高星 MCP 工具，查看安装命令与官方仓库。",
};

export default function McpsPage() {
  return (
    <>
      <PortalHeader
        eyebrow="Tool protocol"
        title="MCP 广场 MCPs"
        description="按 Tag 分类浏览 MCP 工具，搜索名称、能力或任务场景。优先标注了官方维护与已校验条目。"
        icon={Network}
        count={mcps.length}
      />
      <McpExplorer items={mcps} />
    </>
  );
}
