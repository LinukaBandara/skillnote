import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: cert } = await supabase
    .from("certificates")
    .select("*, courses(title), profiles(full_name)")
    .eq("certificate_code", code)
    .maybeSingle();

  return (
    <div className="max-w-xl mx-auto px-6 py-20">
      <h1 className="stat-serif text-4xl mb-8">Certificate verification</h1>

      {cert ? (
        <div className="clay p-8">
          <div className="flex items-center gap-2 text-sage text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-sage" />
            Valid certificate
          </div>
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-rule pb-3">
              <dt className="text-ink-soft">Holder</dt>
              <dd className="font-medium">{cert.profiles?.full_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-rule pb-3">
              <dt className="text-ink-soft">Course</dt>
              <dd className="font-medium">{cert.courses?.title ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-rule pb-3">
              <dt className="text-ink-soft">Issued</dt>
              <dd>{new Date(cert.issued_at).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Certificate ID</dt>
              <dd className="font-mono text-xs">{cert.certificate_code}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="clay p-8">
          <div className="flex items-center gap-2 text-red-500 text-sm mb-2">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            No certificate found
          </div>
          <p className="text-ink-soft text-sm">
            No certificate matches code <span className="font-mono">{code}</span>.
          </p>
        </div>
      )}

      <Link href="/" className="text-sm text-ink-soft hover:text-ink mt-8 inline-block">
        ← Skill Note
      </Link>
    </div>
  );
}
