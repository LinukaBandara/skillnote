"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "platform_admin" && profile.role !== "institute_admin") {
    redirect("/dashboard");
  }
  return profile;
}

async function requireCourseManager(courseId: string) {
  const profile = await requireAdmin();
  if (!courseId) redirect("/admin/courses");

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, institute_id")
    .eq("id", courseId)
    .single();

  if (!course) redirect("/admin/courses");
  if (profile.role === "institute_admin" && profile.institute_id !== course.institute_id) {
    redirect("/admin/courses");
  }

  return { profile, supabase, course };
}

export async function createCourse(formData: FormData) {
  const profile = await requireAdmin();
  if (!profile.institute_id && profile.role !== "platform_admin") return;

  const supabase = await createClient();
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const description = String(formData.get("description") ?? "").trim().slice(0, 10000);
  const subjectId = String(formData.get("subject_id") ?? "").trim() || null;

  if (!title) return;

  const { data: course } = await supabase
    .from("courses")
    .insert({
      title,
      description,
      subject_id: subjectId,
      institute_id: profile.institute_id,
      created_by: profile.id,
      published: false,
    })
    .select()
    .single();

  revalidatePath("/admin/courses");
  if (course) redirect(`/admin/courses/${course.id}`);
}

export async function togglePublish(courseId: string, published: boolean) {
  const { supabase } = await requireCourseManager(courseId);

  await supabase.from("courses").update({ published: Boolean(published) }).eq("id", courseId);

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function addModule(courseId: string, formData: FormData) {
  const { supabase } = await requireCourseManager(courseId);

  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  if (!title) return;

  const { count } = await supabase
    .from("modules")
    .select("*", { count: "exact", head: true })
    .eq("course_id", courseId);

  await supabase.from("modules").insert({
    course_id: courseId,
    title,
    position: (count ?? 0) + 1,
  });

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function addLesson(
  moduleId: string,
  courseId: string,
  formData: FormData
) {
  const { supabase } = await requireCourseManager(courseId);

  const { data: module } = await supabase
    .from("modules")
    .select("id, course_id")
    .eq("id", moduleId)
    .eq("course_id", courseId)
    .single();
  if (!module) return;

  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const content = String(formData.get("content") ?? "").trim().slice(0, 100000);
  const rawVideoUrl = String(formData.get("video_url") ?? "").trim();
  const videoUrl = rawVideoUrl ? rawVideoUrl.slice(0, 2048) : null;

  if (!title) return;

  const { count } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true })
    .eq("module_id", moduleId);

  await supabase.from("lessons").insert({
    module_id: moduleId,
    title,
    content,
    video_url: videoUrl,
    position: (count ?? 0) + 1,
  });

  revalidatePath(`/admin/courses/${courseId}`);
}
