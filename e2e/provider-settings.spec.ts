import { expect, test } from "@playwright/test";

test("persists Ollama settings and updates the compute source label", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await expect(page.getByText(/算力来源: 体验模式/)).toBeVisible();
  await page.locator('button[aria-label="打开算力来源设置"]:visible').click();

  await page.getByRole("dialog").getByText("本地 Ollama", { exact: true }).click();
  await page.getByLabel("Ollama Base URL").fill("http://localhost:11434");
  await page.getByLabel("Model Name").fill("qwen2.5:7b");
  await page.getByRole("button", { name: "保存设置" }).click();

  await expect(page.getByText("算力来源: 本地 Ollama (qwen2.5:7b)")).toBeVisible();
  await page.reload();
  await expect(page.getByText("算力来源: 本地 Ollama (qwen2.5:7b)")).toBeVisible();
});
