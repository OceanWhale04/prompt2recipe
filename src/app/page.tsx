import { Suspense } from "react";

import { Recommender } from "@/components/recommender";
import { mcps, recipes } from "@/lib/kb";

export default function Home() {
  const featuredRecipes = recipes.slice(0, 4).map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    taskPattern: recipe.taskPattern,
    rationale: recipe.rationale,
    tags: recipe.tags.slice(0, 3),
  }));

  const featuredMcps = mcps
    .slice(-4)
    .reverse()
    .map((mcp) => ({
      id: mcp.id,
      name: mcp.name,
      oneLiner: mcp.oneLiner,
      url: mcp.url,
      tags: mcp.tags.slice(0, 3),
      verified: mcp.verified ?? false,
    }));

  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
      <Recommender featuredRecipes={featuredRecipes} featuredMcps={featuredMcps} />
    </Suspense>
  );
}
