import { describe, expect, it } from "vitest";

import { KeywordRetriever, tokenize } from "../src/lib/retriever";

describe("tokenize", () => {
  it("splits latin tokens and generates CJK bigrams", () => {
    const tokens = tokenize("PDF 财报");
    expect(tokens).toContain("pdf");
    expect(tokens).toContain("财报");
  });
});

describe("KeywordRetriever", () => {
  const retriever = new KeywordRetriever();

  it("returns ranked hits for a known task", async () => {
    const hits = await retriever.search("解析 PDF 财报并导出 Excel", 10);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].score).toBeGreaterThanOrEqual(hits[hits.length - 1].score);
  });

  it("returns no hits for an empty query", async () => {
    await expect(retriever.search("   ", 10)).resolves.toEqual([]);
  });

  it("respects the top-k limit", async () => {
    const hits = await retriever.search("browser automation", 3);
    expect(hits.length).toBeLessThanOrEqual(3);
  });
});
