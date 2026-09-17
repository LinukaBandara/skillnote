"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function submitAssignment(
  assignmentId: string,
  courseId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const file = formData.get("file") as File | null;
  const note = formData.get("note") as string;

  let filePath: string | null = null;
  let fileName: string | null = null;

  if (file && file.size > 0) {
    const buffer = await file.arrayBuffer();
    fileName = file.name;
    filePath = `${assignmentId}/${user.id}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("assignment-files")
      .upload(filePath, buffer, { contentType: file.type, upsert: true });

    if (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  await supabase.from("assignment_submissions").upsert(
    {
      assignment_id: assignmentId,
      student_id: user.id,
      file_path: filePath,
      file_name: fileName,
      note,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "assignment_id,student_id" }
  );

  revalidatePath(`/courses/${courseId}/assignments/${assignmentId}`);
}
