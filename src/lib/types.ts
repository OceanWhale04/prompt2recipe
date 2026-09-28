export type EntityKind = "model" | "mcp" | "skill";

export interface Catalog<T> {
  version: number;
  updatedAt: string;
  items: T[];
}

export interface BaseEntry {
  id: string;
  name: string;
  url: string;
  oneLiner: string;
  tags: string[];
  taskPatterns: string[];
  keywords?: string[];
}

export interface ModelEntry extends BaseEntry {
  provider: string;
  category: string;
  costTier: "low" | "medium" | "high";
  contextWindow: number;
  configSnippet?: string;
}

export type McpTransport = "stdio" | "npx" | "http" | "sse";

export interface McpEntry extends BaseEntry {
  transport: McpTransport;
  command?: string;
  install?: string;
  github?: string;
  verified?: boolean;
  securityNote?: string;
  stars?: number;
  sourceUpdatedAt?: string;
}

export interface SkillEntry extends BaseEntry {
  framework?: string;
  skillType?: string;
  install?: string;
  stars?: number;
  sourceUpdatedAt?: string;
}

export interface RecipeComponent {
  kind: EntityKind;
  id: string;
  role: string;
}

export interface RecipeEntry {
  id: string;
  title: string;
  taskPattern: string;
  components: RecipeComponent[];
  steps: string[];
  rationale: string;
  tags: string[];
}

export type FallbackReason = "missing_key" | "provider_error";
export type ComputeSource = "server" | "byok" | "ollama" | "demo";

export type RuntimeProviderConfig =
  | {
      mode: "byok";
      baseURL: string;
      apiKey: string;
      model: string;
    }
  | {
      mode: "ollama";
      baseURL: string;
      model: string;
    }
  | {
      mode: "demo";
    };

export interface ComboItem {
  kind: EntityKind;
  id: string;
  name: string;
  url: string;
  oneLiner: string;
  role: string;
  reasoning: string;
}

export interface RecommendationCombo {
  task: string;
  rationale: string;
  models: ComboItem[];
  mcps: ComboItem[];
  skills: ComboItem[];
  recipeId?: string;
  generatedBy: "ai" | "local";
  fallbackReason?: FallbackReason;
  computeSource?: ComputeSource;
}

export type WorkflowPhase = "prepare" | "configure" | "run" | "verify";

export interface WorkflowStep {
  id: string;
  phase: WorkflowPhase;
  title: string;
  action: string;
  detail: string;
  command?: string;
  rationale: string;
}

export interface WorkflowPlan {
  steps: WorkflowStep[];
  generatedBy?: "ai" | "local";
  fallbackReason?: FallbackReason;
  computeSource?: ComputeSource;
}

export type {
  WeeklyDataStore,
  WeeklyHighlightCategory,
  WeeklyKeyHighlight,
  WeeklyNextWeekOutlook,
  WeeklyReportEdition,
} from "../types/weekly";

export interface SearchHit {
  kind: EntityKind;
  id: string;
  score: number;
}

export interface Retriever {
  search(query: string, k: number): Promise<SearchHit[]>;
}
