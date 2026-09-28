export interface DecisionSignals {
  needsWebMonitoring: boolean;
  needsFilesystem: boolean;
  needsGithub: boolean;
  xlsxAllowed: boolean;
  mandatoryMcpIds: string[];
  mandatorySkillIds: string[];
  rationale: string[];
}

const rules = [
  {
    key: "needsWebMonitoring",
    pattern:
      /监控|抓取|网页|博客|rss|定时|爬虫|采集|scrape|crawl|monitor|website|blog|feed/i,
    ids: ["fetch", "puppeteer"],
    rationale: "任务涉及网页、博客、RSS、抓取或持续监控，必须覆盖 Fetch MCP 或 Puppeteer MCP。",
  },
  {
    key: "needsFilesystem",
    pattern:
      /代码库|代码仓库|本地文件|文件目录|对比.*(代码|文件|仓库)|查看.*(本地|文件)|codebase|local file|repository|repo/i,
    ids: ["filesystem"],
    rationale: "任务需要查看、对比或操作本地文件与代码库，必须使用 Filesystem MCP。",
  },
  {
    key: "needsGithub",
    pattern:
      /提交.*(pr|pull request|issue)|创建.*(pr|pull request|issue)|git ?hub|合并请求|草稿.*pr|draft.*pr|操作.*github/i,
    ids: ["github"],
    rationale: "任务涉及 GitHub、PR 或 Issue 操作，必须使用 GitHub MCP。",
  },
] as const;

const skillRules = [
  {
    pattern: /pdf|财报|报告解析/i,
    ids: ["pdf"],
    rationale: "任务涉及 PDF，必须推荐 PDF Skill。",
  },
  {
    pattern: /excel|xlsx|表格|报表|spreadsheet|sheet/i,
    ids: ["xlsx"],
    rationale: "任务明确涉及 Excel、表格或报表，必须推荐 XLSX Skill。",
  },
  {
    pattern: /word|docx|word文档|正式报告/i,
    ids: ["docx"],
    rationale: "任务需要生成或编辑 Word 文档，必须推荐 DOCX Skill。",
  },
  {
    pattern: /ppt|pptx|幻灯片|演示文稿|slide|presentation/i,
    ids: ["pptx"],
    rationale: "任务需要演示文稿输出，必须推荐 PPTX Skill。",
  },
  {
    pattern: /前端|网页界面|landing page|react|frontend|ui\b|artifact/i,
    ids: ["frontend-design", "artifact-builder"],
    rationale: "任务涉及前端界面或 Artifact，必须推荐前端设计与构建 Skill。",
  },
  {
    pattern: /浏览器测试|e2e|web测试|playwright|网页测试/i,
    ids: ["webapp-testing"],
    rationale: "任务涉及浏览器测试，必须推荐 Web App Testing Skill。",
  },
  {
    pattern: /mcp server|mcp 服务|构建mcp|开发mcp/i,
    ids: ["mcp-builder"],
    rationale: "任务需要开发 MCP Server，必须推荐 MCP Builder Skill。",
  },
  {
    pattern: /skill|prompt|提示词|技能/i,
    ids: ["skill-creator"],
    rationale: "任务需要设计 Skill 或 Prompt，必须推荐 Skill Creator。",
  },
  {
    pattern: /海报|封面|视觉设计|poster|canvas/i,
    ids: ["canvas-design"],
    rationale: "任务涉及视觉设计，优先推荐 Canvas Design Skill。",
  },
] as const;

export function detectDecisionSignals(task: string): DecisionSignals {
  const matched = rules.filter((rule) => rule.pattern.test(task));
  const matchedSkillRules = skillRules.filter((rule) => rule.pattern.test(task));
  const xlsxAllowed = matchedSkillRules.some((rule) => (rule.ids as readonly string[]).includes("xlsx"));

  return {
    needsWebMonitoring: matched.some((rule) => rule.key === "needsWebMonitoring"),
    needsFilesystem: matched.some((rule) => rule.key === "needsFilesystem"),
    needsGithub: matched.some((rule) => rule.key === "needsGithub"),
    xlsxAllowed,
    mandatoryMcpIds: Array.from(new Set(matched.flatMap((rule) => rule.ids))),
    mandatorySkillIds: Array.from(new Set(matchedSkillRules.flatMap((rule) => rule.ids))),
    rationale: [
      ...matched.map((rule) => rule.rationale),
      ...matchedSkillRules.map((rule) => rule.rationale),
      xlsxAllowed
        ? "任务明确涉及 Excel、表格、xlsx 或报表，可以推荐 XLSX Skill。"
        : "任务未明确涉及 Excel、表格、xlsx 或报表，严禁推荐 XLSX Skill。",
    ],
  };
}
