import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { PortalHeader } from "@/components/portal-header";
import { SkillExplorer } from "@/components/skill-explorer";
import { skills } from "@/lib/kb";

export const metadata: Metadata = {
  title: "Agent Skill 广场 Skills | StackForge",
  description: "浏览、搜索和筛选可复用的 Agent Skills、框架与工作流能力。",
};

export default function SkillsPage() {
  return (
    <>
      <PortalHeader
        eyebrow="Reusable capabilities"
        title="Agent Skill 广场 Skills"
        description="浏览可复用的 Agent Skills、框架与工作流能力，按标签或任务模式快速筛选。"
        icon={Sparkles}
        count={skills.length}
      />
      <SkillExplorer items={skills} />
    </>
  );
}
