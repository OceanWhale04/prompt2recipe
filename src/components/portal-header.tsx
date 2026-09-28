import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

export function PortalHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  count,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  count?: number;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-zinc-200 pb-6">
      <Link
        href="/"
        className="flex w-fit items-center gap-2 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        返回架构决策 Engine
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
              {eyebrow}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{description}</p>
          </div>
        </div>
        {typeof count === "number" ? (
          <span className="w-fit rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500">
            {count} 条
          </span>
        ) : null}
      </div>
    </header>
  );
}
