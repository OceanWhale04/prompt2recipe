import { expect, test } from "@playwright/test";

test("navigates through the portal and filters MCP tools", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /MCP 广场 MCPs/ }).click();

  await expect(page).toHaveURL(/\/portal\/mcps$/);
  await expect(page.getByRole("heading", { name: "MCP 广场 MCPs" })).toBeVisible();

  const search = page.getByPlaceholder(/搜索名称、能力或任务模式/);
  await search.click();
  await page.keyboard.type("filesystem");

  await expect(page.getByRole("heading", { name: "Filesystem MCP" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "GitHub MCP" })).toHaveCount(0);
});

test("runs a featured recipe from the homepage", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /PDF 财报批量解析并导出 Excel/ }).click();

  await expect(page.getByText("推荐工具组合")).toBeVisible();
  await expect(page.getByPlaceholder(/自动解析|parse 100/i)).toHaveValue(
    "自动解析多份 PDF 财报并导出成 Excel",
  );
});

test("opens a weekly edition and applies its prompt to the engine", async ({ page }) => {
  await page.goto("/portal/weekly");

  await expect(page.getByRole("heading", { name: "下周观察 Next Week Outlook" })).toBeVisible();
  await page.getByRole("link", { name: /第 39 期/ }).click();

  await expect(page).toHaveURL(/\/portal\/weekly\/2026-w39$/);
  await expect(page.getByRole("heading", { name: /第 39 期/ })).toBeVisible();

  await page.getByRole("link", { name: "套用至决策引擎" }).first().click();
  await expect(page).toHaveURL(/\/\?task=/);
  await expect(page.getByPlaceholder(/自动解析|parse 100/i)).not.toHaveValue("");
});

test("navigates to the expanded Skill portal", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /技能广场 Skills/ }).click();

  await expect(page).toHaveURL(/\/portal\/skills$/);
  await expect(page.getByRole("heading", { name: "Agent Skill 广场 Skills" })).toBeVisible();

  const search = page.getByPlaceholder(/搜索技能、框架或任务模式/);
  await search.click();
  await page.keyboard.type("skills");
  await expect(page.getByRole("heading", { name: "skills", exact: true })).toBeVisible();
});
