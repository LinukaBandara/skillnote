import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createDiscussionThread } from "../../actions";

export default async function DiscussionsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: course } = await supabase.from("courses").select("id, title").eq("id", courseId).single();
  if (!course) notFound();

  const { data: threads } = await supabase
    .from("discussion_threads")
    .select("*, profiles(full_name)")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link href={`/courses/${courseId}`} className="text-sm text-ink-soft hover:text-ink">
        ← {course.title}
      </Link>
      <h1 className="text-[25px] font-semibold tracking-[-0.025em] mt-6 mb-8">Discussions</h1>

      {profile && (
        <details className="clay p-6 mb-10">
          <summary className="cursor-pointer text-sm font-medium">+ Start a discussion</summary>
          <form
            action={async (formData: FormData) => {
              "use server";
              const title = formData.get("title") as string;
              const content = formData.get("content") as string;
              await createDiscussionThread(courseId, title, content);
            }}
            className="space-y-4 mt-5"
          >
            <input
              name="title"
              placeholder="Question or topic"
              required
              className="field"
            />
            <textarea
              name="content"
              placeholder="Details"
              rows={3}
              required
              className="field resize-none"
            />
            <button type="submit" className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">
              Post
            </button>
          </form>
        </details>
      )}

      {(threads ?? []).length === 0 ? (
        <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
          No discussions yet. Be the first to ask something.
        </p>
      ) : (
        <ul className="border-t border-rule">
          {(threads ?? []).map((t) => (
            <li key={t.id} className="border-b border-rule">
              <Link href={`/courses/${courseId}/discussions/${t.id}`} className="flex items-center justify-between py-4 group">
                <div>
                  <p className="text-sm font-medium group-hover:text-cobalt transition-colors">{t.title}</p>
                  <p className="text-xs text-ink-faint mt-0.5">{t.profiles?.full_name ?? "Student"}</p>
                </div>
                <span className="text-sm text-ink-faint group-hover:text-cobalt transition-colors">View →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
