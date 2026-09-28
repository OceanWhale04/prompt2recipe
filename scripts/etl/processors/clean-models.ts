import type { ModelEntry } from "../../../src/lib/types";

function isValidModel(model: ModelEntry) {
  return (
    model.id.length > 0 &&
    model.name.length > 0 &&
    /^https?:\/\//.test(model.url) &&
    Number.isFinite(model.contextWindow) &&
    model.contextWindow > 0
  );
}

export function cleanModels(models: ModelEntry[]): ModelEntry[] {
  const unique = new Map<string, ModelEntry>();

  for (const model of models) {
    if (!isValidModel(model)) continue;
    unique.set(model.id, {
      ...model,
      tags: Array.from(new Set(model.tags.filter(Boolean))),
      taskPatterns: Array.from(new Set(model.taskPatterns.filter(Boolean))),
      keywords: Array.from(new Set((model.keywords ?? []).filter(Boolean))),
    });
  }

  return Array.from(unique.values()).sort((a, b) => b.contextWindow - a.contextWindow);
}

export function mergeModelEntries(
  existing: ModelEntry[],
  incoming: ModelEntry[],
): ModelEntry[] {
  return cleanModels([...existing, ...incoming]);
}
