import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject, streamObject } from "ai";

import {
  getOllamaCompatibilityMessage,
  getOllamaModelCompatibility,
  OllamaCompatibilityError,
} from "./compute-provider";
import { getEntry } from "./kb";
import { generateLocalCombo, generateLocalWorkflow } from "./local-engine";
import { buildComboPrompt, buildWorkflowPrompt } from "./prompt";
import {
  recommendationComboSelectionSchema,
  workflowPlanSchema,
} from "./schemas";
import type { ComboCandidates } from "./selection";
import type {
  ComputeSource,
  RecommendationCombo,
  RuntimeProviderConfig,
  WorkflowPlan,
} from "./types";

const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

interface DeepSeekRuntime {
  apiKey: string;
  baseURL: string;
  modelId: string;
}

function getDeepSeekRuntime(): DeepSeekRuntime | null {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    apiKey,
    baseURL: (process.env.DEEPSEEK_BASE_URL?.trim() || DEFAULT_DEEPSEEK_BASE_URL).replace(
      /\/+$/,
      "",
    ),
    modelId: process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL,
  };
}

function normalizeOllamaBaseURL(baseURL: string) {
  const normalized = baseURL.trim().replace(/\/+$/, "");
  return normalized.endsWith("/v1") ? normalized : `${normalized}/v1`;
}

function resolveProvider(provider?: RuntimeProviderConfig) {
  if (provider?.mode === "demo") {
    return { model: null, source: "demo" as const };
  }

  if (provider?.mode === "byok") {
    const openaiCompatible = createOpenAICompatible({
      name: "byok",
      baseURL: provider.baseURL,
      apiKey: provider.apiKey,
    });

    return {
      model: openaiCompatible(provider.model),
      source: "byok" as const,
    };
  }

  if (provider?.mode === "ollama") {
    const compatibility = getOllamaModelCompatibility(provider.model);
    if (compatibility === "unsupported") {
      throw new OllamaCompatibilityError(
        getOllamaCompatibilityMessage(provider.model) ??
          `Ollama model ${provider.model} is not supported for structured output.`,
      );
    }

    const openaiCompatible = createOpenAICompatible({
      name: "ollama",
      baseURL: normalizeOllamaBaseURL(provider.baseURL),
      apiKey: "ollama",
    });

    return {
      model: openaiCompatible(provider.model),
      source: "ollama" as const,
    };
  }

  const runtime = getDeepSeekRuntime();
  if (!runtime) {
    return { model: null, source: "server" as const };
  }

  const deepseek = createDeepSeek({
    apiKey: runtime.apiKey,
    baseURL: runtime.baseURL,
  });

  return {
    model: deepseek(runtime.modelId),
    source: "server" as const,
  };
}

function logProviderError(
  stage: "combo" | "workflow",
  source: ComputeSource,
  error: unknown,
) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[recommend:${stage}] ${source} request failed: ${message}`);
}

type SelectionItem = {
  id: string;
  role: string;
  reasoning: string;
};

function hydrateSelection(
  kind: "model" | "mcp" | "skill",
  items: SelectionItem[],
  allowedIds: Set<string>,
): RecommendationCombo["models"] {
  return items.flatMap((item) => {
    if (!allowedIds.has(item.id)) return [];
    const entry = getEntry(kind, item.id);
    if (!entry) return [];

    return [
      {
        kind,
        id: entry.id,
        name: entry.name,
        url: entry.url,
        oneLiner: entry.oneLiner,
        role: item.role,
        reasoning: item.reasoning,
      },
    ];
  });
}

function hydrateComboSelection(
  task: string,
  selection: {
    rationale: string;
    models: SelectionItem[];
    mcps: SelectionItem[];
    skills: SelectionItem[];
    recipeId?: string;
  },
  candidates: ComboCandidates,
  source: ComputeSource,
): RecommendationCombo {
  const models = hydrateSelection(
    "model",
    selection.models,
    new Set(candidates.models.map((entry) => entry.id)),
  );
  const mcps = hydrateSelection(
    "mcp",
    selection.mcps,
    new Set(candidates.mcps.map((entry) => entry.id)),
  );
  const skills = hydrateSelection(
    "skill",
    selection.skills,
    new Set(candidates.skills.map((entry) => entry.id)),
  );

  if (models.length === 0) {
    throw new Error("Model returned no valid model selections.");
  }

  return {
    task,
    rationale: selection.rationale,
    models,
    mcps,
    skills,
    recipeId: candidates.recipes.some((recipe) => recipe.id === selection.recipeId)
      ? selection.recipeId
      : undefined,
    generatedBy: "ai",
    computeSource: source,
  };
}

function providerErrorResponse() {
  return new Response(
    JSON.stringify({
      error:
        "Provider request failed. Check the Base URL, API Key, model name, and network access.",
    }),
    {
      status: 502,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    },
  );
}

export function hasLlm() {
  return Boolean(getDeepSeekRuntime());
}

export function getDeepSeekStatus() {
  const runtime = getDeepSeekRuntime();
  if (!runtime) {
    return {
      configured: false,
      provider: "local" as const,
      model: DEFAULT_DEEPSEEK_MODEL,
      baseURLHost: null,
    };
  }

  let baseURLHost: string | null = null;
  try {
    baseURLHost = new URL(runtime.baseURL).host;
  } catch {
    baseURLHost = null;
  }

  return {
    configured: true,
    provider: "deepseek" as const,
    model: runtime.modelId,
    baseURLHost,
  };
}

function encodeJsonStream(value: unknown): Response {
  const encoder = new TextEncoder();
  const text = JSON.stringify(value);
  const chunks: Uint8Array[] = [];
  for (let index = 0; index < text.length; index += 80) {
    chunks.push(encoder.encode(text.slice(index, index + 80)));
  }

  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
    }),
    {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    },
  );
}

async function streamObjectWithFallback(
  textStream: AsyncIterable<string>,
  fallback: WorkflowPlan | null,
  source: ComputeSource,
): Promise<Response> {
  const iterator = textStream[Symbol.asyncIterator]();
  let first: IteratorResult<string>;

  try {
    first = await iterator.next();
  } catch (error) {
    logProviderError("workflow", source, error);
    return fallback ? encodeJsonStream(fallback) : providerErrorResponse();
  }

  if (first.done) {
    logProviderError(
      "workflow",
      source,
      new Error("Provider returned an empty workflow stream."),
    );
    return fallback ? encodeJsonStream(fallback) : providerErrorResponse();
  }

  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode(first.value));
        try {
          while (true) {
            const next = await iterator.next();
            if (next.done) break;
            controller.enqueue(encoder.encode(next.value));
          }
          controller.close();
        } catch (error) {
          logProviderError("workflow", source, error);
          controller.error(error);
        }
      },
      async cancel() {
        await iterator.return?.();
      },
    }),
    {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    },
  );
}

export async function generateCombo(
  task: string,
  candidates: ComboCandidates,
  provider?: RuntimeProviderConfig,
): Promise<RecommendationCombo> {
  const resolved = resolveProvider(provider);
  if (!resolved.model) {
    const fallbackReason = resolved.source === "demo" ? null : "missing_key";
    return generateLocalCombo(task, candidates, fallbackReason, resolved.source);
  }

  const { system, prompt } = buildComboPrompt(task, candidates);

  try {
    const result = await generateObject({
      model: resolved.model,
      schema: recommendationComboSelectionSchema,
      system,
      prompt,
    });

    return hydrateComboSelection(task, result.object, candidates, resolved.source);
  } catch (error) {
    logProviderError("combo", resolved.source, error);
    if (resolved.source === "byok" || resolved.source === "ollama") {
      throw error;
    }
    return generateLocalCombo(task, candidates, "provider_error", resolved.source);
  }
}

export async function generateWorkflowStream(
  task: string,
  combo: RecommendationCombo,
  provider?: RuntimeProviderConfig,
): Promise<Response> {
  const resolved = resolveProvider(provider);
  if (!resolved.model) {
    const fallbackReason = resolved.source === "demo" ? null : "missing_key";
    return encodeJsonStream(
      generateLocalWorkflow(task, combo, fallbackReason, resolved.source),
    );
  }

  const { system, prompt } = buildWorkflowPrompt(task, combo);
  const result = streamObject({
    model: resolved.model,
    schema: workflowPlanSchema,
    system,
    prompt,
  });

  const fallback =
    resolved.source === "server"
      ? generateLocalWorkflow(task, combo, "provider_error", resolved.source)
      : null;

  return streamObjectWithFallback(result.textStream, fallback, resolved.source);
}
