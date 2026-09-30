import { detectDecisionSignals, type DecisionSignals } from "./decision-rules";
import { KnowledgeBase } from "./knowledge-base";
import { mcps, models, recipes, skills } from "./kb";
import { tokenize } from "./retriever";
import type {
  ComboItem,
  McpEntry,
  ModelEntry,
  RecipeEntry,
  Retriever,
  SkillEntry,
} from "./types";

const defaultKnowledgeBase = new KnowledgeBase({ models, mcps, skills, recipes });

export interface ComboCandidates {
  models: ModelEntry[];
  mcps: McpEntry[];
  skills: SkillEntry[];
  recipes: RecipeEntry[];
  signals: DecisionSignals;
}

function scoreRecipe(recipe: RecipeEntry, queryTokens: string[]): number {
  const haystack = [
    recipe.title,
    recipe.taskPattern,
    recipe.tags.join(" "),
    recipe.rationale,
  ]
    .join(" ")
    .toLowerCase();
  const tokens = new Set(tokenize(haystack));
  let score = 0;
  for (const token of queryTokens) {
    if (token.length < 2) continue;
    if (tokens.has(token)) score += 3;
    else if (haystack.includes(token)) score += 1;
  }
  return score;
}

export async function selectCandidates(
  task: string,
  retriever: Retriever,
  knowledgeBase: KnowledgeBase = defaultKnowledgeBase,
): Promise<ComboCandidates> {
  const signals = detectDecisionSignals(task);
  const hits = await retriever.search(task, 80);
  const modelIds: string[] = [];
  const mcpIds: string[] = [...signals.mandatoryMcpIds];
  const skillIds: string[] = [...signals.mandatorySkillIds];

  for (const hit of hits) {
    if (hit.kind === "model" && modelIds.length < 5) modelIds.push(hit.id);
    if (hit.kind === "mcp" && mcpIds.length < 7 && !mcpIds.includes(hit.id)) mcpIds.push(hit.id);
    if (
      hit.kind === "skill" &&
      skillIds.length < 6 &&
      (signals.xlsxAllowed || hit.id !== "xlsx")
    ) {
      skillIds.push(hit.id);
    }
  }

  const queryTokens = tokenize(task);
  const matchedRecipes = knowledgeBase.recipes
    .map((recipe) => ({ recipe, score: scoreRecipe(recipe, queryTokens) }))
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.recipe);

  for (const recipe of matchedRecipes) {
    for (const component of recipe.components) {
      if (component.kind === "model" && !modelIds.includes(component.id)) modelIds.push(component.id);
      if (component.kind === "mcp" && !mcpIds.includes(component.id)) mcpIds.push(component.id);
      if (
        component.kind === "skill" &&
        !skillIds.includes(component.id) &&
        (signals.xlsxAllowed || component.id !== "xlsx")
      ) {
        skillIds.push(component.id);
      }
    }
  }

  const resolvedModelIds = modelIds.length > 0 ? modelIds : ["deepseek-chat"];

  return {
    models: resolvedModelIds
      .map((id) => knowledgeBase.getEntry("model", id))
      .filter((item): item is ModelEntry => Boolean(item))
      .slice(0, 6),
    mcps: mcpIds
      .map((id) => knowledgeBase.getEntry("mcp", id))
      .filter((item): item is McpEntry => Boolean(item))
      .slice(0, 7),
    skills: skillIds
      .map((id) => knowledgeBase.getEntry("skill", id))
      .filter((item): item is SkillEntry => Boolean(item))
      .slice(0, 7),
    recipes: matchedRecipes,
    signals,
  };
}

function toComboItem(
  kind: "model" | "mcp" | "skill",
  id: string,
  role: string,
  reasoning: string,
  knowledgeBase: KnowledgeBase,
): ComboItem | null {
  const entry = knowledgeBase.getEntry(kind, id);
  if (!entry) return null;
  return {
    kind,
    id: entry.id,
    name: entry.name,
    url: entry.url,
    oneLiner: entry.oneLiner,
    role,
    reasoning,
  };
}

export function buildComboFromRecipe(
  task: string,
  recipe: RecipeEntry,
  candidates: ComboCandidates,
  knowledgeBase: KnowledgeBase = defaultKnowledgeBase,
) {
  const modelsItems = recipe.components
    .filter((component) => component.kind === "model")
    .map((component) =>
      toComboItem("model", component.id, component.role, recipe.rationale, knowledgeBase),
    )
    .filter((item): item is ComboItem => Boolean(item));

  const mcpItems = recipe.components
    .filter((component) => component.kind === "mcp")
    .map((component) =>
      toComboItem("mcp", component.id, component.role, recipe.rationale, knowledgeBase),
    )
    .filter((item): item is ComboItem => Boolean(item));

  const skillItems = recipe.components
    .filter((component) => component.kind === "skill")
    .map((component) =>
      toComboItem("skill", component.id, component.role, recipe.rationale, knowledgeBase),
    )
    .filter((item): item is ComboItem => Boolean(item));

  const fill = <T extends { id: string }>(
    current: ComboItem[],
    source: T[],
    make: (entry: T) => ComboItem,
    limit: number,
  ) => {
    const currentIds = new Set(current.map((item) => item.id));
    for (const entry of source) {
      if (current.length >= limit) break;
      if (currentIds.has(entry.id)) continue;
      current.push(make(entry));
    }
  };

  fill(
    modelsItems,
    candidates.models,
    (entry) =>
      toComboItem("model", entry.id, "通用模型候选", "可作为组合中的备选模型", knowledgeBase)!,
    1,
  );
  fill(
    mcpItems,
    candidates.mcps,
    (entry) =>
      toComboItem("mcp", entry.id, "工具集成", "可补充任务所需的工具能力", knowledgeBase)!,
    2,
  );
  fill(
    skillItems,
    candidates.skills,
    (entry) =>
      toComboItem("skill", entry.id, "技能补充", "可补充流程中的专业技能", knowledgeBase)!,
    2,
  );

  return {
    task,
    rationale: recipe.rationale,
    models: modelsItems,
    mcps: mcpItems,
    skills: skillItems,
    recipeId: recipe.id,
    generatedBy: "local" as const,
  };
}
