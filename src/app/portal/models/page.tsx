import type { Metadata } from "next";
import { Bot, ExternalLink } from "lucide-react";

import { PortalHeader } from "@/components/portal-header";
import { models } from "@/lib/kb";

export const metadata: Metadata = {
  title: "模型对比 Models | StackForge",
  description: "主流 AI 模型的上下文、成本、特点与官方入口对比。",
};

const costLabels = {
  low: { label: "低成本", className: "bg-emerald-50 text-emerald-700" },
  medium: { label: "中等成本", className: "bg-amber-50 text-amber-700" },
  high: { label: "高成本", className: "bg-rose-50 text-rose-700" },
};

function formatContext(tokens: number) {
  if (tokens >= 1_000_000) return `${tokens / 1_000_000}M`;
  return `${Math.round(tokens / 1000)}K`;
}

export default function ModelsPage() {
  return (
    <>
      <PortalHeader
        eyebrow="Model intelligence"
        title="模型对比 Models"
        description="按上下文窗口、成本层级、关键能力与任务模式快速比较主流模型。所有条目均链接到官方模型文档或发布页。"
        icon={Bot}
        count={models.length}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {models.map((model) => {
          const cost = costLabels[model.costTier];
          return (
            <article
              key={model.id}
              className="flex min-h-64 flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    {model.provider} / {model.category}
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-zinc-950">{model.name}</h2>
                </div>
                <a
                  href={model.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${model.name} documentation`}
                  className="text-zinc-300 transition-colors hover:text-zinc-900"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <p className="text-sm leading-6 text-zinc-600">{model.oneLiner}</p>

              <dl className="grid grid-cols-2 gap-3 rounded-md bg-zinc-50 p-3">
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Context
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-zinc-900">
                    {formatContext(model.contextWindow)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Cost
                  </dt>
                  <dd className="mt-1">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cost.className}`}>
                      {cost.label}
                    </span>
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-1.5">
                {model.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] text-zinc-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mt-auto text-xs leading-5 text-zinc-400">
                适合：{model.taskPatterns.slice(0, 4).join(" · ")}
              </p>
            </article>
          );
        })}
      </section>
    </>
  );
}
