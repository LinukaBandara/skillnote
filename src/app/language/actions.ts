"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PreferredLanguage } from "@/types/db";

const LANGUAGES = new Set<PreferredLanguage>(["en", "si", "ta"]);

export async function updatePreferredLanguage(formData: FormData) {
  const language = formData.get("language");
  if (typeof language !== "string" || !LANGUAGES.has(language as PreferredLanguage)) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("profiles")
    .update({ preferred_language: language })
    .eq("id", user.id);

  revalidatePath("/", "layout");
}
