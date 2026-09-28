import { readFile, writeFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import path from "node:path";
import { z } from "zod";

import {
  mcpEntrySchema,
  modelEntrySchema,
  recipeEntrySchema,
  skillEntrySchema,
  weeklyDataStoreSchema,
} from "../src/lib/schemas";
import { runEtlPipeline } from "./etl";

const dataDir = path.resolve(process.cwd(), "data");

try {
  loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {
  // GitHub Actions provides environment variables directly.
}


type CatalogRecord = {
  id: string;
  name?: string;
  title?: string;
  tags?: string[];
  taskPatterns?: string[];
  taskPattern?: string;
  oneLiner?: string;
  rationale?: string;
};

interface CatalogFile {
  file: string;
  kind: string;
  schema: z.ZodType<CatalogRecord>;
}

const catalogFiles: CatalogFile[] = [
  { file: "models.json", kind: "model", schema: modelEntrySchema as unknown as z.ZodType<CatalogRecord> },
  { file: "mcps.json", kind: "mcp", schema: mcpEntrySchema as unknown as z.ZodType<CatalogRecord> },
  { file: "skills.json", kind: "skill", schema: skillEntrySchema as unknown as z.ZodType<CatalogRecord> },
  { file: "recipes.json", kind: "recipe", schema: recipeEntrySchema as unknown as z.ZodType<CatalogRecord> },
];

async function loadCatalog(file: string, schema: z.ZodType<CatalogRecord>) {
  const raw = await readFile(path.join(dataDir, file), "utf8");
  const parsed = JSON.parse(raw) as { version?: number; items: CatalogRecord[] };
  const items = schema.array().parse(parsed.items);
  return {
    version: Number(parsed.version ?? 1),
    items,
  };
}

async function writeJson(file: string, value: unknown) {
  await writeFile(path.join(dataDir, file), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const now = new Date().toISOString();
  const etl = await runEtlPipeline();

  if (etl.refreshed.models) {
    await writeJson("models.json", {
      version: 1,
      updatedAt: now,
      items: etl.models,
    });
  }

  if (etl.refreshed.mcps) {
    await writeJson("mcps.json", {
      version: 1,
      updatedAt: now,
      items: etl.mcps,
    });
  }

  if (etl.refreshed.weekly) {
    await writeJson("weekly.json", weeklyDataStoreSchema.parse(etl.weekly));
  }

  const indexItems: unknown[] = [];

  for (const entry of catalogFiles) {
    const catalog = await loadCatalog(entry.file, entry.schema);
    const output = {
      version: catalog.version,
      updatedAt: now,
      items: catalog.items,
    };

    await writeJson(entry.file, output);

    for (const item of catalog.items) {
      indexItems.push({
        kind: entry.kind,
        id: item.id,
        name: item.name ?? item.title,
        tags: item.tags ?? [],
        taskPatterns: item.taskPatterns ?? [item.taskPattern],
        oneLiner: item.oneLiner ?? item.rationale,
      });
    }
  }

  await writeJson("index.json", { version: 1, updatedAt: now, items: indexItems });

  const weeklyRaw = await readFile(path.join(dataDir, "weekly.json"), "utf8");
  const weekly = weeklyDataStoreSchema.parse(JSON.parse(weeklyRaw));
  if (!weekly.editions.some((edition) => edition.id === weekly.currentEditionId)) {
    throw new Error("weekly.json currentEditionId does not match any edition.");
  }

  console.log(
    `Knowledge base validated and index rebuilt at ${now}. ` +
      `ETL refreshed: models=${etl.refreshed.models}, mcps=${etl.refreshed.mcps}, weekly=${etl.refreshed.weekly}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
