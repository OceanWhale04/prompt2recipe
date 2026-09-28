"use client";

import { useObject } from "@ai-sdk/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Check,
  ClipboardList,
  ExternalLink,
  Flame,
  Globe,
  Loader2,
  Search,
  Sparkles,
  Square,
  WandSparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useProviderSettings } from "@/components/provider-settings-provider";
import { cn } from "@/lib/cn";
import { toRuntimeProviderConfig } from "@/lib/compute-provider";
import { translations, type Locale, type Translation } from "@/lib/i18n";
import { workflowPlanSchema } from "@/lib/schemas";
import type {
  RecommendationCombo,
  WorkflowPlan,
  WorkflowStep,
} from "@/lib/types";

type FeaturedRecipe = {
  id: string;
  title: string;
  taskPattern: string;
  rationale: string;
  tags: string[];
};

type FeaturedMcp = {
  id: string;
  name: string;
  oneLiner: string;
  url: string;
  tags: string[];
  verified: boolean;
};

const exampleTasks: Array<keyof Translation["examples"]> = ["pdf", "web", "code", "slides"];

const phaseStyles: Record<WorkflowStep["phase"], string> = {
  prepare: "bg-sky-50 text-sky-700 border-sky-200",
  configure: "bg-amber-50 text-amber-700 border-amber-200",
  run: "bg-violet-50 text-violet-700 border-violet-200",
  verify: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function ComboItemCard({
  item,
}: {
  item: { name: string; url: string; oneLiner: string; role: string; reasoning: string };
}) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-24 flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <BrainCircuit className="h-4 w-4 shrink-0 text-zinc-500" />
          <span className="truncate text-sm font-medium text-zinc-900">{item.name}</span>
        </div>
        <ExternalLink className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500" />
      </div>
      <p className="line-clamp-2 text-xs leading-5 text-zinc-600">{item.oneLiner}</p>
      <p className="text-[11px] leading-5 text-zinc-500">{item.reasoning}</p>
      <p className="mt-auto text-[11px] font-medium text-zinc-400">{item.role}</p>
    </a>
  );
}

function ComboSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ name: string; url: string; oneLiner: string; role: string; reasoning: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">
        {title}
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
          {items.length}
        </span>
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ComboItemCard key={`${item.name}-${item.role}`} item={item} />
        ))}
      </div>
    </section>
  );
}

function FeaturedShowcase({
  recipes,
  mcps,
  onRun,
}: {
  recipes: FeaturedRecipe[];
  mcps: FeaturedMcp[];
  onRun: (prompt: string) => void;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <Flame className="h-4 w-4 text-orange-500" />
            热门技术栈配方
            <span className="hidden text-xs font-normal text-zinc-400 sm:inline">Featured Recipes</span>
          </h2>
          <Link
            href="/portal/models"
            className="flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Models
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => onRun(recipe.taskPattern)}
              className="group flex min-h-40 flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-zinc-400"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold leading-5 text-zinc-900">{recipe.title}</h3>
                <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-700" />
              </div>
              <p className="line-clamp-3 text-xs leading-5 text-zinc-500">{recipe.rationale}</p>
              <div className="mt-auto flex flex-wrap gap-1.5">
                {recipe.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <Zap className="h-4 w-4 text-amber-500" />
            最新接入 MCP 工具
            <span className="hidden text-xs font-normal text-zinc-400 sm:inline">Latest MCPs</span>
          </h2>
          <Link
            href="/portal/mcps"
            className="flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            MCPs
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {mcps.map((mcp) => (
            <button
              key={mcp.id}
              type="button"
              onClick={() =>
                onRun(`使用 ${mcp.name}：${mcp.oneLiner}。请给出可执行的配置与调用步骤。`)
              }
              className="group flex min-h-40 flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-zinc-400"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-zinc-900">{mcp.name}</h3>
                  {mcp.verified ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      verified
                    </span>
                  ) : null}
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-700" />
              </div>
              <p className="line-clamp-3 text-xs leading-5 text-zinc-500">{mcp.oneLiner}</p>
              <div className="mt-auto flex flex-wrap gap-1.5">
                {mcp.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Recommender({
  featuredRecipes,
  featuredMcps,
}: {
  featuredRecipes: FeaturedRecipe[];
  featuredMcps: FeaturedMcp[];
}) {
  const [locale, setLocale] = useState<Locale>("zh");
  const t = translations[locale];
  const { settings } = useProviderSettings();
  const searchParams = useSearchParams();
  const runtimeProvider = toRuntimeProviderConfig(settings);
  const computeSourceLabel =
    settings.provider === "ollama"
      ? `${t.computeOllama} (${settings.ollamaModel})`
      : settings.provider === "byok"
        ? t.computeByok
        : t.computeDemo;
  const computeDot =
    settings.provider === "ollama"
      ? "bg-emerald-500"
      : settings.provider === "byok"
        ? "bg-blue-500"
        : "bg-amber-500";

  const [task, setTask] = useState(searchParams.get("task") ?? "");
  const [mode, setMode] = useState<"combo" | "full">("combo");
  const [combo, setCombo] = useState<RecommendationCombo | null>(null);
  const [comboLoading, setComboLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const workflow = useObject({
    api: "/api/recommend",
    schema: workflowPlanSchema,
    onError: (error) => setRequestError(error.message || t.error),
    onFinish: ({ error }) => {
      if (error) setRequestError(error.message || t.error);
    },
  });


  const workflowObject = workflow.object as Partial<WorkflowPlan> | undefined;
  const comboFallbackMessage =
    combo?.computeSource === "demo" || !combo?.fallbackReason
      ? null
      : combo.fallbackReason === "provider_error"
        ? t.fallbackProviderError
        : t.fallbackMissingKey;
  const workflowFallbackMessage =
    workflowObject?.generatedBy === "local"
      ? workflowObject.computeSource === "demo" || !workflowObject.fallbackReason
        ? null
        : workflowObject.fallbackReason === "provider_error"
          ? t.fallbackProviderError
          : t.fallbackMissingKey
      : null;
  const workflowSteps: Array<Partial<WorkflowStep>> = useMemo(
    () => workflowObject?.steps ?? [],
    [workflowObject],
  );

  const resetWorkflow = () => {
    workflow.clear();
  };

  const requestCombo = async (input: string) => {
    setComboLoading(true);
    setRequestError(null);
    resetWorkflow();
    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: input,
          stage: "combo",
          provider: runtimeProvider,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.details ?? payload?.error ?? t.error);
      }
      const payload = await response.json();
      setCombo(payload.combo as RecommendationCombo);
      return payload.combo as RecommendationCombo;
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : t.error);
      return null;
    } finally {
      setComboLoading(false);
    }
  };

  const requestWorkflow = (input: string, nextCombo: RecommendationCombo) => {
    workflow.submit({
      task: input,
      stage: "workflow",
      combo: nextCombo,
      provider: runtimeProvider,
    });
  };

  const runTask = async (input: string, nextMode: "combo" | "full") => {
    const trimmed = input.trim();
    if (!trimmed || comboLoading || workflow.isLoading) return;

    const nextCombo = await requestCombo(trimmed);
    if (nextCombo && nextMode === "full") {
      requestWorkflow(trimmed, nextCombo);
    }
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    await runTask(task, mode);
  };

  const runExample = (key: keyof Translation["examples"]) => {
    setTask(t.examples[key]);
    setMode("combo");
  };

  const runFeatured = (prompt: string) => {
    setTask(prompt);
    setMode("combo");
    void runTask(prompt, "combo");
  };

  const handleDeepClick = () => {
    if (combo && !workflow.isLoading) requestWorkflow(task, combo);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <WandSparkles className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{t.brand}</h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-zinc-500">{t.tagline}</p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
          <Globe className="ml-1 h-4 w-4 text-zinc-400" />
          {(["zh", "en"] as Locale[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLocale(item)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                locale === item ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100",
              )}
            >
              {item === "zh" ? "中文" : "EN"}
            </button>
          ))}
        </div>
      </header>

      <main className="flex flex-col gap-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <textarea
              value={task}
              onChange={(event) => setTask(event.target.value)}
              placeholder={t.placeholder}
              rows={3}
              className="min-h-[96px] w-full resize-none rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm leading-6 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900"
            />

            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className={cn("h-2 w-2 rounded-full", computeDot)} />
              <span>
                {t.computeLabel}: {computeSourceLabel}
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setMode("combo")}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    mode === "combo" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100",
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {t.modeCombo}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("full")}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    mode === "full" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100",
                  )}
                >
                  <Wrench className="h-3.5 w-3.5" />
                  {t.modeFull}
                </button>
              </div>

              <button
                type="submit"
                disabled={!task.trim() || comboLoading || workflow.isLoading}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {comboLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {comboLoading ? t.deepButtonBusy : mode === "full" ? t.submitFull : t.submitCombo}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400">{t.tryExample}</span>
            {exampleTasks.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => runExample(key)}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
              >
                {t.examples[key]}
              </button>
            ))}
          </div>
        </form>

        <FeaturedShowcase recipes={featuredRecipes} mcps={featuredMcps} onRun={runFeatured} />

        {requestError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {requestError}
          </div>
        )}

        {!combo && !comboLoading && (
          <div className="rounded-lg border border-dashed border-zinc-200 py-14 text-center">
            <ClipboardList className="mx-auto mb-3 h-7 w-7 text-zinc-300" />
            <p className="text-sm text-zinc-400">{t.empty}</p>
          </div>
        )}

        {combo && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 border-b border-zinc-200 pb-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900">
                  <Sparkles className="h-4 w-4 text-zinc-500" />
                  {t.comboTitle}
                </h2>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                  {combo.computeSource === "demo"
                    ? t.computeDemo
                    : combo.generatedBy === "ai"
                      ? t.generatedAi
                      : t.generatedLocal}
                </span>
              </div>
              <p className="text-sm leading-6 text-zinc-600">{combo.rationale}</p>
               {combo.generatedBy === "local" && comboFallbackMessage ? (
                 <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
                   <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                   <span>{comboFallbackMessage}</span>
                 </div>
               ) : null}
            </div>

            <ComboSection title={t.models} items={combo.models} />
            <ComboSection title={t.mcps} items={combo.mcps} />
            <ComboSection title={t.skills} items={combo.skills} />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={workflow.isLoading ? workflow.stop : handleDeepClick}
                disabled={workflow.isLoading}
                className="flex h-10 items-center gap-2 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {workflow.isLoading ? <Square className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                {workflow.isLoading ? t.cancel : t.deepButton}
              </button>
            </div>
          </section>
        )}

        {(workflow.isLoading || workflowSteps.length > 0) && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-4">
              <Wrench className="h-4 w-4 text-zinc-500" />
              <h2 className="text-base font-semibold text-zinc-900">{t.workflowTitle}</h2>
              {workflow.isLoading && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
            </div>
             {workflowFallbackMessage ? (
               <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
                 <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                 <span>{workflowFallbackMessage}</span>
               </div>
             ) : null}

            <ol className="flex flex-col gap-3">
              {workflowSteps.map((step, index) => (
                <li
                  key={step.id ?? index}
                  className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white">
                        {index + 1}
                      </span>
                      <h3 className="text-sm font-semibold text-zinc-900">{step.title ?? ""}</h3>
                    </div>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", phaseStyles[step.phase ?? "prepare"])}>
                      {step.phase}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700">{step.action ?? ""}</p>
                  {step.detail ? <p className="text-sm leading-6 text-zinc-500">{step.detail}</p> : null}
                  {step.command && (
                    <code className="block overflow-x-auto rounded-md bg-zinc-100 px-3 py-2 text-xs text-zinc-700">
                      {step.command}
                    </code>
                  )}
                  <div className="flex items-start gap-2 border-t border-zinc-100 pt-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 text-zinc-400" />
                    <p className="text-xs leading-5 text-zinc-500">{step.rationale ?? ""}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>
    </div>
  );
}
