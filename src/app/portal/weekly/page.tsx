import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

import { ArchiveList } from "./components/archive-list";
import { CurrentIssue } from "./components/current-issue";
import { NextWeekOutlook } from "./components/next-week-outlook";
import { PortalHeader } from "@/components/portal-header";
import { currentWeeklyEdition, weeklyIssues } from "@/lib/kb";

export const metadata: Metadata = {
  title: "每周降噪 | StackForge",
  description: "AI 行业技术降噪、下周观察与往期归档。",
};

export default function WeeklyPage() {
  return (
    <>
      <PortalHeader
        eyebrow="每周降噪"
        title="每周降噪"
        description="只保留会影响技术选型与工作流设计的行业信号，并提供下周观察和可回溯的往期报告。"
        icon={CalendarDays}
        count={weeklyIssues.length}
      />

      {currentWeeklyEdition ? <CurrentIssue edition={currentWeeklyEdition} /> : null}
      {currentWeeklyEdition ? (
        <NextWeekOutlook items={currentWeeklyEdition.nextWeekOutlook} />
      ) : null}
      <ArchiveList editions={weeklyIssues} />
    </>
  );
}
