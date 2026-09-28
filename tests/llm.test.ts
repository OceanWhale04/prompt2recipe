import { afterEach, describe, expect, it, vi } from "vitest";

import { getDeepSeekStatus } from "../src/lib/llm";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("DeepSeek status", () => {
  it("reports local mode when the key is missing", () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "   ");
    expect(getDeepSeekStatus()).toEqual({
      configured: false,
      provider: "local",
      model: "deepseek-chat",
      baseURLHost: null,
    });
  });

  it("reads and trims the configured key and base URL without exposing the secret", () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "  test-secret  ");
    vi.stubEnv("DEEPSEEK_BASE_URL", " https://api.deepseek.com/ ");
    vi.stubEnv("DEEPSEEK_MODEL", " deepseek-reasoner ");

    const status = getDeepSeekStatus();
    expect(status).toEqual({
      configured: true,
      provider: "deepseek",
      model: "deepseek-reasoner",
      baseURLHost: "api.deepseek.com",
    });
    expect(JSON.stringify(status)).not.toContain("test-secret");
  });
});
