export interface DecisionSignals {
  needsWebMonitoring: boolean;
  needsFilesystem: boolean;
  needsGithub: boolean;
  xlsxAllowed: boolean;
  mandatoryMcpIds: string[];
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

export function detectDecisionSignals(task: string): DecisionSignals {
  const matched = rules.filter((rule) => rule.pattern.test(task));
  const xlsxAllowed = /excel|xlsx|表格|报表|spreadsheet|sheet/i.test(task);

  return {
    needsWebMonitoring: matched.some((rule) => rule.key === "needsWebMonitoring"),
    needsFilesystem: matched.some((rule) => rule.key === "needsFilesystem"),
    needsGithub: matched.some((rule) => rule.key === "needsGithub"),
    xlsxAllowed,
    mandatoryMcpIds: Array.from(new Set(matched.flatMap((rule) => rule.ids))),
    rationale: [
      ...matched.map((rule) => rule.rationale),
      xlsxAllowed
        ? "任务明确涉及 Excel、表格、xlsx 或报表，可以推荐 XLSX Skill。"
        : "任务未明确涉及 Excel、表格、xlsx 或报表，严禁推荐 XLSX Skill。",
    ],
  };
}
