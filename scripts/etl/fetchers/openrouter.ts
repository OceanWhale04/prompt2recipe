import type { ModelEntry } from "../../../src/lib/types";

interface OpenRouterModel {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  architecture?: {
    modality?: string;
    input_modalities?: string[];
  };
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function costTier(model: OpenRouterModel): ModelEntry["costTier"] {
  const prompt = Number(model.pricing?.prompt ?? 0);
  const completion = Number(model.pricing?.completion ?? 0);
  const average = (prompt + completion) / 2;

  if (average < 0.000002) return "low";
  if (average < 0.00002) return "medium";
  return "high";
}

export async function fetchOpenRouterModels(): Promise<ModelEntry[]> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch("https://openrouter.ai/api/v1/models", { headers });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as { data?: OpenRouterModel[] };
  const models = payload.data ?? [];

  return models
    .filter((model) => model.id && model.context_length)
    .slice(0, 80)
    .map((model) => {
      const [rawProvider = "unknown", ...nameParts] = model.id.split("/");
      const provider = rawProvider.replace(/^~/, "");
      const displayName = model.name?.trim() || nameParts.join("/") || model.id;
      const description =
        model.description?.trim() ||
        `${displayName} is available through OpenRouter with a ${model.context_length} token context window.`;

      return {
        id: `openrouter-${slug(model.id)}`,
        name: displayName,
        provider,
        category: model.architecture?.modality ?? "general",
        costTier: costTier(model),
        contextWindow: model.context_length ?? 0,
        url: `https://openrouter.ai/models/${model.id}`,
        oneLiner: description.slice(0, 180),
        tags: ["openrouter", provider, costTier(model)],
        taskPatterns: ["general reasoning", "chat", "structured generation"],
        keywords: [model.id, provider, displayName],
      } satisfies ModelEntry;
    });
}
