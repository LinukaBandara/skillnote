"use server";

import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const LANGUAGES = new Set(["en", "si", "ta"]);
const MEDIUMS = new Set(["english", "sinhala", "tamil"]);

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await enforceRateLimit(supabase, user.id, "onboarding_complete", 10, 3600);

  const alYear = Number(formData.get("al_year"));
  const medium = String(formData.get("medium") ?? "").trim().toLowerCase();
  const preferredLanguage = String(formData.get("preferred_language") ?? "").trim().toLowerCase();
  const subjectIds = Array.from(new Set(formData.getAll("subject_ids").map(String).filter(Boolean))).slice(0, 20);

  if (!Number.isInteger(alYear) || alYear < 2024 || alYear > 2100) return;
  if (!MEDIUMS.has(medium)) return;
  if (!LANGUAGES.has(preferredLanguage)) return;

  if (subjectIds.length > 0) {
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id")
      .in("id", subjectIds);
    if ((subjects ?? []).length !== subjectIds.length) return;
  }

  await supabase
    .from("profiles")
    .update({
      al_year: alYear,
      medium,
      preferred_language: preferredLanguage,
    })
    .eq("id", user.id);

  await supabase.from("student_subjects").delete().eq("student_id", user.id);
  if (subjectIds.length > 0) {
    await supabase.from("student_subjects").insert(
      subjectIds.map((subject_id) => ({ student_id: user.id, subject_id }))
    );
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
