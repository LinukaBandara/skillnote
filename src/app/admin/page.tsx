import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/dashboard/AppShell";

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();
  const { count: courseCount } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true })
    .eq("institute_id", profile.institute_id ?? "");
  const { count: questionCount } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });
  const { count: examCount } = await supabase
    .from("mock_exams")
    .select("*", { count: "exact", head: true });

  return (
    <AppShell activeHref="/admin" isStaff showInstitutes={profile.role !== "teacher"}>
      <div className="max-w-xl px-6 md:px-8 py-10">
        <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-1">Admin</h1>
        <p className="text-ink-soft mb-10 text-sm capitalize">{profile.role.replace("_", " ")}</p>

        <ul className="border-t border-rule">
          <li className="border-b border-rule">
            <Link href="/admin/courses" className="flex items-center justify-between py-5 group">
              <div>
                <h2 className="text-base font-medium group-hover:text-cobalt transition-colors">Courses</h2>
                <p className="text-sm text-ink-soft mt-1">{courseCount ?? 0} course{courseCount === 1 ? "" : "s"}</p>
              </div>
              <span className="text-sm text-ink-faint group-hover:text-cobalt transition-colors">Manage</span>
            </Link>
          </li>
          <li className="border-b border-rule">
            <Link href="/admin/questions" className="flex items-center justify-between py-5 group">
              <div>
                <h2 className="text-base font-medium group-hover:text-cobalt transition-colors">Question bank</h2>
                <p className="text-sm text-ink-soft mt-1">{questionCount ?? 0} question{questionCount === 1 ? "" : "s"}</p>
              </div>
              <span className="text-sm text-ink-faint group-hover:text-cobalt transition-colors">Manage</span>
            </Link>
          </li>
          <li className="border-b border-rule">
            <Link href="/admin/mock-exams" className="flex items-center justify-between py-5 group">
              <div>
                <h2 className="text-base font-medium group-hover:text-cobalt transition-colors">Mock exams</h2>
                <p className="text-sm text-ink-soft mt-1">{examCount ?? 0} exam{examCount === 1 ? "" : "s"}</p>
              </div>
              <span className="text-sm text-ink-faint group-hover:text-cobalt transition-colors">Manage</span>
            </Link>
          </li>
          <li className="border-b border-rule">
            <Link href="/admin/students" className="flex items-center justify-between py-5 group">
              <div>
                <h2 className="text-base font-medium group-hover:text-cobalt transition-colors">Students</h2>
                <p className="text-sm text-ink-soft mt-1">Performance and activity overview</p>
              </div>
              <span className="text-sm text-ink-faint group-hover:text-cobalt transition-colors">View</span>
            </Link>
          </li>
        </ul>
      </div>
    </AppShell>
  );
}
