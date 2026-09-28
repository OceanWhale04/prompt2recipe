import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WeeklyDetailView } from "../components/weekly-detail-view";
import { getWeeklyEdition, weeklyIssues } from "@/lib/kb";

export const dynamicParams = false;

export function generateStaticParams() {
  return weeklyIssues.map((edition) => ({ id: edition.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const edition = getWeeklyEdition(id);

  if (!edition) {
    return { title: "Weekly edition not found | StackForge" };
  }

  return {
    title: `${edition.title} | StackForge Weekly`,
    description: edition.summary,
  };
}

export default async function WeeklyEditionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const edition = getWeeklyEdition(id);

  if (!edition) notFound();

  return <WeeklyDetailView edition={edition} />;
}
