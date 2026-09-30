import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  mcpEntrySchema,
  modelEntrySchema,
  recipeEntrySchema,
  skillEntrySchema,
} from "../lib/schemas";
import type { McpEntry, ModelEntry, RecipeEntry, SkillEntry } from "../lib/types";

export type CatalogSource = "remote" | "cache" | "fallback";

export interface Catalogs {
  models: ModelEntry[];
  mcps: McpEntry[];
  skills: SkillEntry[];
  recipes: RecipeEntry[];
}

export interface LoadedCatalogs extends Catalogs {
  source: CatalogSource;
}

interface DataLoaderOptions {
  remoteBaseUrl?: string;
  cacheDir?: string;
  ttlMs?: number;
  timeoutMs?: number;
  fetch?: typeof fetch;
  fallbackDataDir?: string;
}

type DataFileName = "models" | "mcps" | "skills" | "recipes";

const DATA_FILES: DataFileName[] = ["models", "mcps", "skills", "recipes"];
const DEFAULT_REMOTE_BASE_URL =
  "https://raw.githubusercontent.com/OceanWhale04/prompt2recipe/main/data";

const fileSchemas = {
  models: modelEntrySchema,
  mcps: mcpEntrySchema,
  skills: skillEntrySchema,
  recipes: recipeEntrySchema,
} as const;

export class DataLoader {
  private readonly remoteBaseUrl: string;
  private readonly cacheDir: string;
  private readonly ttlMs: number;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly fallbackDataDir: string;

  constructor(options: DataLoaderOptions = {}) {
    this.remoteBaseUrl =
      options.remoteBaseUrl?.replace(/\/+$/, "") ??
      process.env.STACKFORGE_MCP_REMOTE_BASE_URL?.replace(/\/+$/, "") ??
      DEFAULT_REMOTE_BASE_URL;
    this.cacheDir =
      options.cacheDir ??
      process.env.STACKFORGE_MCP_CACHE_DIR ??
      path.join(os.tmpdir(), "stackforge-mcp", "data");
    this.ttlMs = options.ttlMs ?? (Number(process.env.STACKFORGE_MCP_TTL_MS) || 24 * 60 * 60 * 1_000);
    this.timeoutMs = options.timeoutMs ?? (Number(process.env.STACKFORGE_MCP_TIMEOUT_MS) || 2_000);
    this.fetchImpl = options.fetch ?? fetch;
    this.fallbackDataDir =
      options.fallbackDataDir ??
      (typeof __dirname !== "undefined"
        ? path.resolve(__dirname, "../../data")
        : path.resolve(process.cwd(), "data"));
  }

  async load(): Promise<LoadedCatalogs> {
    await mkdir(this.cacheDir, { recursive: true });

    const results = await Promise.all(DATA_FILES.map((file) => this.loadFile(file)));
    const sources = results.map((result) => result.source);
    const source: CatalogSource = sources.includes("remote")
      ? "remote"
      : sources.includes("cache")
        ? "cache"
        : "fallback";

    return {
      models: results[0].items as ModelEntry[],
      mcps: results[1].items as McpEntry[],
      skills: results[2].items as SkillEntry[],
      recipes: results[3].items as RecipeEntry[],
      source,
    };
  }

  private async loadFile(file: DataFileName) {
    const cached = await this.readFreshCache(file);
    if (cached) {
      return { source: "cache" as const, items: this.parseItems(file, cached) };
    }

    try {
      const payload = await this.fetchRemote(file);
      const items = this.parseItems(file, payload);
      await this.writeCache(file, payload);
      return { source: "remote" as const, items };
    } catch {
      const fallback = await readFile(this.bundledDataPath(`${file}.json`), "utf8");
      return {
        source: "fallback" as const,
        items: this.parseItems(file, JSON.parse(fallback)),
      };
    }
  }

  private async fetchRemote(file: DataFileName) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.remoteBaseUrl}/${file}.json`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Remote data request failed with status ${response.status}`);
      }
      return (await response.json()) as { items: unknown };
    } finally {
      clearTimeout(timer);
    }
  }

  private parseItems(file: DataFileName, payload: { items: unknown }) {
    const schema = fileSchemas[file];
    return schema.array().parse(payload.items);
  }

  private async readFreshCache(file: DataFileName) {
    const cacheFile = path.join(this.cacheDir, `${file}.json`);
    try {
      const fileStat = await stat(cacheFile);
      if (Date.now() - fileStat.mtimeMs > this.ttlMs) return null;

      const raw = await readFile(cacheFile, "utf8");
      return (JSON.parse(raw) as { payload: { items: unknown } }).payload;
    } catch {
      return null;
    }
  }

  private async writeCache(file: DataFileName, payload: unknown) {
    const cacheFile = path.join(this.cacheDir, `${file}.json`);
    await writeFile(
      cacheFile,
      JSON.stringify({ cachedAt: Date.now(), payload }, null, 2),
      "utf8",
    );
  }

  private bundledDataPath(filename: string) {
    return path.join(this.fallbackDataDir, filename);
  }
}
