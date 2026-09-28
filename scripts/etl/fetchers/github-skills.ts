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

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function fetchGitHubSkillRepositories(): Promise<SkillEntry[]> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return [];

  const response = await fetch(
    "https://api.github.com/search/repositories?q=topic%3Aagent-skills&sort=stars&order=desc&per_page=30",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub skills request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as { items?: GitHubRepository[] };

  return (payload.items ?? []).map((repository) => {
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
}
