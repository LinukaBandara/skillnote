"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const LANGUAGES = new Set(["en", "si", "ta"]);

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const alYear = Number(formData.get("al_year"));
  const medium = formData.get("medium") as string;
  const preferredLanguage = formData.get("preferred_language") as string;
  const subjectIds = formData.getAll("subject_ids") as string[];

  await supabase
    .from("profiles")
    .update({
      al_year: alYear,
      medium,
      preferred_language: LANGUAGES.has(preferredLanguage) ? preferredLanguage : "en",
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
