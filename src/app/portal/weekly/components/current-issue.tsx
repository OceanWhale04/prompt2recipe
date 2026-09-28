import { ArrowUpRight, CircleDot, ExternalLink } from "lucide-react";

import type { WeeklyReportEdition } from "@/types/weekly";

const categoryStyles = {
  Model: "bg-sky-50 text-sky-700",
  MCP: "bg-emerald-50 text-emerald-700",
  Workflow: "bg-violet-50 text-violet-700",
} as const;

export function CurrentIssue({ edition }: { edition: WeeklyReportEdition }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-medium text-white">
            最新一期
          </span>
          <span className="text-xs text-zinc-400">{edition.dateRange}</span>
        </div>
        <h2 className="max-w-4xl text-2xl font-semibold leading-9 tracking-tight text-zinc-950">
          {edition.title}
        </h2>
        <p className="max-w-4xl text-sm leading-7 text-zinc-600">{edition.summary}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {edition.keyHighlights.map((highlight) => (
          <article
            key={highlight.title}
            className="flex min-h-56 flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${categoryStyles[highlight.category]}`}
              >
                {highlight.category === "Model" ? "模型" : highlight.category === "Workflow" ? "工作流" : "MCP"}
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-zinc-500">
                <CircleDot className="h-3.5 w-3.5" />
                影响指数 {highlight.impactScore}/5
              </span>
            </div>
            <h3 className="text-base font-semibold leading-6 text-zinc-950">{highlight.title}</h3>
            <p className="text-sm leading-6 text-zinc-600">{highlight.description}</p>
            {highlight.link ? (
              <a
                href={highlight.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-950"
              >
                查看来源
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <ArrowUpRight className="mt-auto h-4 w-4 text-zinc-300" />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
