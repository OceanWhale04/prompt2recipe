import type { RecommendationCombo } from "./types";
import type { ComboCandidates } from "./selection";

function renderSignals(candidates: ComboCandidates) {
  return JSON.stringify(candidates.signals, null, 2);
}

export function buildComboPrompt(task: string, candidates: ComboCandidates) {
  const system = `You are the core decision engine of Prompt2Recipe / StackForge.
Your job is to select a minimal, executable AI stack for the user's exact task from the provided candidate catalog.

NON-NEGOTIABLE INTENT RULES:
1. If needsWebMonitoring is true, the mcps array MUST contain either Fetch MCP (id: fetch) or Puppeteer MCP (id: puppeteer). Prefer Fetch MCP for RSS, article reading, scheduled scraping, and lightweight page fetching. Prefer Puppeteer MCP for interactive pages, login flows, clicking, and JavaScript-heavy sites.
2. If needsFilesystem is true, the mcps array MUST contain Filesystem MCP (id: filesystem) for reading, comparing, or operating on local files and codebases.
3. If needsGithub is true, the mcps array MUST contain GitHub MCP (id: github) for PR, Issue, repository, or GitHub operations.
4. XLSX Skill is allowed ONLY when xlsxAllowed is true. If xlsxAllowed is false, NEVER recommend XLSX Skill under any circumstance, even if it appears in the candidate catalog or a matched recipe.
5. Never invent a tool, model, skill, URL, or id. Use only candidates supplied below.
6. Keep the stack small: at most 3 models, 4 MCPs, and 4 skills.

SELECTION QUALITY:
- Match the model to the real workload: long-context reading, coding, structured extraction, reasoning, or low-cost batch work.
- Every ComboItem.reasoning must be task-specific and explain both (a) why this item is needed for this exact task and (b) what concrete role it plays.
- Do not use generic reasoning such as "powerful", "useful", "can help", or "recommended by the system".
- If a provided recipe directly matches, use its recipeId and follow its component intent, but still enforce all hard intent rules above.

Return only one valid JSON object with this exact shape:
{
  "rationale": "task-specific data-flow summary",
  "models": [{ "id": "candidate id", "role": "task-specific role", "reasoning": "task-specific reason" }],
  "mcps": [{ "id": "candidate id", "role": "task-specific role", "reasoning": "task-specific reason" }],
  "skills": [{ "id": "candidate id", "role": "task-specific role", "reasoning": "task-specific reason" }],
  "recipeId": "optional candidate recipe id"
}
Only use ids present in CANDIDATE CATALOG. Do not return name, url, oneLiner, kind, Markdown, or commentary.`;

  const prompt = `USER TASK:
${task}

DETECTED DECISION SIGNALS:
${renderSignals(candidates)}

MANDATORY MCP IDS:
${candidates.signals.mandatoryMcpIds.length > 0 ? candidates.signals.mandatoryMcpIds.join(", ") : "none"}

XLSX SKILL ALLOWED:
${candidates.signals.xlsxAllowed ? "yes" : "no"}

CANDIDATE CATALOG:
${JSON.stringify(candidates, null, 2)}

Build the final recommendation as the exact JSON shape above. The top-level rationale must summarize the task-specific data flow, not the tools in isolation.`;

  return { system, prompt };
}

export function buildWorkflowPrompt(task: string, combo: RecommendationCombo) {
  const system = `You are the senior implementation planner for Prompt2Recipe / StackForge.
You must convert the selected stack into exactly four task-specific implementation steps.

HARD RULES:
1. Output exactly 4 steps with phases in this order: prepare, configure, run, verify.
2. This is forbidden: generic boilerplate such as "准备运行环境", "配置模型与工具", "执行任务流程", or "校验并交付结果".
3. Each title must name the concrete object, system, dataset, repository, report, service, or output from the user's task.
4. Each action must name the exact selected tool when relevant, such as Fetch MCP, Puppeteer MCP, Filesystem MCP, GitHub MCP, XLSX Skill, or the selected model.
5. Each detail must describe concrete inputs, operations, outputs, and validation. Include a command only when it is directly applicable.
6. The plan may use only tools in the selected combination. Never introduce a new MCP, model, or skill.
7. Do not write advice such as "install dependencies" unless that is truly the next task-specific operation.
8. Every step.rationale must explain why that exact step is necessary for this task.

Return only one valid JSON object with this exact shape:
{
  "steps": [
    { "id": "prepare-01", "phase": "prepare", "title": "task-specific title", "action": "concrete action", "detail": "inputs, outputs, and validation", "command": "optional exact command", "rationale": "why this step is required" },
    { "id": "configure-02", "phase": "configure", "title": "task-specific title", "action": "concrete action", "detail": "inputs, outputs, and validation", "rationale": "why this step is required" },
    { "id": "run-03", "phase": "run", "title": "task-specific title", "action": "concrete action", "detail": "inputs, outputs, and validation", "rationale": "why this step is required" },
    { "id": "verify-04", "phase": "verify", "title": "task-specific title", "action": "concrete action", "detail": "inputs, outputs, and validation", "rationale": "why this step is required" }
  ]
}
Do not include generatedBy, fallbackReason, Markdown, or commentary.`;

  const prompt = `USER TASK:
${task}

SELECTED COMBINATION:
${JSON.stringify(combo, null, 2)}

Write the four concrete JSON steps that a competent engineer can execute in order. Use the selected tools' actual names and avoid all generic templates.`;

  return { system, prompt };
}
