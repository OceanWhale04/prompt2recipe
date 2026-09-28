import type { SkillEntry } from "../../../src/lib/types";

export function mergeSkillEntries(existing: SkillEntry[], incoming: SkillEntry[]): SkillEntry[] {
  const merged = new Map<string, SkillEntry>();

  for (const item of [...existing, ...incoming]) {
    if (!item.id || !item.name || !item.url) continue;
    const previous = merged.get(item.id);
    merged.set(item.id, {
      ...previous,
      ...item,
      tags: Array.from(new Set([...(previous?.tags ?? []), ...item.tags])),
      taskPatterns: Array.from(new Set([...(previous?.taskPatterns ?? []), ...item.taskPatterns])),
      keywords: Array.from(new Set([...(previous?.keywords ?? []), ...(item.keywords ?? [])])),
      stars: Math.max(previous?.stars ?? 0, item.stars ?? 0),
    });
  }

  return Array.from(merged.values()).sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));
}
