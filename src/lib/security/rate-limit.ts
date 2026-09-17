import type { SupabaseClient } from "@supabase/supabase-js";

export async function enforceRateLimit(
  supabase: SupabaseClient,
  key: string,
  action: string,
  limit: number,
  windowSeconds: number
) {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_action: action,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error || data !== true) {
    throw new Error("Too many requests. Please wait and try again.");
  }
}
