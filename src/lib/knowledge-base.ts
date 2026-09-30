import type {
  EntityKind,
  McpEntry,
  ModelEntry,
  RecipeEntry,
  SkillEntry,
} from "./types";

export interface KnowledgeBaseData {
  models: ModelEntry[];
  mcps: McpEntry[];
  skills: SkillEntry[];
  recipes: RecipeEntry[];
}

export class KnowledgeBase {
  readonly models: ModelEntry[];
  readonly mcps: McpEntry[];
  readonly skills: SkillEntry[];
  readonly recipes: RecipeEntry[];

  private readonly modelById: Map<string, ModelEntry>;
  private readonly mcpById: Map<string, McpEntry>;
  private readonly skillById: Map<string, SkillEntry>;

  constructor(data: KnowledgeBaseData) {
    this.models = data.models;
    this.mcps = data.mcps;
    this.skills = data.skills;
    this.recipes = data.recipes;

    this.modelById = new Map(data.models.map((item) => [item.id, item]));
    this.mcpById = new Map(data.mcps.map((item) => [item.id, item]));
    this.skillById = new Map(data.skills.map((item) => [item.id, item]));
  }

  getEntry(kind: EntityKind, id: string) {
    if (kind === "model") return this.modelById.get(id);
    if (kind === "mcp") return this.mcpById.get(id);
    return this.skillById.get(id);
  }
}
