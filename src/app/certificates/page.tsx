import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/dashboard/AppShell";

export default async function CertificatesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: certs } = await supabase
    .from("certificates")
    .select("*, courses(id, title)")
    .eq("student_id", profile.id)
    .order("issued_at", { ascending: false });

  return (
    <AppShell activeHref="/certificates">
      <div className="max-w-xl px-6 md:px-8 py-10">
        <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-1">Certificates</h1>
        <p className="text-ink-soft mb-10 text-sm">Courses you&rsquo;ve completed.</p>

        {(certs ?? []).length === 0 ? (
          <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
            No certificates yet. Complete every lesson in a course to earn one.
          </p>
        ) : (
          <ul className="border-t border-rule">
            {(certs ?? []).map((c) => (
              <li key={c.id} className="border-b border-rule">
                <Link
                  href={`/courses/${c.courses?.id}/certificate`}
                  className="flex items-center justify-between py-5 group"
                >
                  <div>
                    <p className="text-base font-medium group-hover:text-cobalt transition-colors">
                      {c.courses?.title}
                    </p>
                    <p className="text-xs text-ink-faint mt-1">
                      Issued {new Date(c.issued_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm text-ink-faint group-hover:text-cobalt transition-colors">View →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
