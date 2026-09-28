import { buildComboFromRecipe, type ComboCandidates } from "./selection";
import type {
  ComboItem,
  ComputeSource,
  FallbackReason,
  RecommendationCombo,
  WorkflowPhase,
  WorkflowPlan,
  WorkflowStep,
} from "./types";

function item(
  kind: "model" | "mcp" | "skill",
  id: string,
  name: string,
  url: string,
  oneLiner: string,
  role: string,
  reasoning: string,
): ComboItem {
  return { kind, id, name, url, oneLiner, role, reasoning };
}

function enforceDecisionSignals(
  combo: RecommendationCombo,
  candidates: ComboCandidates,
): RecommendationCombo {
  const existingMcpIds = new Set(combo.mcps.map((entry) => entry.id));
  const hasWebConnector = combo.mcps.some((entry) => ["fetch", "puppeteer"].includes(entry.id));
  const mandatoryIds = candidates.signals.needsWebMonitoring && !hasWebConnector
    ? ["fetch", ...candidates.signals.mandatoryMcpIds.filter((id) => !["fetch", "puppeteer"].includes(id))]
    : candidates.signals.mandatoryMcpIds.filter((id) => !["fetch", "puppeteer"].includes(id) || !hasWebConnector);
  const mandatoryMcps = mandatoryIds
    .filter((id) => !existingMcpIds.has(id))
    .map((id) => candidates.mcps.find((entry) => entry.id === id))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .map((entry) =>
      item(
        "mcp",
        entry.id,
        entry.name,
        entry.url,
        entry.oneLiner,
        "强制意图工具",
        candidates.signals.rationale.find((reason) => reason.includes(entry.name)) ??
          "根据任务中的明确意图强制纳入该 MCP。",
      ),
    );

  const reasonRequiredIds = new Set([
    ...mandatoryIds,
    ...(candidates.signals.needsWebMonitoring ? ["fetch", "puppeteer"] : []),
  ]);
  const normalizedMcps = combo.mcps.map((entry) => {
    if (!reasonRequiredIds.has(entry.id)) return entry;
    const reasoning = candidates.signals.rationale.find((reason) => reason.includes(entry.name));
    return reasoning ? { ...entry, reasoning } : entry;
  });

  const filteredSkills = candidates.signals.xlsxAllowed
    ? combo.skills
    : combo.skills.filter((entry) => entry.id !== "xlsx");
  const existingSkillIds = new Set(filteredSkills.map((entry) => entry.id));
  const mandatorySkills = candidates.signals.mandatorySkillIds
    .filter((id) => !existingSkillIds.has(id))
    .map((id) => candidates.skills.find((entry) => entry.id === id))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .map((entry) =>
      item(
        "skill",
        entry.id,
        entry.name,
        entry.url,
        entry.oneLiner,
        "任务所需专业技能",
        candidates.signals.rationale.find((reason) => reason.includes(entry.name)) ??
          "该 Skill 与任务中的明确输出类型或操作场景直接相关。",
      ),
    );
  const skills = [...mandatorySkills, ...filteredSkills].slice(
    0,
    Math.max(4, candidates.signals.mandatorySkillIds.length),
  );

  return {
    ...combo,
    mcps: [...mandatoryMcps, ...normalizedMcps].slice(
      0,
      Math.max(5, candidates.signals.mandatoryMcpIds.length),
    ),
    skills,
  };
}

export function generateLocalCombo(
  task: string,
  candidates: ComboCandidates,
  fallbackReason: FallbackReason | null = "missing_key",
  computeSource: ComputeSource = "server",
): RecommendationCombo {
  const recipe = candidates.recipes[0];
  const combo = recipe
    ? buildComboFromRecipe(task, recipe, candidates)
    : {
        task,
        rationale: "根据任务关键词匹配到的轻量工具组合，建议先试用核心模型与 MCP，再按需补充技能。",
        models: candidates.models.slice(0, 2).map((entry) =>
          item(
            "model",
            entry.id,
            entry.name,
            entry.url,
            entry.oneLiner,
            "主推理模型",
            "用于任务理解、推理与结果生成。",
          ),
        ),
        mcps: candidates.mcps.slice(0, 3).map((entry) =>
          item(
            "mcp",
            entry.id,
            entry.name,
            entry.url,
            entry.oneLiner,
            "工具集成",
            "为任务提供外部数据或系统能力。",
          ),
        ),
        skills: candidates.skills.slice(0, 3).map((entry) =>
          item(
            "skill",
            entry.id,
            entry.name,
            entry.url,
            entry.oneLiner,
            "流程技能",
            "沉淀可复用的执行步骤与约束。",
          ),
        ),
        generatedBy: "local" as const,
      };

  return {
    ...enforceDecisionSignals(combo, candidates),
    generatedBy: "local",
    fallbackReason: fallbackReason ?? undefined,
    computeSource,
  };
}

function phaseForIndex(index: number, total: number): WorkflowPhase {
  if (index === 0) return "prepare";
  if (index === total - 1) return "verify";
  return index === 1 ? "configure" : "run";
}

export function generateLocalWorkflow(
  task: string,
  combo: RecommendationCombo,
  fallbackReason: FallbackReason | null = "missing_key",
  computeSource: ComputeSource = "server",
): WorkflowPlan {
  const buildSteps = (
    raw: { title: string; action: string; detail: string; rationale: string; command?: string }[],
  ): WorkflowStep[] =>
    raw.map((step, index) => ({
      id: `step-${index + 1}`,
      phase: phaseForIndex(index, raw.length),
      ...step,
    }));

  const toolNames = [...combo.models, ...combo.mcps, ...combo.skills]
    .map((entry) => entry.name)
    .join(", ");
  const hasWeb = combo.mcps.some((entry) => ["fetch", "puppeteer"].includes(entry.id));
  const hasFilesystem = combo.mcps.some((entry) => entry.id === "filesystem");
  const hasGithub = combo.mcps.some((entry) => entry.id === "github");
  const hasXlsx = combo.skills.some((entry) => entry.id === "xlsx");

  const steps = buildSteps([
    {
      title: "明确输入与验收边界",
      action: `围绕“${task}”确认数据来源、输出位置和成功标准。`,
      detail: hasFilesystem
        ? "读取本地代码库或文件目录，记录输入文件、仓库分支与需要比较的范围。"
        : "记录任务输入、目标格式、时间范围和失败时需要保留的中间结果。",
      rationale: "先固定输入输出可以减少执行中的反复调整。",
    },
    {
      title: "配置模型与所需连接器",
      action: `配置 ${toolNames || "推荐的模型与工具"}，并完成最小连通性检查。`,
      detail: hasWeb
        ? "为 Fetch 或 Puppeteer 配置目标 URL、请求频率、超时和重试策略。"
        : "验证模型、MCP 与技能能够按预期调用，并限制每个工具的最小权限。",
      rationale: "连接器可用且权限受控是后续自动执行的前提。",
    },
    {
      title: "执行任务主流程",
      action: `按推荐组合处理“${task}”的核心数据流。`,
      detail: hasGithub
        ? "将处理结果整理为分支、提交信息或 Issue 描述，并通过 GitHub MCP 创建 Draft PR 或 Issue。"
        : hasXlsx
          ? "将结构化结果写入工作表，保留字段映射、公式和异常记录。"
          : "按顺序调用推荐工具，保留中间产物并对异常项进行重试或人工确认。",
      rationale: "围绕实际任务产物执行，避免只做环境配置。",
    },
    {
      title: "验证结果并交付",
      action: "对照任务验收标准检查输出，并保存可复现记录。",
      detail: hasGithub
        ? "检查 Draft PR 的文件差异、测试结果和必要说明，再决定是否转为正式 PR。"
        : "抽查关键样本、校验字段完整性，并记录使用的模型、工具与参数。",
      rationale: "最后一步必须验证实际交付物，而不是停留在流程完成状态。",
    },
  ]);

  return {
    steps,
    generatedBy: "local",
    fallbackReason: fallbackReason ?? undefined,
    computeSource,
  };
}
