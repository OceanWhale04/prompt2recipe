import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SpeedInsights } from "@vercel/speed-insights/next";

import { Navbar } from "@/components/navbar";
import { ProviderSettingsProvider } from "@/components/provider-settings-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "StackForge | Prompt2Recipe",
  description: "Task-driven AI architecture configuration engine and intelligence portal",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50 text-zinc-900">
        <ProviderSettingsProvider>
          <Navbar />
          {children}
        </ProviderSettingsProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
