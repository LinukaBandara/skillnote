"use server";

import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function markAllRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await enforceRateLimit(supabase, user.id, "notifications_mark_all_read", 30, 3600);

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) throw new Error("Unable to update notifications.");

  revalidatePath("/notifications");
}

export async function markRead(id: string) {
  if (!id || id.length > 100) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await enforceRateLimit(supabase, user.id, "notification_mark_read", 120, 3600);

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error("Unable to update notification.");

  revalidatePath("/notifications");
}
