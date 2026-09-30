import type { ArchitectureRecipe } from "../services/architect-engine";

export function formatArchitectureRecipe(recipe: ArchitectureRecipe): string {
  const steps = recipe.workflow.steps
    .map(
      (step, index) =>
        `${index + 1}. ${step.title}\n   - ${step.action}\n   - ${step.detail}`,
    )
    .join("\n");

  const models = recipe.combo.models.map((item) => `- ${item.name}: ${item.reasoning}`).join("\n");
  const mcps = recipe.combo.mcps.map((item) => `- ${item.name}: ${item.reasoning}`).join("\n");
  const skills = recipe.combo.skills.map((item) => `- ${item.name}: ${item.reasoning}`).join("\n");

  return [
    `# 推荐方案：${recipe.task}`,
    "",
    `数据来源：${recipe.dataSource}`,
    "",
    "## 推荐模型",
    models || "- 无",
    "",
    "## MCP Server",
    mcps || "- 无",
    "",
    "## Agent Skill",
    skills || "- 无",
    "",
    "## 实施步骤",
    steps,
  ].join("\n");
}
