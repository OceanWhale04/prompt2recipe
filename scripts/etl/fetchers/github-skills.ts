import type { SkillEntry } from "../../../src/lib/types";

interface GitHubRepository {
  name: string;
  full_name: string;
  html_url: string;
  description?: string | null;
  stargazers_count?: number;
  updated_at?: string;
  topics?: string[];
}

interface GitHubContentItem {
  name: string;
  path: string;
  type: "dir" | "file" | "submodule" | "symlink";
  html_url?: string | null;
}

const SEARCH_QUERIES = [
  "topic:agent-skills",
  "topic:claude-skills",
  "topic:ai-agents",
  "topic:llm-agent",
  "topic:openai-codex",
];

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function searchRepositories(query: string, token: string): Promise<GitHubRepository[]> {
  const response = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=50`,
    { headers: githubHeaders(token) },
  );

  if (!response.ok) {
    throw new Error(`GitHub skills search failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as { items?: GitHubRepository[] };
  return payload.items ?? [];
}

async function fetchOfficialSkills(token: string): Promise<SkillEntry[]> {
  const [repoResponse, contentsResponse] = await Promise.all([
    fetch("https://api.github.com/repos/anthropics/skills", {
      headers: githubHeaders(token),
    }),
    fetch("https://api.github.com/repos/anthropics/skills/contents/skills", {
      headers: githubHeaders(token),
    }),
  ]);

  if (!repoResponse.ok || !contentsResponse.ok) {
    throw new Error("GitHub Anthropic Skills request failed.");
  }

  const repository = (await repoResponse.json()) as GitHubRepository;
  const contents = (await contentsResponse.json()) as GitHubContentItem[];

  return contents
    .filter((item) => item.type === "dir")
    .map((item) => ({
      id: slug(item.name),
      name: item.name,
      url: `https://github.com/anthropics/skills/tree/main/${item.path}`,
      install: `https://github.com/anthropics/skills/tree/main/${item.path}`,
      oneLiner: `Anthropic 官方 ${item.name} Skill，可直接接入兼容 Agent Skills 的执行环境。`,
      framework: "Anthropic Skills",
      skillType: "Official Skill",
      tags: ["anthropic", "official", item.name],
      taskPatterns: item.name.split("-").filter(Boolean),
      keywords: ["anthropic", "skills", item.name],
      stars: repository.stargazers_count ?? 0,
      sourceUpdatedAt: repository.updated_at,
    } satisfies SkillEntry));
}

export async function fetchGitHubSkillRepositories(): Promise<SkillEntry[]> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return [];

  const [officialSkills, ...searchResults] = await Promise.all([
    fetchOfficialSkills(token),
    ...SEARCH_QUERIES.map((query) => searchRepositories(query, token)),
  ]);

  const repositories = Array.from(
    new Map(
      searchResults
        .flat()
        .map((repository) => [repository.full_name, repository] as const),
    ).values(),
  );

  const communitySkills = repositories.map((repository) => {
    const topics = repository.topics?.length ? repository.topics : ["agent-skills"];
    const description =
      repository.description?.trim() || `${repository.full_name} Agent Skill repository.`;

    return {
      id: `github-skill-${slug(repository.full_name)}`,
      name: repository.name,
      url: repository.html_url,
      install: repository.html_url,
      oneLiner: description.slice(0, 180),
      framework: "GitHub",
      skillType: topics.includes("claude-skills") ? "Claude Skill" : "Agent Skill",
      tags: topics.slice(0, 8),
      taskPatterns: topics.map((topic) => topic.replaceAll("-", " ")).slice(0, 6),
      keywords: [repository.full_name, ...topics],
      stars: repository.stargazers_count ?? 0,
      sourceUpdatedAt: repository.updated_at,
    } satisfies SkillEntry;
  });

  return Array.from(
    new Map([...officialSkills, ...communitySkills].map((skill) => [skill.id, skill])).values(),
  ).sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));
}
