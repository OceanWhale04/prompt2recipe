import { describe, expect, it } from "vitest";

import { currentWeeklyEdition, getEntry, mcps, models, recipes, skills, weeklyIssues } from "../src/lib/kb";

describe("knowledge base", () => {
  it("contains a broad seed of real entries", () => {
    expect(models.length).toBeGreaterThanOrEqual(15);
    expect(mcps.length).toBeGreaterThanOrEqual(15);
    expect(skills.length).toBeGreaterThanOrEqual(15);
    expect(recipes.length).toBeGreaterThanOrEqual(5);
  });

  it("resolves every recipe component reference", () => {
    for (const recipe of recipes) {
      for (const component of recipe.components) {
        expect(getEntry(component.kind, component.id)).toBeDefined();
      }
    }
  });

  it("contains valid weekly editions with outlook and markdown content", () => {
    expect(weeklyIssues.length).toBeGreaterThanOrEqual(2);
    expect(currentWeeklyEdition).toBeDefined();
    for (const edition of weeklyIssues) {
      expect(edition.keyHighlights.length).toBeGreaterThan(0);
      expect(edition.nextWeekOutlook.length).toBeGreaterThan(0);
      expect(edition.fullMarkdownContent.length).toBeGreaterThan(100);
    }
  });

  it("has unique ids within each catalog", () => {
    const ids = (items: Array<{ id: string }>) => new Set(items.map((item) => item.id)).size;
    expect(ids(models)).toBe(models.length);
    expect(ids(mcps)).toBe(mcps.length);
    expect(ids(skills)).toBe(skills.length);
    expect(ids(recipes)).toBe(recipes.length);
  });
});
