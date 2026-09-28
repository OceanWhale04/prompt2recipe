"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Blocks, Bot, CalendarDays, Network, Settings, Sparkles } from "lucide-react";
import { useState } from "react";

import { ProviderSettingsModal } from "@/components/provider-settings-modal";
import { useProviderSettings } from "@/components/provider-settings-provider";
import { cn } from "@/lib/cn";

const items = [
  { href: "/", label: "架构决策", shortLabel: "决策", sublabel: "Engine", icon: Blocks },
  { href: "/portal/models", label: "模型对比", shortLabel: "模型", sublabel: "Models", icon: Bot },
  { href: "/portal/mcps", label: "MCP 广场", shortLabel: "MCP", sublabel: "MCPs", icon: Network },
  { href: "/portal/skills", label: "技能广场", shortLabel: "技能", sublabel: "Skills", icon: Sparkles },
  { href: "/portal/weekly", label: "每周降噪", shortLabel: "周报", sublabel: "Weekly", icon: CalendarDays },
];

const providerDots = {
  byok: "bg-blue-500",
  ollama: "bg-emerald-500",
  demo: "bg-amber-500",
} as const;

export function Navbar() {
  const pathname = usePathname();
  const { settings } = useProviderSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const settingsButton = (
    <button
      type="button"
      onClick={() => setSettingsOpen(true)}
      aria-label="打开算力来源设置"
      className="flex h-9 shrink-0 items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-950 sm:px-3"
    >
      <span className={cn("h-2 w-2 rounded-full", providerDots[settings.provider])} />
      <Settings className="h-3.5 w-3.5" />
      <span className="hidden xl:inline">设置 Settings</span>
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-2 sm:h-14 sm:flex-row sm:items-center sm:gap-3 sm:px-6 sm:py-0 lg:px-8">
          <div className="flex w-full items-center justify-between gap-3 sm:contents">
            <Link href="/" className="flex w-fit shrink-0 items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-white">
                <Blocks className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold tracking-tight text-zinc-900">StackForge</span>
            </Link>
            <span className="sm:hidden">{settingsButton}</span>
          </div>

          <nav
            aria-label="Primary navigation"
            className="grid w-full grid-cols-5 gap-1 sm:flex sm:w-auto sm:min-w-0 sm:flex-1 sm:items-center"
          >
            {items.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={`${item.label} ${item.sublabel}`}
                  className={cn(
                    "flex min-w-0 items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] font-medium transition-colors sm:shrink-0 sm:gap-1.5 sm:px-2 sm:text-xs lg:px-3",
                    active
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
                  )}
                >
                  <Icon className="hidden h-3.5 w-3.5 shrink-0 min-[380px]:block" />
                  <span className="truncate sm:hidden">{item.shortLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="hidden xl:inline">
                    {item.sublabel}
                  </span>
                </Link>
              );
            })}
          </nav>

          <span className="hidden sm:block">{settingsButton}</span>
        </div>
      </header>

      {settingsOpen ? (
        <ProviderSettingsModal onClose={() => setSettingsOpen(false)} />
      ) : null}
    </>
  );
}
