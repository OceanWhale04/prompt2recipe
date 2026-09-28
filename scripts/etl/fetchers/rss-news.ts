import { XMLParser } from "fast-xml-parser";

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt?: string;
  summary: string;
}

const DEFAULT_FEEDS = [
  { name: "Model Context Protocol", url: "https://modelcontextprotocol.io/blog/rss.xml" },
  { name: "OpenAI", url: "https://openai.com/news/rss.xml" },
  { name: "Google AI", url: "https://blog.google/technology/ai/rss/" },
  { name: "Anthropic", url: "https://www.anthropic.com/rss.xml" },
];

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function textValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "#text" in value) {
    return String((value as { "#text": unknown })["#text"]);
  }
  return "";
}

export async function fetchRssNews(): Promise<NewsItem[]> {
  const configuredFeeds = process.env.RSS_FEEDS
    ? process.env.RSS_FEEDS.split(",")
        .map((url) => ({ name: new URL(url.trim()).host, url: url.trim() }))
        .filter((feed) => feed.url)
    : DEFAULT_FEEDS;
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  const items: NewsItem[] = [];

  for (const feed of configuredFeeds) {
    try {
      const response = await fetch(feed.url, {
        headers: { "User-Agent": "Prompt2Recipe-ETL/1.0" },
      });
      if (!response.ok) continue;

      const xml = await response.text();
      const parsed = parser.parse(xml) as {
        rss?: { channel?: { item?: unknown | unknown[] } };
        feed?: { entry?: unknown | unknown[] };
      };
      const rawItems = [
        ...asArray(parsed.rss?.channel?.item),
        ...asArray(parsed.feed?.entry),
      ];

      for (const raw of rawItems.slice(0, 20)) {
        const item = raw as Record<string, unknown>;
        const linkValue = item.link;
        const link =
          typeof linkValue === "string"
            ? linkValue
            : textValue((linkValue as Record<string, unknown> | undefined)?.["@_href"]);
        const title = textValue(item.title);
        if (!title || !link) continue;

        items.push({
          title,
          link,
          source: feed.name,
          publishedAt: textValue(item.pubDate ?? item.published ?? item.updated),
          summary: textValue(item.description ?? item.summary ?? item.content).slice(0, 1200),
        });
      }
    } catch (error) {
      console.warn(`[etl:rss] skipped ${feed.url}: ${String(error)}`);
    }
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });
}
