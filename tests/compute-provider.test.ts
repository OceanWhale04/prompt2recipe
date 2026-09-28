import { describe, expect, it } from "vitest";

import {
  DEFAULT_PROVIDER_SETTINGS,
  getOllamaModelCompatibility,
  parseStoredProviderSettings,
  toRuntimeProviderConfig,
  validateProviderSettings,
  type ProviderSettings,
} from "../src/lib/compute-provider";

describe("compute provider settings", () => {
  it("falls back to safe defaults for invalid storage", () => {
    expect(parseStoredProviderSettings("{invalid")).toEqual(DEFAULT_PROVIDER_SETTINGS);
  });

  it("validates BYOK and Ollama requirements", () => {
    const byok: ProviderSettings = {
      ...DEFAULT_PROVIDER_SETTINGS,
      provider: "byok",
      byokApiKey: "",
    };
    expect(validateProviderSettings(byok)).toBe("请输入 API Key。");

    const ollama: ProviderSettings = {
      ...DEFAULT_PROVIDER_SETTINGS,
      provider: "ollama",
      ollamaBaseUrl: "not-a-url",
    };
    expect(validateProviderSettings(ollama)).toBe(
      "Ollama Base URL 必须是有效的 http(s) 地址。",
    );
  });

  it("classifies Ollama model capability by parameter size", () => {
    expect(getOllamaModelCompatibility("qwen2.5:0.5b")).toBe("unsupported");
    expect(getOllamaModelCompatibility("qwen2.5:3b")).toBe("experimental");
    expect(getOllamaModelCompatibility("deepseek-r1:7b")).toBe("supported");
    expect(getOllamaModelCompatibility("custom-instruct")).toBe("unknown");
  });

  it("rejects unsupported small Ollama models", () => {
    expect(
      validateProviderSettings({
        ...DEFAULT_PROVIDER_SETTINGS,
        provider: "ollama",
        ollamaModel: "qwen2.5:0.5b",
      }),
    ).toContain("低于 3B");
  });
  it("converts settings into per-request provider payloads", () => {
    expect(
      toRuntimeProviderConfig({
        ...DEFAULT_PROVIDER_SETTINGS,
        provider: "byok",
        byokBaseUrl: " https://api.deepseek.com/ ",
        byokApiKey: " secret ",
        byokModel: " deepseek-chat ",
      }),
    ).toEqual({
      mode: "byok",
      baseURL: "https://api.deepseek.com",
      apiKey: "secret",
      model: "deepseek-chat",
    });

    expect(
      toRuntimeProviderConfig({
        ...DEFAULT_PROVIDER_SETTINGS,
        provider: "ollama",
        ollamaModel: "deepseek-r1:7b",
      }),
    ).toEqual({
      mode: "ollama",
      baseURL: "http://localhost:11434",
      model: "deepseek-r1:7b",
    });
  });
});
