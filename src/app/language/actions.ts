"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import type { PreferredLanguage } from "@/types/db";

const LANGUAGES = new Set<PreferredLanguage>(["en", "si", "ta"]);

export async function updatePreferredLanguage(formData: FormData) {
  const language = formData.get("language");
  if (typeof language !== "string" || !LANGUAGES.has(language as PreferredLanguage)) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await enforceRateLimit(supabase, user.id, "preferred_language_update", 30, 3600);

  const { error } = await supabase
    .from("profiles")
    .update({ preferred_language: language })
    .eq("id", user.id);

  if (error) throw new Error("Unable to update your language preference.");

  revalidatePath("/", "layout");
}
