export type WeeklyHighlightCategory = "Model" | "MCP" | "Workflow";

export interface WeeklyKeyHighlight {
  category: WeeklyHighlightCategory;
  title: string;
  description: string;
  impactScore: number;
  link?: string;
}

export interface WeeklyNextWeekOutlook {
  topic: string;
  expectedDate?: string;
  whyItMatters: string;
  actionableAdvice: string;
}

export interface WeeklyReportEdition {
  id: string;
  title: string;
  dateRange: string;
  summary: string;
  generationMode?: "ai" | "rss";
  keyHighlights: WeeklyKeyHighlight[];
  nextWeekOutlook: WeeklyNextWeekOutlook[];
  fullMarkdownContent: string;
  recommendedPrompts?: string[];
}

export interface WeeklyDataStore {
  currentEditionId: string;
  editions: WeeklyReportEdition[];
}
