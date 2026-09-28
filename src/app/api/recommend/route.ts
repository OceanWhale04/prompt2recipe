import { NextResponse } from "next/server";

import { OllamaCompatibilityError } from "@/lib/compute-provider";
import { generateCombo, generateWorkflowStream, getDeepSeekStatus } from "@/lib/llm";
import { KeywordRetriever } from "@/lib/retriever";
import { recommendRequestSchema } from "@/lib/schemas";
import { selectCandidates } from "@/lib/selection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function providerErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Provider request failed.";
  const unsupportedOllama = error instanceof OllamaCompatibilityError;

  return NextResponse.json(
    {
      error: unsupportedOllama
        ? "Unsupported Ollama model."
        : "Provider request failed. Check the Base URL, API Key, model name, and network access.",
      details: message,
    },
    { status: unsupportedOllama ? 400 : 502 },
  );
}

export async function GET() {
  return NextResponse.json({ provider: getDeepSeekStatus() });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = recommendRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { task, stage, provider } = parsed.data;
  const retriever = new KeywordRetriever();

  try {
    if (stage === "combo") {
      const candidates = await selectCandidates(task, retriever);
      const result = await generateCombo(task, candidates, provider);
      return NextResponse.json({ combo: result });
    }

    return await generateWorkflowStream(task, parsed.data.combo, provider);
  } catch (error) {
    return providerErrorResponse(error);
  }
}
