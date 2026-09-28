import modelsJson from "../../data/models.json";
import mcpsJson from "../../data/mcps.json";
import skillsJson from "../../data/skills.json";
import recipesJson from "../../data/recipes.json";
import weeklyJson from "../../data/weekly.json";

import type {
  Catalog,
  EntityKind,
  McpEntry,
  ModelEntry,
  RecipeEntry,
  SkillEntry,
  WeeklyDataStore,
  WeeklyReportEdition,
} from "./types";
import {
  mcpEntrySchema,
  modelEntrySchema,
  recipeEntrySchema,
  skillEntrySchema,
  weeklyDataStoreSchema,
} from "./schemas";

const asCatalog = <T>(value: unknown): Catalog<T> => value as Catalog<T>;

export const models: ModelEntry[] = modelEntrySchema
  .array()
  .parse(asCatalog<ModelEntry>(modelsJson).items);

export const mcps: McpEntry[] = mcpEntrySchema
  .array()
  .parse(asCatalog<McpEntry>(mcpsJson).items);

export const skills: SkillEntry[] = skillEntrySchema
  .array()
  .parse(asCatalog<SkillEntry>(skillsJson).items);

export const recipes: RecipeEntry[] = recipeEntrySchema
  .array()
  .parse(asCatalog<RecipeEntry>(recipesJson).items);

export const weeklyData: WeeklyDataStore = weeklyDataStoreSchema.parse(weeklyJson);
export const weeklyIssues: WeeklyReportEdition[] = weeklyData.editions;
export const currentWeeklyEdition =
  weeklyIssues.find((edition) => edition.id === weeklyData.currentEditionId) ??
  weeklyIssues[0];

export const modelById = new Map(models.map((item) => [item.id, item]));
export const mcpById = new Map(mcps.map((item) => [item.id, item]));
export const skillById = new Map(skills.map((item) => [item.id, item]));

export function getWeeklyEdition(id: string) {
  return weeklyIssues.find((edition) => edition.id === id);
}

export function getEntry(kind: EntityKind, id: string) {
  if (kind === "model") return modelById.get(id);
  if (kind === "mcp") return mcpById.get(id);
  return skillById.get(id);
}

export const entryCounts = {
  models: models.length,
  mcps: mcps.length,
  skills: skills.length,
  recipes: recipes.length,
};
