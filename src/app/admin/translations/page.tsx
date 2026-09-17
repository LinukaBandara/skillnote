import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { createClient } from "@/lib/supabase/server";
import { deleteTranslation, saveTranslation } from "./actions";

const LANGUAGES = [
  { code: "si", label: "සිංහල" },
  { code: "ta", label: "தமிழ்" },
] as const;

const CONTENT = [
  ["Syllabus units", "syllabus_unit_translations", "unit_id", "syllabus_units"],
  ["Topics", "syllabus_topic_translations", "topic_id", "syllabus_topics"],
  ["Subtopics", "syllabus_subtopic_translations", "subtopic_id", "syllabus_subtopics"],
  ["Learning outcomes", "syllabus_learning_outcome_translations", "learning_outcome_id", "syllabus_learning_outcomes"],
  ["Questions", "question_translations", "question_id", "questions"],
  ["Courses", "course_translations", "course_id", "courses"],
  ["Modules", "module_translations", "module_id", "modules"],
  ["Lessons", "lesson_translations", "lesson_id", "lessons"],
] as const;

export default async function AdminTranslationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();
  const coverage = await Promise.all(
    CONTENT.map(async ([label, translationTable, idColumn, sourceTable]) => {
      const [{ count: total }, { count: si }, { count: ta }] = await Promise.all([
        supabase.from(sourceTable).select("*", { count: "exact", head: true }),
        supabase.from(translationTable).select("*", { count: "exact", head: true }).eq("language_code", "si"),
        supabase.from(translationTable).select("*", { count: "exact", head: true }).eq("language_code", "ta"),
      ]);
      return { label, translationTable, idColumn, sourceTable, total: total ?? 0, si: si ?? 0, ta: ta ?? 0 };
    })
  );

  const { data: topics } = await supabase
    .from("syllabus_topics")
    .select("id,title")
    .order("position")
    .limit(8);
  const topicIds = (topics ?? []).map((topic) => topic.id);
  const { data: topicTranslations } = topicIds.length
    ? await supabase.from("syllabus_topic_translations").select("topic_id,language_code,title").in("topic_id", topicIds)
    : { data: [] };

  const { data: questions } = await supabase
    .from("questions")
    .select("id,question_text")
    .order("created_at", { ascending: false })
    .limit(6);
  const questionIds = (questions ?? []).map((question) => question.id);
  const { data: questionTranslations } = questionIds.length
    ? await supabase.from("question_translations").select("question_id,language_code,question_text,model_answer,explanation").in("question_id", questionIds)
    : { data: [] };

  const getTopicTranslation = (id: string, lang: string) => topicTranslations?.find((item) => item.topic_id === id && item.language_code === lang);
  const getQuestionTranslation = (id: string, lang: string) => questionTranslations?.find((item) => item.question_id === id && item.language_code === lang);

  return (
    <AppShell activeHref="/admin" isStaff showInstitutes={profile.role !== "teacher"}>
      <div className="max-w-6xl px-6 md:px-8 py-10">
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <Link href="/admin" className="text-xs text-ink-faint hover:text-cobalt">← Admin</Link>
            <h1 className="text-[25px] font-semibold tracking-[-0.025em] mt-3">Translation management</h1>
            <p className="text-sm text-ink-soft mt-1">Manage Sinhala and Tamil content without duplicating the academic source records.</p>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-10">
          {coverage.map((item) => (
            <div key={item.translationTable} className="border border-rule rounded-xl p-4 bg-white">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-ink-faint mt-1">{item.total} source records</p>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                {LANGUAGES.map((language) => (
                  <div key={language.code}>
                    <p className="text-ink-faint text-xs">{language.label}</p>
                    <p className="font-medium mt-1">{item.total ? Math.round(((item[language.code] ?? 0) / item.total) * 100) : 0}%</p>
                    <p className="text-xs text-ink-faint">{item[language.code]} translated</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Syllabus topics</h2>
            <p className="text-sm text-ink-soft">Edit the first topic records directly. The same translation model is used for units, subtopics and learning outcomes.</p>
          </div>
          <div className="space-y-4">
            {(topics ?? []).map((topic) => (
              <div key={topic.id} className="border border-rule rounded-xl p-5 bg-white">
                <p className="text-xs text-ink-faint mb-1">English source</p>
                <p className="font-medium mb-4">{topic.title}</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {LANGUAGES.map((language) => {
                    const translation = getTopicTranslation(topic.id, language.code);
                    return (
                      <form key={language.code} action={saveTranslation} className="space-y-2">
                        <input type="hidden" name="table" value="syllabus_topic_translations" />
                        <input type="hidden" name="idColumn" value="topic_id" />
                        <input type="hidden" name="id" value={topic.id} />
                        <input type="hidden" name="language" value={language.code} />
                        <label className="text-xs text-ink-faint">{language.label}</label>
                        <div className="flex gap-2">
                          <input name="title" defaultValue={translation?.title ?? ""} placeholder="Translation" required className="min-w-0 flex-1 border border-rule rounded-lg px-3 py-2 text-sm" />
                          <button className="px-3 py-2 rounded-lg bg-ink text-white text-xs">Save</button>
                        </div>
                        {translation && (
                          <button formAction={deleteTranslation} className="text-xs text-ink-faint hover:text-red-600">Remove translation</button>
                        )}
                      </form>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Question translations</h2>
            <p className="text-sm text-ink-soft">Translate the question text, model answer and explanation. Options can be added through the question translation data model as the authoring UI expands.</p>
          </div>
          <div className="space-y-4">
            {(questions ?? []).map((question) => (
              <div key={question.id} className="border border-rule rounded-xl p-5 bg-white">
                <p className="text-xs text-ink-faint mb-1">English source</p>
                <p className="text-sm leading-6 mb-4">{question.question_text}</p>
                {LANGUAGES.map((language) => {
                  const translation = getQuestionTranslation(question.id, language.code);
                  return (
                    <form key={language.code} action={saveTranslation} className="border-t border-rule pt-4 mt-4 space-y-3">
                      <input type="hidden" name="table" value="question_translations" />
                      <input type="hidden" name="idColumn" value="question_id" />
                      <input type="hidden" name="id" value={question.id} />
                      <input type="hidden" name="language" value={language.code} />
                      <label className="text-xs text-ink-faint">{language.label}</label>
                      <textarea name="question_text" defaultValue={translation?.question_text ?? ""} placeholder="Translated question" required rows={3} className="w-full border border-rule rounded-lg px-3 py-2 text-sm" />
                      <textarea name="model_answer" defaultValue={translation?.model_answer ?? ""} placeholder="Translated model answer" rows={2} className="w-full border border-rule rounded-lg px-3 py-2 text-sm" />
                      <textarea name="explanation" defaultValue={translation?.explanation ?? ""} placeholder="Translated explanation" rows={2} className="w-full border border-rule rounded-lg px-3 py-2 text-sm" />
                      <div className="flex items-center gap-3">
                        <button className="px-3 py-2 rounded-lg bg-ink text-white text-xs">Save {language.label}</button>
                        {translation && <button formAction={deleteTranslation} className="text-xs text-ink-faint hover:text-red-600">Remove</button>}
                      </div>
                    </form>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
