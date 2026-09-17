"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireStaff() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");
  return profile;
}

export async function createQuestion(formData: FormData) {
  const profile = await requireStaff();
  const supabase = await createClient();

  const subjectId = formData.get("subject_id") as string;
  const topicId = (formData.get("topic_id") as string) || null;
  const questionText = formData.get("question_text") as string;
  const options = [
    formData.get("option_0") as string,
    formData.get("option_1") as string,
    formData.get("option_2") as string,
    formData.get("option_3") as string,
  ].filter((o) => o && o.trim().length > 0);
  const correctIndex = Number(formData.get("correct_index"));
  const difficulty = (formData.get("difficulty") as string) || "medium";
  const year = formData.get("year") ? Number(formData.get("year")) : null;
  const marks = Number(formData.get("marks")) || 1;
  const source = (formData.get("source") as string) || null;

  await supabase.from("questions").insert({
    subject_id: subjectId,
    topic_id: topicId,
    question_type: "mcq",
    question_text: questionText,
    options,
    correct_index: correctIndex,
    difficulty,
    year,
    marks,
    source,
    medium: "english",
    created_by: profile.id,
  });

  revalidatePath("/admin/questions");
}

export async function deleteQuestion(questionId: string) {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("questions").delete().eq("id", questionId);
  revalidatePath("/admin/questions");
}
