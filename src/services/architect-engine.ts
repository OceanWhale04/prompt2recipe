import { KnowledgeBase } from "../lib/knowledge-base";
import { generateCombo, generateWorkflowPlan } from "../lib/llm";
import { KeywordRetriever } from "../lib/retriever";
import { selectCandidates } from "../lib/selection";
import type {
  RecommendationCombo,
  RuntimeProviderConfig,
  WorkflowPlan,
} from "../lib/types";
import { DataLoader, type Catalogs, type CatalogSource } from "./data-loader";

export interface ArchitectureRecipe {
  task: string;
  combo: RecommendationCombo;
  workflow: WorkflowPlan;
  dataSource: CatalogSource;
}

function byokProvider(userKey: string): RuntimeProviderConfig {
  return {
    mode: "byok",
    baseURL: process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com",
    apiKey: userKey.trim(),
    model: process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat",
  };
}

export class ArchitectEngine {
  constructor(private readonly loader: DataLoader = new DataLoader()) {}

  async generateArchitectureRecipe(
    taskDescription: string,
    userKey?: string,
  ): Promise<ArchitectureRecipe> {
    const loaded = await this.loader.load();
    const provider = userKey ? byokProvider(userKey) : undefined;
    return this.generateRecipe(taskDescription, loaded, provider, loaded.source);
  }

  async generateRecipe(
    taskDescription: string,
    catalogs: Catalogs,
    provider?: RuntimeProviderConfig,
    dataSource: CatalogSource = "fallback",
  ): Promise<ArchitectureRecipe> {
    const knowledgeBase = new KnowledgeBase(catalogs);
    const retriever = new KeywordRetriever(catalogs);
    const candidates = await selectCandidates(taskDescription, retriever, knowledgeBase);
    const combo = await generateCombo(taskDescription, candidates, provider);
    const workflow = await generateWorkflowPlan(taskDescription, combo, provider);

    return {
      task: taskDescription,
      combo,
      workflow,
      dataSource,
    };
  }
}
