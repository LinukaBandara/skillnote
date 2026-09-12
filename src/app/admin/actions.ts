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

export async function createCourse(formData: FormData) {
  const profile = await requireStaff();
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const subjectId = (formData.get("subject_id") as string) || null;

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
  await requireStaff();
  const supabase = await createClient();

  await supabase.from("courses").update({ published }).eq("id", courseId);

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function addModule(courseId: string, formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const title = formData.get("title") as string;

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
  await requireStaff();
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const videoUrl = (formData.get("video_url") as string) || null;

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
