import Link from "next/link";
import { ArrowLeft, WandSparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { WeeklyReportEdition } from "@/types/weekly";

export function WeeklyDetailView({ edition }: { edition: WeeklyReportEdition }) {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 border-b border-zinc-200 pb-6">
        <Link
          href="/portal/weekly"
          className="flex w-fit items-center gap-2 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回周刊列表
        </Link>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
            {edition.dateRange}
          </p>
          <h1 className="mt-2 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-zinc-950">
            {edition.title}
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-600">{edition.summary}</p>
        </div>
        {edition.recommendedPrompts?.length ? (
          <div className="flex flex-wrap gap-2">
            {edition.recommendedPrompts.map((prompt) => (
              <Link
                key={prompt}
                href={`/?task=${encodeURIComponent(prompt)}`}
                className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-500 hover:text-zinc-950"
              >
                <WandSparkles className="h-3.5 w-3.5" />
                套用至决策引擎
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      <div className="max-w-4xl">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h2 className="mb-4 mt-8 text-2xl font-semibold text-zinc-950 first:mt-0">{children}</h2>
            ),
            h2: ({ children }) => (
              <h3 className="mb-3 mt-8 text-xl font-semibold text-zinc-950">{children}</h3>
            ),
            h3: ({ children }) => (
              <h4 className="mb-2 mt-6 text-base font-semibold text-zinc-900">{children}</h4>
            ),
            p: ({ children }) => <p className="mb-4 text-sm leading-7 text-zinc-600">{children}</p>,
            ul: ({ children }) => (
              <ul className="mb-5 flex list-disc flex-col gap-2 pl-5 text-sm leading-6 text-zinc-600">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-5 flex list-decimal flex-col gap-2 pl-5 text-sm leading-6 text-zinc-600">
                {children}
              </ol>
            ),
            code: ({ children }) => (
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-800">
                {children}
              </code>
            ),
            a: ({ children, href }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4"
              >
                {children}
              </a>
            ),
          }}
        >
          {edition.fullMarkdownContent}
        </ReactMarkdown>
      </div>
    </article>
  );
}
