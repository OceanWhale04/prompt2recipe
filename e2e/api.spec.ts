import { expect, test } from "@playwright/test";

test("exposes provider status and local fallback metadata without leaking secrets", async ({
  request,
}) => {
  const statusResponse = await request.get("/api/recommend");
  expect(statusResponse.ok()).toBe(true);

  const status = await statusResponse.json();
  expect(["deepseek", "local"]).toContain(status.provider.provider);
  expect(JSON.stringify(status)).not.toMatch(/api.?key|secret/i);

  const demoResponse = await request.post("/api/recommend", {
    data: {
      task: "把竞品 RSS 摘要整理成 Markdown",
      stage: "combo",
      provider: { mode: "demo" },
    },
  });
  expect(demoResponse.ok()).toBe(true);
  const demoPayload = await demoResponse.json();
  expect(demoPayload.combo.generatedBy).toBe("local");
  expect(demoPayload.combo.computeSource).toBe("demo");
  expect(demoPayload.combo.fallbackReason).toBeUndefined();

  const unsupportedOllamaResponse = await request.post("/api/recommend", {
    data: {
      task: "监控 RSS",
      stage: "combo",
      provider: {
        mode: "ollama",
        baseURL: "http://localhost:11434",
        model: "qwen2.5:0.5b",
      },
    },
  });
  expect(unsupportedOllamaResponse.status()).toBe(400);
  const unsupportedOllamaPayload = await unsupportedOllamaResponse.json();
  expect(unsupportedOllamaPayload.details).toContain("低于 3B");
  if (status.provider.configured) {
    return;
  }

  const comboResponse = await request.post("/api/recommend", {
    data: {
      task: "每天监控竞品博客和 RSS，对比本地代码库并提交 GitHub Draft PR",
      stage: "combo",
    },
  });
  expect(comboResponse.ok()).toBe(true);

  const payload = await comboResponse.json();
  expect(payload.combo.generatedBy).toBe("local");
  expect(payload.combo.fallbackReason).toBe("missing_key");

  const mcpIds = payload.combo.mcps.map((item: { id: string }) => item.id);
  expect(
    payload.combo.mcps.every((item: { reasoning?: string }) => Boolean(item.reasoning)),
  ).toBe(true);
  expect(mcpIds.some((id: string) => id === "fetch" || id === "puppeteer")).toBe(true);
  expect(mcpIds).toContain("filesystem");
  expect(mcpIds).toContain("github");
});
