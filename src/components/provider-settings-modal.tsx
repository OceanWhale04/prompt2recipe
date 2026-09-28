"use client";

import {
  Cpu,
  Eye,
  EyeOff,
  FlaskConical,
  KeyRound,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useProviderSettings } from "@/components/provider-settings-provider";
import { cn } from "@/lib/cn";
import {
  DEFAULT_PROVIDER_SETTINGS,
  getOllamaCompatibilityMessage,
  getOllamaModelCompatibility,
  validateProviderSettings,
  type ComputeProvider,
  type ProviderSettings,
} from "@/lib/compute-provider";

const providerOptions: Array<{
  id: ComputeProvider;
  title: string;
  description: string;
  icon: typeof KeyRound;
}> = [
  {
    id: "byok",
    title: "自定义 API Key",
    description: "DeepSeek / OpenAI Compatible · BYOK",
    icon: KeyRound,
  },
  {
    id: "ollama",
    title: "本地 Ollama",
    description: "Local Engine · 不消耗云端 API",
    icon: Cpu,
  },
  {
    id: "demo",
    title: "体验模式",
    description: "Static Matching · 默认静态匹配",
    icon: FlaskConical,
  },
];

const inputClass =
  "h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900";

export function ProviderSettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, saveSettings, resetSettings } = useProviderSettings();
  const [draft, setDraft] = useState<ProviderSettings>(settings);
  const [formError, setFormError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const ollamaCompatibility = getOllamaModelCompatibility(draft.ollamaModel);
  const ollamaCompatibilityMessage =
    draft.provider === "ollama" && draft.ollamaModel.trim()
      ? getOllamaCompatibilityMessage(draft.ollamaModel)
      : null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const updateDraft = <K extends keyof ProviderSettings>(
    key: K,
    value: ProviderSettings[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFormError(null);
  };

  const handleSave = () => {
    const error = validateProviderSettings(draft);
    if (error) {
      setFormError(error);
      return;
    }

    saveSettings(draft);
    onClose();
  };

  const handleReset = () => {
    resetSettings();
    setDraft(DEFAULT_PROVIDER_SETTINGS);
    setFormError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/35 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="provider-settings-title"
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-xl border border-zinc-200 bg-zinc-50 shadow-2xl sm:rounded-lg"
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-200 bg-white px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Compute settings
            </p>
            <h2 id="provider-settings-title" className="mt-1 text-lg font-semibold text-zinc-950">
              算力来源设置
            </h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              配置仅保存在当前浏览器，不会写入服务器数据库。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭设置"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs font-semibold text-zinc-700">
              算力提供商 Provider
            </legend>
            {providerOptions.map((option) => {
              const Icon = option.icon;
              const selected = draft.provider === option.id;
              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 transition-colors",
                    selected
                      ? "border-zinc-900 bg-white"
                      : "border-zinc-200 bg-white/60 hover:border-zinc-400",
                  )}
                >
                  <input
                    type="radio"
                    name="compute-provider"
                    value={option.id}
                    checked={selected}
                    onChange={() => updateDraft("provider", option.id)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                      selected ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-zinc-900">{option.title}</span>
                    <span className="block text-xs text-zinc-500">{option.description}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          {draft.provider === "byok" ? (
            <div className="grid gap-4 border-t border-zinc-200 pt-5">
              <label className="grid gap-1.5 text-xs font-medium text-zinc-600">
                Base URL
                <input
                  value={draft.byokBaseUrl}
                  onChange={(event) => updateDraft("byokBaseUrl", event.target.value)}
                  placeholder="https://api.deepseek.com"
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-zinc-600">
                Model Name
                <input
                  value={draft.byokModel}
                  onChange={(event) => updateDraft("byokModel", event.target.value)}
                  placeholder="deepseek-chat"
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-zinc-600">
                API Key
                <span className="relative block">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={draft.byokApiKey}
                    onChange={(event) => updateDraft("byokApiKey", event.target.value)}
                    placeholder="sk-..."
                    autoComplete="new-password"
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((current) => !current)}
                    aria-label={showApiKey ? "隐藏 API Key" : "显示 API Key"}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>
            </div>
          ) : null}

          {draft.provider === "ollama" ? (
            <div className="grid gap-4 border-t border-zinc-200 pt-5">
              <label className="grid gap-1.5 text-xs font-medium text-zinc-600">
                Ollama Base URL
                <input
                  value={draft.ollamaBaseUrl}
                  onChange={(event) => updateDraft("ollamaBaseUrl", event.target.value)}
                  placeholder="http://localhost:11434"
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-zinc-600">
                Model Name
                <input
                  value={draft.ollamaModel}
                  onChange={(event) => updateDraft("ollamaModel", event.target.value)}
                  placeholder="qwen2.5:7b"
                  className={inputClass}
                />
              </label>
              <div className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-3 text-xs leading-5 text-zinc-600">
                <p className="font-medium text-zinc-800">Structured output requirements</p>
                <p className="mt-1">
                  推荐 7B+ 指令模型：qwen2.5:7b、qwen2.5-coder:7b、deepseek-r1:7b、llama3.1:8b。
                  模型需支持 OpenAI-compatible /v1/chat/completions 与 JSON 输出。
                </p>
              </div>
              {ollamaCompatibilityMessage ? (
                <div
                  className={cn(
                    "rounded-lg border px-3 py-3 text-xs leading-5",
                    ollamaCompatibility === "unsupported"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-amber-200 bg-amber-50 text-amber-800",
                  )}
                >
                  {ollamaCompatibilityMessage}
                </div>
              ) : null}
            </div>
          ) : null}

          {draft.provider === "demo" ? (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-800">
              体验模式使用本地静态 JSON 完成匹配，不调用任何外部模型 API。
            </div>
          ) : null}

          {formError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {formError}
            </p>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-white px-5 py-4">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            恢复默认
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
            >
              保存设置
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
