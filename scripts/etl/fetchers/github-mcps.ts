import type { McpEntry } from "../../../src/lib/types";

interface GitHubRepository {
  name: string;
  full_name: string;
  html_url: string;
  description?: string | null;
  stargazers_count?: number;
  updated_at?: string;
  topics?: string[];
  owner?: {
    login?: string;
  };
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function fetchGitHubMcpRepositories(): Promise<McpEntry[]> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return [];

  const response = await fetch(
    "https://api.github.com/search/repositories?q=topic%3Amcp-server&sort=stars&order=desc&per_page=30",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as { items?: GitHubRepository[] };

  return (payload.items ?? []).map((repository) => {
    const topics = repository.topics?.length ? repository.topics : ["mcp-server"];
    const description =
      repository.description?.trim() || `${repository.full_name} MCP server repository.`;

    return {
      id: `github-${slug(repository.full_name)}`,
      name: repository.name,
      url: repository.html_url,
      github: repository.html_url,
      oneLiner: description.slice(0, 180),
      tags: topics.slice(0, 8),
      taskPatterns: topics.map((topic) => topic.replaceAll("-", " ")).slice(0, 6),
      keywords: [repository.full_name, repository.owner?.login ?? "", ...topics],
      transport: "stdio",
      verified: false,
      stars: repository.stargazers_count ?? 0,
      sourceUpdatedAt: repository.updated_at,
      securityNote: "Community MCP repository. Review permissions and source before use.",
    } satisfies McpEntry;
  });
}
