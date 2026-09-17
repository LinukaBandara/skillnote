"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requirePlatformAdmin() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "platform_admin") redirect("/admin");
  return profile;
}

async function requireInstituteStaff() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");
  return profile;
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createInstitute(formData: FormData) {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const slug = slugify(name);

  await supabase.from("institutes").insert({ name, slug });

  revalidatePath("/admin/institutes");
}

// Assigns an EXISTING account (by email) to an institute with a role.
// Platform admins can assign any role to any institute.
// Institute admins can only assign the "teacher" role, and only within their own institute.
export async function assignMember(instituteId: string, formData: FormData) {
  const actor = await requireInstituteStaff();
  const supabase = await createClient();

  const email = (formData.get("email") as string).trim().toLowerCase();
  let role = formData.get("role") as string;

  if (actor.role === "institute_admin") {
    if (actor.institute_id !== instituteId) redirect("/admin");
    role = "teacher"; // institute admins can only add teachers, not other admins
  } else if (actor.role !== "platform_admin") {
    redirect("/admin");
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!targetProfile) {
    redirect(`/admin/institutes/${instituteId}?error=${encodeURIComponent("No account found with that email. They need to sign up first.")}`);
  }

  await supabase
    .from("profiles")
    .update({ institute_id: instituteId, role })
    .eq("id", targetProfile!.id);

  revalidatePath(`/admin/institutes/${instituteId}`);
}

export async function removeMember(instituteId: string, memberId: string) {
  const actor = await requireInstituteStaff();
  if (actor.role === "institute_admin" && actor.institute_id !== instituteId) redirect("/admin");
  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({ institute_id: null })
    .eq("id", memberId)
    .eq("institute_id", instituteId);

  revalidatePath(`/admin/institutes/${instituteId}`);
}
