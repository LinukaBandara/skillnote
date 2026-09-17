import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import { addStudyItem, toggleStudyItem, deleteStudyItem, suggestFromWeakTopics } from "./actions";
import { AppShell } from "@/components/dashboard/AppShell";

function formatDateLabel(dateStr: string) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export default async function StudyPlanPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const { data: subjectRows } = await supabase
    .from("student_subjects")
    .select("subjects(id, name)")
    .eq("student_id", profile.id);
  const subjects = (subjectRows ?? []).map((r) => r.subjects).flat() as { id: string; name: string }[];

  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: items } = await supabase
    .from("study_plan_items")
    .select("*, subjects(name)")
    .eq("student_id", profile.id)
    .gte("scheduled_date", todayStr)
    .order("scheduled_date")
    .order("scheduled_time");

  type StudyItem = NonNullable<typeof items>[number];
  const grouped = (items ?? []).reduce<Record<string, StudyItem[]>>((acc, item) => {
    (acc[item.scheduled_date] ||= []).push(item);
    return acc;
  }, {});

  return (
    <AppShell activeHref="/study-plan">
    <div className="max-w-xl px-6 md:px-8 py-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold">Study plan</h1>
        <form action={suggestFromWeakTopics}>
          <button type="submit" className="text-xs text-cobalt border-b border-cobalt/30 hover:border-cobalt pb-0.5">
            Suggest from weak topics
          </button>
        </form>
      </div>
      <p className="text-ink-soft mb-10 text-sm">Plan what to study and when.</p>

      <details className="clay p-6 mb-10">
        <summary className="cursor-pointer text-sm font-medium">+ Add a study session</summary>
        <form action={addStudyItem} className="space-y-4 mt-5">
          <input
            name="title"
            placeholder="What are you studying?"
            required
            className="field"
          />
          <div className="grid grid-cols-2 gap-4">
            <select name="subject_id" className="field">
              <option value="">No subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select name="duration_minutes" defaultValue="30" className="field">
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              name="scheduled_date"
              required
              defaultValue={todayStr}
              className="field"
            />
            <input
              type="time"
              name="scheduled_time"
              className="field"
            />
          </div>
          <button type="submit" className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">
            Add to plan
          </button>
        </form>
      </details>

      {Object.keys(grouped).length === 0 ? (
        <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
          Nothing planned yet. Add a session above, or use &ldquo;Suggest from weak topics&rdquo;.
        </p>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, dayItems]) => (
            <div key={date}>
              <h2 className="section-label mb-3">{formatDateLabel(date)}</h2>
              <ul className="border-t border-rule">
                {(dayItems ?? []).map((item) => (
                  <li key={item.id} className="border-b border-rule py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <form action={async () => { "use server"; await toggleStudyItem(item.id, !item.completed); }}>
                        <button
                          type="submit"
                          className={`w-4 h-4 rounded-full border shrink-0 ${item.completed ? "bg-sage border-sage" : "border-rule"}`}
                        />
                      </form>
                      <div>
                        <p className={`text-sm ${item.completed ? "line-through text-ink-faint" : ""}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-ink-faint">
                          {item.scheduled_time ? `${item.scheduled_time.slice(0, 5)} · ` : ""}
                          {item.duration_minutes} min
                          {item.subjects?.name ? ` · ${item.subjects.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <form action={async () => { "use server"; await deleteStudyItem(item.id); }}>
                      <button type="submit" className="text-xs text-ink-faint hover:text-red-500">
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
    </AppShell>
  );
}
