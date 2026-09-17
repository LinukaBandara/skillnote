"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { enforceRateLimit } from "@/lib/security/rate-limit";
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
  if (profile.role !== "student" && profile.role !== "teacher" && profile.role !== "institute_admin" && profile.role !== "platform_admin") {
    redirect("/admin");
  }
  return profile;
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createInstitute(formData: FormData) {
  const actor = await requirePlatformAdmin();
  const supabase = await createClient();
  await enforceRateLimit(supabase, actor.id, "admin_institute_create", 20, 3600);

  const name = String(formData.get("name") ?? "").trim().slice(0, 160);
  if (!name) return;

  const slug = slugify(name).slice(0, 160);
  if (!slug) return;

  await supabase.from("institutes").insert({ name, slug });

  revalidatePath("/admin/institutes");
}

// Assigns an EXISTING account (by email) to an institute with a role.
// Platform admins can assign any supported role to any institute.
// Institute admins can only assign the "teacher" role, and only within their own institute.
export async function assignMember(instituteId: string, formData: FormData) {
  const actor = await requireInstituteStaff();
  const supabase = await createClient();
  await enforceRateLimit(supabase, actor.id, "admin_member_assign", 60, 3600);

  if (!instituteId || instituteId.length > 100) return;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || email.length > 320 || !/^\S+@\S+\.\S+$/.test(email)) return;

  let role = String(formData.get("role") ?? "").trim();
  const allowedRoles = new Set(["student", "teacher", "institute_admin"]);

  if (actor.role === "institute_admin") {
    if (actor.institute_id !== instituteId) redirect("/admin");
    role = "teacher";
  } else if (actor.role !== "platform_admin") {
    redirect("/admin");
  } else if (!allowedRoles.has(role)) {
    return;
  }

  const { data: institute } = await supabase
    .from("institutes")
    .select("id")
    .eq("id", instituteId)
    .maybeSingle();
  if (!institute) return;

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();

  if (!targetProfile) {
    redirect(`/admin/institutes/${instituteId}?error=${encodeURIComponent("No account found with that email. They need to sign up first.")}`);
  }

  await supabase
    .from("profiles")
    .update({ institute_id: instituteId, role })
    .eq("id", targetProfile.id);

  revalidatePath(`/admin/institutes/${instituteId}`);
}

export async function removeMember(instituteId: string, memberId: string) {
  const actor = await requireInstituteStaff();
  const supabase = await createClient();
  await enforceRateLimit(supabase, actor.id, "admin_member_remove", 60, 3600);

  if (!instituteId || instituteId.length > 100 || !memberId || memberId.length > 100) return;
  if (actor.role === "institute_admin" && actor.institute_id !== instituteId) redirect("/admin");
  if (actor.role !== "institute_admin" && actor.role !== "platform_admin") redirect("/admin");
  if (actor.id === memberId) return;

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", memberId)
    .eq("institute_id", instituteId)
    .maybeSingle();
  if (!targetProfile) return;

  if (actor.role === "institute_admin" && !["student", "teacher"].includes(targetProfile.role)) {
    redirect("/admin");
  }

  await supabase
    .from("profiles")
    .update({ institute_id: null })
    .eq("id", memberId)
    .eq("institute_id", instituteId);

  revalidatePath(`/admin/institutes/${instituteId}`);
}
