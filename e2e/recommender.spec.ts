import { expect, test } from "@playwright/test";

test("generates a combo and appends workflow steps", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const textarea = page.getByPlaceholder(/自动解析|parse 100/i);
  await textarea.click();
  await page.keyboard.type("自动解析 100 份 PDF 财报并导出成 Excel");
  await expect(page.getByRole("button", { name: "生成组合", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "生成组合", exact: true }).click();

  await expect(page.getByText("推荐工具组合")).toBeVisible();
  await expect(page.getByRole("button", { name: "生成具体实施建议", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "生成具体实施建议", exact: true }).click();
  await expect(page.getByRole("heading", { name: "具体实施建议" })).toBeVisible();
  await expect(page.locator("ol > li").first()).toBeVisible();
});

test("switches between Chinese and English", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("任务驱动的 AI 架构配置引擎")).toBeVisible();

  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByText("Task-driven AI architecture configuration engine")).toBeVisible();
});
