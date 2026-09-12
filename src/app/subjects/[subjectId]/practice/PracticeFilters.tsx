"use client";

import { useRouter } from "next/navigation";

export function PracticeFilters({
  subjectId,
  topics,
  years,
  current,
}: {
  subjectId: string;
  topics: { id: string; title: string }[];
  years: number[];
  current: { topic?: string; year?: string; difficulty?: string };
}) {
  const router = useRouter();

  function updateParam(key: string, value: string) {
    const usp = new URLSearchParams();
    const next = { ...current, [key]: value || undefined };
    if (next.topic) usp.set("topic", next.topic);
    if (next.year) usp.set("year", next.year);
    if (next.difficulty) usp.set("difficulty", next.difficulty);
    const qs = usp.toString();
    router.push(`/subjects/${subjectId}/practice${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        defaultValue={current.topic ?? ""}
        onChange={(e) => updateParam("topic", e.target.value)}
        className="border border-rule rounded-full px-3 py-1.5 text-xs bg-transparent focus:outline-none focus:border-cobalt"
      >
        <option value="">All topics</option>
        {topics.map((t) => (
          <option key={t.id} value={t.id}>{t.title}</option>
        ))}
      </select>

      <select
        defaultValue={current.year ?? ""}
        onChange={(e) => updateParam("year", e.target.value)}
        className="border border-rule rounded-full px-3 py-1.5 text-xs bg-transparent focus:outline-none focus:border-cobalt"
      >
        <option value="">All years</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      <select
        defaultValue={current.difficulty ?? ""}
        onChange={(e) => updateParam("difficulty", e.target.value)}
        className="border border-rule rounded-full px-3 py-1.5 text-xs bg-transparent focus:outline-none focus:border-cobalt"
      >
        <option value="">Any difficulty</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
    </div>
  );
}
