import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { notFound } from "next/navigation";
import Link from "next/link";
import { addComment } from "../../../actions";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ courseId: string; threadId: string }>;
}) {
  const { courseId, threadId } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: thread } = await supabase
    .from("discussion_threads")
    .select("*, profiles(full_name)")
    .eq("id", threadId)
    .single();
  if (!thread) notFound();

  const { data: comments } = await supabase
    .from("discussion_comments")
    .select("*, profiles(full_name)")
    .eq("thread_id", threadId)
    .order("created_at");

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link href={`/courses/${courseId}/discussions`} className="text-sm text-ink-soft hover:text-ink">
        ← Discussions
      </Link>

      <h1 className="stat-serif text-4xl mt-6 mb-1">{thread.title}</h1>
      <p className="text-xs text-ink-faint mb-10">{thread.profiles?.full_name ?? "Student"}</p>

      <div className="space-y-6 mb-10">
        {(comments ?? []).map((c) => (
          <div key={c.id} className="border-b border-rule pb-6">
            <p className="text-sm">{c.content}</p>
            <p className="text-xs text-ink-faint mt-2">{c.profiles?.full_name ?? "Student"}</p>
          </div>
        ))}
      </div>

      {profile && (
        <form
          action={async (formData: FormData) => {
            "use server";
            const content = formData.get("content") as string;
            await addComment(threadId, courseId, content);
          }}
          className="space-y-3"
        >
          <textarea
            name="content"
            placeholder="Write a reply"
            rows={3}
            required
            className="w-full border-b border-rule bg-transparent py-2 text-sm focus:outline-none focus:border-cobalt resize-none"
          />
          <button type="submit" className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">
            Reply
          </button>
        </form>
      )}
    </div>
  );
}
