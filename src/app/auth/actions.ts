"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 160;

function normalizeEmail(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function redirectAuthError(path: string) {
  redirect(`${path}?error=${encodeURIComponent("Unable to complete authentication. Please check your details and try again.")}`);
}

export async function login(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";

  if (!email || email.length > MAX_EMAIL_LENGTH || !password || password.length > MAX_PASSWORD_LENGTH) {
    redirectAuthError("/login");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectAuthError("/login");
  }

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const fullName = typeof formData.get("full_name") === "string"
    ? String(formData.get("full_name")).trim().slice(0, MAX_NAME_LENGTH)
    : "";

  if (!email || email.length > MAX_EMAIL_LENGTH || !password || password.length < 6 || password.length > MAX_PASSWORD_LENGTH || !fullName) {
    redirectAuthError("/signup");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    redirectAuthError("/signup");
  }

  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
