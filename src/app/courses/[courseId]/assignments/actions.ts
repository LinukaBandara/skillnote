"use server";

import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_NOTE_LENGTH = 5000;

const ALLOWED_FILE_TYPES = new Map([
  ["application/pdf", ".pdf"],
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["text/plain", ".txt"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx"],
]);

function safeExtension(fileName: string, mimeType: string) {
  const extension = ALLOWED_FILE_TYPES.get(mimeType);
  if (!extension) return null;
  const suppliedExtension = fileName.includes(".")
    ? `.${fileName.split(".").pop()?.toLowerCase()}`
    : extension;

  return suppliedExtension === extension ? extension : null;
}

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

  await enforceRateLimit(supabase, user.id, "assignment_submit", 10, 3600);

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("id, course_id, due_date")
    .eq("id", assignmentId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (assignmentError || !assignment) throw new Error("Assignment not found.");

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("student_id", user.id)
    .maybeSingle();

  let hasClassAccess = false;
  if (!enrollment) {
    const { data: classMembership } = await supabase
      .from("class_members")
      .select("id, institute_classes!inner(class_courses!inner(course_id))")
      .eq("student_id", user.id)
      .eq("status", "active")
      .eq("institute_classes.class_courses.course_id", courseId)
      .limit(1)
      .maybeSingle();
    hasClassAccess = Boolean(classMembership);
  }

  if (!enrollment && !hasClassAccess) throw new Error("You do not have access to this course.");

  const file = formData.get("file") as File | null;
  const note = String(formData.get("note") ?? "").trim();

  if (note.length > MAX_NOTE_LENGTH) {
    throw new Error(`Note must be ${MAX_NOTE_LENGTH} characters or fewer.`);
  }

  let filePath: string | null = null;
  let fileName: string | null = null;

  if (file && file.size > 0) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File must be 10 MB or smaller.");
    }

    const extension = safeExtension(file.name, file.type);
    if (!extension) {
      throw new Error("This file type is not allowed. Upload PDF, PNG, JPEG, TXT, DOCX, or XLSX.");
    }

    fileName = file.name.replace(/[\\/\0]/g, "").trim().slice(0, 255) || `submission${extension}`;
    filePath = `${assignmentId}/${user.id}/${randomUUID()}${extension}`;

    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("assignment-files")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error("File upload failed. Please try again.");
    }
  }

  const { data: existingSubmission } = await supabase
    .from("assignment_submissions")
    .select("file_path")
    .eq("assignment_id", assignmentId)
    .eq("student_id", user.id)
    .maybeSingle();

  const { error: submissionError } = await supabase.from("assignment_submissions").upsert(
    {
      assignment_id: assignmentId,
      student_id: user.id,
      file_path: filePath ?? existingSubmission?.file_path ?? null,
      file_name: fileName ?? null,
      note: note || null,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "assignment_id,student_id" }
  );

  if (submissionError) {
    if (filePath) await supabase.storage.from("assignment-files").remove([filePath]);
    throw new Error("Unable to save the submission. Please try again.");
  }

  if (filePath && existingSubmission?.file_path && existingSubmission.file_path !== filePath) {
    await supabase.storage.from("assignment-files").remove([existingSubmission.file_path]);
  }

  revalidatePath(`/courses/${courseId}/assignments/${assignmentId}`);
}
