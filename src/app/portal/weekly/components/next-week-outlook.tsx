import { CalendarClock, Radar, ShieldCheck } from "lucide-react";

import type { WeeklyNextWeekOutlook } from "@/types/weekly";

export function NextWeekOutlook({ items }: { items: WeeklyNextWeekOutlook[] }) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Radar className="h-5 w-5 text-zinc-500" />
        <h2 className="text-lg font-semibold text-zinc-950">下周观察</h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.topic}
            className="flex min-h-72 flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-5 shadow-[inset_3px_0_0_0_#18181b]"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold leading-6 text-zinc-950">{item.topic}</h3>
              {item.expectedDate ? (
                <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-500">
                  {item.expectedDate}
                </span>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                降噪判定
              </div>
              <p className="text-sm leading-6 text-zinc-600">{item.whyItMatters}</p>
            </div>

            <div className="mt-auto flex flex-col gap-2 border-t border-zinc-100 pt-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                <CalendarClock className="h-3.5 w-3.5" />
                开发者行动指南
              </div>
              <p className="text-sm leading-6 text-zinc-600">{item.actionableAdvice}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
