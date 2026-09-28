import type { RuntimeProviderConfig } from "./types";

export type ComputeProvider = "byok" | "ollama" | "demo";

export interface ProviderSettings {
  provider: ComputeProvider;
  byokBaseUrl: string;
  byokApiKey: string;
  byokModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
}

export const PROVIDER_STORAGE_KEY = "prompt2recipe.provider-settings.v1";

export const DEFAULT_PROVIDER_SETTINGS: ProviderSettings = {
  provider: "demo",
  byokBaseUrl: "https://api.deepseek.com",
  byokApiKey: "",
  byokModel: "deepseek-chat",
  ollamaBaseUrl: "http://localhost:11434",
  ollamaModel: "qwen2.5:7b",
};

const LEGACY_DEFAULT_OLLAMA_MODEL = "deepseek-r1:7b";

function cleanUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseStoredProviderSettings(raw: string | null): ProviderSettings {
  if (!raw) return DEFAULT_PROVIDER_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<ProviderSettings>;
    const provider =
      parsed.provider === "byok" || parsed.provider === "ollama" || parsed.provider === "demo"
        ? parsed.provider
        : DEFAULT_PROVIDER_SETTINGS.provider;

    const storedOllamaModel =
      parsed.ollamaModel?.trim() || DEFAULT_PROVIDER_SETTINGS.ollamaModel;

    return {
      provider,
      byokBaseUrl: parsed.byokBaseUrl?.trim() || DEFAULT_PROVIDER_SETTINGS.byokBaseUrl,
      byokApiKey: parsed.byokApiKey?.trim() || "",
      byokModel: parsed.byokModel?.trim() || DEFAULT_PROVIDER_SETTINGS.byokModel,
      ollamaBaseUrl: parsed.ollamaBaseUrl?.trim() || DEFAULT_PROVIDER_SETTINGS.ollamaBaseUrl,
      ollamaModel:
        storedOllamaModel === LEGACY_DEFAULT_OLLAMA_MODEL
          ? DEFAULT_PROVIDER_SETTINGS.ollamaModel
          : storedOllamaModel,
    };
  } catch {
    return DEFAULT_PROVIDER_SETTINGS;
  }
}

export type OllamaModelCompatibility = "supported" | "experimental" | "unsupported" | "unknown";

export class OllamaCompatibilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OllamaCompatibilityError";
  }
}

export function getOllamaModelCompatibility(model: string): OllamaModelCompatibility {
  const match = model.match(/(\d+(?:\.\d+)?)\s*b(?:\b|$)/i);
  if (!match) return "unknown";

  const size = Number(match[1]);
  if (size < 3) return "unsupported";
  if (size < 7) return "experimental";
  return "supported";
}

export function getOllamaCompatibilityMessage(model: string): string | null {
  const compatibility = getOllamaModelCompatibility(model);
  if (compatibility === "unsupported") {
    return `Ollama 模型 ${model} 低于 3B，无法可靠完成严格 JSON 结构化输出。请改用 qwen2.5:7b、qwen2.5-coder:7b、deepseek-r1:7b 或 llama3.1:8b 等 7B+ 指令模型。`;
  }
  if (compatibility === "experimental") {
    return `Ollama 模型 ${model} 属于实验性范围（3B–7B）。可以运行，但复杂任务可能无法稳定满足 JSON Schema。推荐使用 7B+ 指令模型。`;
  }
  if (compatibility === "unknown") {
    return `无法从模型名判断参数规模。请确认 ${model} 支持 OpenAI-compatible /v1/chat/completions、JSON 输出与指令跟随。`;
  }
  return null;
}

export function validateProviderSettings(settings: ProviderSettings): string | null {
  if (settings.provider === "byok") {
    if (!isHttpUrl(cleanUrl(settings.byokBaseUrl))) return "Base URL 必须是有效的 http(s) 地址。";
    if (!settings.byokApiKey.trim()) return "请输入 API Key。";
    if (!settings.byokModel.trim()) return "请输入模型名称。";
  }

  if (settings.provider === "ollama") {
    if (!isHttpUrl(cleanUrl(settings.ollamaBaseUrl))) {
      return "Ollama Base URL 必须是有效的 http(s) 地址。";
    }
    if (!settings.ollamaModel.trim()) return "请输入 Ollama 模型名称。";
    const compatibility = getOllamaModelCompatibility(settings.ollamaModel);
    if (compatibility === "unsupported") {
      return getOllamaCompatibilityMessage(settings.ollamaModel);
    }
  }

  return null;
}

export function toRuntimeProviderConfig(
  settings: ProviderSettings,
): RuntimeProviderConfig {
  if (settings.provider === "byok") {
    return {
      mode: "byok",
      baseURL: cleanUrl(settings.byokBaseUrl),
      apiKey: settings.byokApiKey.trim(),
      model: settings.byokModel.trim(),
    };
  }

  if (settings.provider === "ollama") {
    return {
      mode: "ollama",
      baseURL: cleanUrl(settings.ollamaBaseUrl),
      model: settings.ollamaModel.trim(),
    };
  }

  return { mode: "demo" };
}
