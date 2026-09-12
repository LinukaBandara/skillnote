import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const { data: cert } = await supabase
    .from("certificates")
    .select("*, courses(title)")
    .eq("student_id", profile.id)
    .eq("course_id", courseId)
    .single();

  if (!cert) notFound();

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <Link href={`/courses/${courseId}`} className="text-sm text-ink-soft hover:text-ink">
        ← Back to course
      </Link>

      <div className="clay p-10 mt-8 text-center">
        <p className="text-xs text-ink-faint uppercase tracking-wide mb-6">Certificate of completion</p>
        <p className="stat-serif text-3xl mb-2">{profile.full_name}</p>
        <p className="text-ink-soft text-sm mb-8">has completed</p>
        <p className="text-xl font-semibold mb-10">{cert.courses?.title}</p>
        <div className="flex items-center justify-between text-xs text-ink-faint border-t border-rule pt-6">
          <span>Issued {new Date(cert.issued_at).toLocaleDateString()}</span>
          <span>ID: {cert.certificate_code}</span>
        </div>
      </div>

      <p className="text-xs text-ink-faint text-center mt-4">
        Verify at <span className="text-ink">skillnote.lk/verify/{cert.certificate_code}</span>
      </p>
    </div>
  );
}
