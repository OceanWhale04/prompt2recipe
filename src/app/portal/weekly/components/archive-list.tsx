import Link from "next/link";
import { ArrowRight, Archive } from "lucide-react";

import type { WeeklyReportEdition } from "@/types/weekly";

export function ArchiveList({ editions }: { editions: WeeklyReportEdition[] }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Archive className="h-5 w-5 text-zinc-500" />
        <h2 className="text-lg font-semibold text-zinc-950">往期归档</h2>
      </div>

      <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {editions.map((edition) => (
          <Link
            key={edition.id}
            href={`/portal/weekly/${edition.id}`}
            className="group grid gap-3 px-5 py-4 transition-colors hover:bg-zinc-50 sm:grid-cols-[130px_1fr_auto] sm:items-center"
          >
            <span className="text-xs font-medium text-zinc-400">{edition.dateRange}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-zinc-900">
                {edition.title}
              </span>
              <span className="mt-1 line-clamp-2 block text-xs leading-5 text-zinc-500">
                {edition.summary}
              </span>
            </span>
            <ArrowRight className="hidden h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-700 sm:block" />
          </Link>
        ))}
      </div>
    </section>
  );
}
