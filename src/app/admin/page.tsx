import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();
  const { count: courseCount } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true })
    .eq("institute_id", profile.institute_id ?? "");

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="stat-serif text-4xl mb-1">Admin</h1>
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
  );
}
