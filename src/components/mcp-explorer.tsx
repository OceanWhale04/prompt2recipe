"use client";

import { ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import type { McpEntry } from "@/lib/types";

const ALL_TAGS = "__all__";

export function McpExplorer({ items }: { items: McpEntry[] }) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState(ALL_TAGS);

  const tags = useMemo(
    () =>
      Array.from(new Set(items.flatMap((item) => item.tags)))
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 18),
    [items],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        normalized.length === 0 ||
        [item.name, item.oneLiner, item.tags.join(" "), item.taskPatterns.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      const matchesTag = activeTag === ALL_TAGS || item.tags.includes(activeTag);
      return matchesQuery && matchesTag;
    });
  }, [activeTag, items, query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, McpEntry[]>();
    for (const item of filtered) {
      const groupTags = activeTag === ALL_TAGS ? item.tags.slice(0, 1) : [activeTag];
      for (const tag of groupTags) {
        const current = groups.get(tag) ?? [];
        current.push(item);
        groups.set(tag, current);
      }
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [activeTag, filtered]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索名称、能力或任务模式 / Search MCP tools"
            className="h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTag(ALL_TAGS)}
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
              activeTag === ALL_TAGS
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900",
            )}
          >
            全部 All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag)}
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                activeTag === tag
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900",
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center text-sm text-zinc-400">
          没有匹配的 MCP 工具 / No matching MCP tools
        </div>
      ) : (
        grouped.map(([tag, entries]) => (
          <section key={tag} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-900">{tag}</h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                {entries.length}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {entries.map((item) => (
                <article
                  key={`${tag}-${item.id}`}
                  className="flex min-h-44 flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-zinc-900">{item.name}</h3>
                        {item.verified ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            verified
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                        {item.transport}
                      </p>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${item.name}`}
                      className="text-zinc-300 transition-colors hover:text-zinc-900"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <p className="text-xs leading-5 text-zinc-600">{item.oneLiner}</p>
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 4).map((itemTag) => (
                      <span
                        key={itemTag}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500"
                      >
                        {itemTag}
                      </span>
                    ))}
                  </div>
                  {item.command ? (
                    <code className="block overflow-x-auto rounded-md bg-zinc-950 px-3 py-2 text-[10px] text-zinc-200">
                      {item.command}
                    </code>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
