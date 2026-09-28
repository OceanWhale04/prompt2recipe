import { z } from "zod";

const idSchema = z.string().min(1);
const urlSchema = z.string().url();
const stringArraySchema = z.array(z.string());

export const baseEntrySchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  url: urlSchema,
  oneLiner: z.string().min(1),
  tags: stringArraySchema,
  taskPatterns: stringArraySchema,
  keywords: stringArraySchema.optional(),
});

export const modelEntrySchema = baseEntrySchema.extend({
  provider: z.string().min(1),
  category: z.string().min(1),
  costTier: z.enum(["low", "medium", "high"]),
  contextWindow: z.number().int().positive(),
  configSnippet: z.string().optional(),
});

export const mcpEntrySchema = baseEntrySchema.extend({
  transport: z.enum(["stdio", "npx", "http", "sse"]),
  command: z.string().optional(),
  install: z.string().optional(),
  github: urlSchema.optional(),
  verified: z.boolean().optional(),
  securityNote: z.string().optional(),
  stars: z.number().int().nonnegative().optional(),
  sourceUpdatedAt: z.string().optional(),
});

export const skillEntrySchema = baseEntrySchema.extend({
  framework: z.string().optional(),
  skillType: z.string().optional(),
  install: z.string().optional(),
});

export const recipeEntrySchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  taskPattern: z.string().min(1),
  components: z.array(
    z.object({
      kind: z.enum(["model", "mcp", "skill"]),
      id: idSchema,
      role: z.string().min(1),
    }),
  ),
  steps: stringArraySchema,
  rationale: z.string().min(1),
  tags: stringArraySchema,
});

export const comboItemSchema = z.object({
  kind: z.enum(["model", "mcp", "skill"]),
  id: idSchema,
  name: z.string().min(1),
  url: urlSchema,
  oneLiner: z.string().min(1),
  role: z.string().min(1),
  reasoning: z.string().min(1),
});

export const comboSelectionItemSchema = z.object({
  id: z.string().min(1),
  role: z.string().min(1),
  reasoning: z.string().min(1),
});

export const recommendationComboSelectionSchema = z.object({
  rationale: z.string().min(1),
  models: z.array(comboSelectionItemSchema).min(1).max(3),
  mcps: z.array(comboSelectionItemSchema).max(4),
  skills: z.array(comboSelectionItemSchema).max(4),
  recipeId: z.string().optional(),
});

export const recommendationComboDraftSchema = recommendationComboSelectionSchema.extend({
  models: z.array(comboItemSchema).max(3),
  mcps: z.array(comboItemSchema).max(4),
  skills: z.array(comboItemSchema).max(4),
});

export const recommendationComboSchema = recommendationComboDraftSchema.extend({
  task: z.string().min(1),
  generatedBy: z.enum(["ai", "local"]),
  fallbackReason: z.enum(["missing_key", "provider_error"]).optional(),
  computeSource: z.enum(["server", "byok", "ollama", "demo"]).optional(),
});

export const workflowStepSchema = z.object({
  id: idSchema,
  phase: z.enum(["prepare", "configure", "run", "verify"]),
  title: z.string().min(1),
  action: z.string().min(1),
  detail: z.string().min(1),
  command: z.string().optional(),
  rationale: z.string().min(1),
});

export const workflowPlanSchema = z.object({
  steps: z.array(workflowStepSchema).length(4),
  generatedBy: z.enum(["ai", "local"]).optional(),
  fallbackReason: z.enum(["missing_key", "provider_error"]).optional(),
  computeSource: z.enum(["server", "byok", "ollama", "demo"]).optional(),
});

export const runtimeProviderSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("byok"),
    baseURL: urlSchema,
    apiKey: z.string().trim().min(1),
    model: z.string().trim().min(1),
  }),
  z.object({
    mode: z.literal("ollama"),
    baseURL: urlSchema,
    model: z.string().trim().min(1),
  }),
  z.object({
    mode: z.literal("demo"),
  }),
]);

export const weeklyKeyHighlightSchema = z.object({
  category: z.enum(["Model", "MCP", "Workflow"]),
  title: z.string().min(1),
  description: z.string().min(1),
  impactScore: z.number().int().min(1).max(5),
  link: urlSchema.optional(),
});

export const weeklyNextWeekOutlookSchema = z.object({
  topic: z.string().min(1),
  expectedDate: z.string().optional(),
  whyItMatters: z.string().min(1),
  actionableAdvice: z.string().min(1),
});

export const weeklyReportEditionSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  dateRange: z.string().min(1),
  summary: z.string().min(1),
  keyHighlights: z.array(weeklyKeyHighlightSchema).min(1),
  nextWeekOutlook: z.array(weeklyNextWeekOutlookSchema).min(1),
  fullMarkdownContent: z.string().min(1),
  recommendedPrompts: stringArraySchema.optional(),
});

export const weeklyDataStoreSchema = z.object({
  currentEditionId: idSchema,
  editions: z.array(weeklyReportEditionSchema).min(1),
});

export const recommendRequestSchema = z.discriminatedUnion("stage", [
  z.object({
    task: z.string().trim().min(2).max(2000),
    stage: z.literal("combo"),
    provider: runtimeProviderSchema.optional(),
  }),
  z.object({
    task: z.string().trim().min(2).max(2000),
    stage: z.literal("workflow"),
    combo: recommendationComboSchema,
    provider: runtimeProviderSchema.optional(),
  }),
]);

export type RecommendRequest = z.infer<typeof recommendRequestSchema>;
