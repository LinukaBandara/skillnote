import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { completeOnboarding } from "./actions";
import type { Subject, Stream, PreferredLanguage } from "@/types/db";
import { AppShell } from "@/components/dashboard/AppShell";

const LANGUAGES: { value: PreferredLanguage; label: string; native: string }[] = [
  { value: "en", label: "English", native: "English" },
  { value: "si", label: "Sinhala", native: "සිංහල" },
  { value: "ta", label: "Tamil", native: "தமிழ்" },
];

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", user.id)
    .single();

  const { data: streams } = await supabase
    .from("streams")
    .select("*")
    .order("name");

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .order("name");

  const streamList = (streams ?? []) as Stream[];
  const subjectList = (subjects ?? []) as Subject[];
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear + 1, currentYear + 2];

  return (
    <AppShell activeHref="/onboarding">
      <div className="max-w-lg px-6 md:px-8 py-10">
        <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-1">Set up your studies</h1>
        <p className="text-ink-soft mb-10 text-sm">
          This helps Skill Note show the right syllabus and exam countdown.
        </p>

        <form action={completeOnboarding} className="space-y-8">
          <div>
            <label className="block text-sm font-medium mb-3">A/L examination year</label>
            <div className="flex gap-2">
              {yearOptions.map((y) => (
                <label key={y} className="flex-1">
                  <input type="radio" name="al_year" value={y} defaultChecked={y === currentYear + 1} className="peer sr-only" />
                  <div className="text-center py-2.5 rounded-full border border-rule text-sm cursor-pointer peer-checked:bg-ink peer-checked:text-white peer-checked:border-ink transition-colors">{y}</div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Medium of instruction</label>
            <div className="flex gap-2">
              {(["english", "sinhala", "tamil"] as const).map((m) => (
                <label key={m} className="flex-1">
                  <input type="radio" name="medium" value={m} defaultChecked={m === "english"} className="peer sr-only" />
                  <div className="text-center py-2.5 rounded-full border border-rule text-sm capitalize cursor-pointer peer-checked:bg-ink peer-checked:text-white peer-checked:border-ink transition-colors">{m}</div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Content language</label>
            <div className="flex gap-2">
              {LANGUAGES.map((language) => (
                <label key={language.value} className="flex-1">
                  <input
                    type="radio"
                    name="preferred_language"
                    value={language.value}
                    defaultChecked={(profile?.preferred_language ?? "en") === language.value}
                    className="peer sr-only"
                  />
                  <div className="text-center py-2.5 rounded-full border border-rule text-sm cursor-pointer peer-checked:bg-ink peer-checked:text-white peer-checked:border-ink transition-colors">
                    <span className="block">{language.native}</span>
                    <span className="text-[10px] opacity-60">{language.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Your subjects</label>
            <div className="space-y-6">
              {streamList.map((stream) => {
                const streamSubjects = subjectList.filter((s) => s.stream_id === stream.id);
                if (streamSubjects.length === 0) return null;
                return (
                  <div key={stream.id}>
                    <p className="text-xs text-ink-faint mb-2">{stream.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {streamSubjects.map((subject) => (
                        <label key={subject.id}>
                          <input type="checkbox" name="subject_ids" value={subject.id} className="peer sr-only" />
                          <div className="px-3.5 py-2 rounded-full border border-rule text-sm cursor-pointer peer-checked:bg-ink peer-checked:text-white peer-checked:border-ink transition-colors">{subject.name}</div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3 rounded-full font-medium text-sm">Continue to dashboard</button>
        </form>
      </div>
    </AppShell>
  );
}
