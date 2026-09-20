import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const A_LEVEL_TARGET = new Date("2027-08-12T00:00:00+05:30");

function getDaysRemaining() {
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const target = new Date(
    A_LEVEL_TARGET.getFullYear(),
    A_LEVEL_TARGET.getMonth(),
    A_LEVEL_TARGET.getDate(),
  );

  return Math.max(
    0,
    Math.ceil((target.getTime() - startOfToday.getTime()) / 86_400_000),
  );
}

export default async function Home() {
  const supabase = await createClient();

  const [{ count: subjectCount }, { data: activeVersion }] = await Promise.all([
    supabase.from("subjects").select("*", { count: "exact", head: true }),
    supabase
      .from("syllabus_versions")
      .select("id, name")
      .eq("code", "GCE_AL_2017")
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  let unitCount = 0;
  if (activeVersion?.id) {
    const { count } = await supabase
      .from("syllabus_units")
      .select("*", { count: "exact", head: true })
      .eq("syllabus_version_id", activeVersion.id);
    unitCount = count ?? 0;
  }

  const daysRemaining = getDaysRemaining();
  const subjectTotal = subjectCount ?? 0;

  return (
    <div>
      <section className="min-h-[calc(100vh-72px)] flex items-center border-b border-rule">
        <div className="max-w-7xl w-full mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-14 lg:gap-20 items-center">
            <div>
              <p className="section-label mb-6">Sri Lankan A/L learning platform</p>
              <h1 className="text-[3.5rem] sm:text-[4.5rem] lg:text-[5.8rem] leading-[0.94] tracking-[-0.055em] font-semibold text-ink max-w-4xl">
                Study with a plan.
                <br />
                <span className="text-cobalt">Improve with proof.</span>
              </h1>
              <p className="text-lg sm:text-xl text-ink-soft leading-relaxed max-w-2xl mt-8">
                Skill Note connects your syllabus, lessons, practice, mock exams,
                revision and performance into one learning loop built for
                G.C.E. Advanced Level students.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-10">
                <Link
                  href="/signup"
                  className="btn-primary px-7 py-3.5 rounded-full font-medium text-sm"
                >
                  Start studying
                </Link>
                <Link
                  href="/subjects"
                  className="px-6 py-3.5 rounded-full border border-rule text-sm font-medium hover:border-ink transition-colors"
                >
                  Explore the syllabus
                </Link>
              </div>

              <div className="grid grid-cols-3 max-w-xl mt-14 border-t border-rule pt-6">
                <div>
                  <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-ink">
                    {subjectTotal}
                  </p>
                  <p className="text-xs text-ink-faint mt-1">subjects</p>
                </div>
                <div className="border-l border-rule pl-5">
                  <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-ink">
                    {unitCount || "—"}
                  </p>
                  <p className="text-xs text-ink-faint mt-1">syllabus units</p>
                </div>
                <div className="border-l border-rule pl-5">
                  <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-ink">
                    3
                  </p>
                  <p className="text-xs text-ink-faint mt-1">learning media</p>
                </div>
              </div>
            </div>

            <div className="clay p-7 sm:p-9">
              <div className="flex items-start justify-between gap-6 pb-7 border-b border-rule">
                <div>
                  <p className="section-label">Your exam horizon</p>
                  <p className="text-sm text-ink-soft mt-2">G.C.E. A/L 2027</p>
                </div>
                <div className="text-right">
                  <p className="text-[3.25rem] sm:text-[4rem] leading-none font-bold tracking-[-0.06em] text-ink">
                    {daysRemaining}
                  </p>
                  <p className="text-xs text-ink-faint mt-1">days remaining</p>
                </div>
              </div>

              <div className="py-7 space-y-6">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2.5">
                    <span className="text-ink">Syllabus</span>
                    <span className="text-ink-faint">Track every topic</span>
                  </div>
                  <div className="h-1.5 bg-surface-soft rounded-full overflow-hidden">
                    <div className="h-full bg-cobalt w-[78%]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2.5">
                    <span className="text-ink">Practice</span>
                    <span className="text-ink-faint">Find weak areas</span>
                  </div>
                  <div className="h-1.5 bg-surface-soft rounded-full overflow-hidden">
                    <div className="h-full bg-cobalt w-[61%]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2.5">
                    <span className="text-ink">Revision</span>
                    <span className="text-ink-faint">Return when due</span>
                  </div>
                  <div className="h-1.5 bg-surface-soft rounded-full overflow-hidden">
                    <div className="h-full bg-cobalt w-[46%]" />
                  </div>
                </div>
              </div>

              <div className="border-t border-rule pt-5">
                <p className="text-xs leading-relaxed text-ink-faint">
                  The dashboard is designed to turn your actual attempts into
                  the next useful study action.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-24">
          <div className="max-w-2xl mb-14">
            <p className="section-label mb-4">The learning loop</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.04em] text-ink">
              Everything follows what you actually need to learn.
            </h2>
            <p className="text-ink-soft leading-relaxed mt-5">
              Instead of treating a syllabus as a checklist, Skill Note links
              each stage of learning so your progress becomes useful data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 border-t border-rule">
            {[
              ["01", "Syllabus", "Know every unit, topic and learning outcome that matters for your subjects."],
              ["02", "Practice", "Answer questions by subject, topic, difficulty and exam context."],
              ["03", "Measure", "See accuracy, mastery, time and repeated mistakes instead of one vague score."],
              ["04", "Revise", "Use weak areas, due topics and study planning to decide what comes next."],
            ].map(([number, title, body]) => (
              <div key={number} className="py-7 pr-7 border-b md:border-b-0 md:border-r border-rule last:border-r-0">
                <p className="text-xs text-cobalt font-semibold">{number}</p>
                <h3 className="text-xl font-semibold text-ink mt-5">{title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed mt-3 max-w-xs">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-24">
          <div className="grid lg:grid-cols-[0.75fr_1.25fr] gap-14">
            <div>
              <p className="section-label mb-4">Built for A/L</p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.04em] text-ink">
                More than a course platform.
              </h2>
              <p className="text-ink-soft leading-relaxed mt-5">
                Skill Note is structured around the way A/L preparation actually
                works: syllabus coverage, repeated practice, timed papers,
                targeted revision and measurable improvement.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 border-t border-rule">
              {[
                ["Syllabus tracking", "Mark topics as not started, in progress, completed or needing revision."],
                ["Adaptive practice", "Practice can focus on weak and due learning outcomes rather than random questions."],
                ["Mock exams", "Work through timed assessments with answer validation and performance records."],
                ["Study planner", "Turn weak topics and recommendations into planned study sessions."],
                ["Skill insights", "See where accuracy is slipping and what to work on next."],
                ["Multilingual foundation", "English, Sinhala and Tamil content can coexist with published translations and fallback."],
                ["Teacher workspace", "Courses, lessons, questions, exams, assignments and student performance."],
                ["Certificates", "Complete eligible learning and provide a public verification path for certificates."],
              ].map(([title, body]) => (
                <div key={title} className="py-6 sm:pr-8 border-b border-rule">
                  <h3 className="font-semibold text-ink">{title}</h3>
                  <p className="text-sm text-ink-soft leading-relaxed mt-2">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-24">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12">
            <div className="max-w-2xl">
              <p className="section-label mb-4">Your study workspace</p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.04em] text-ink">
                One place from first lesson to final mock.
              </h2>
            </div>
            <Link
              href="/subjects"
              className="text-sm font-medium text-ink border-b border-ink pb-1 w-fit"
            >
              Browse subjects →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-rule border border-rule">
            {[
              ["Learn", "Courses, modules and lessons", "Build understanding before you measure it."],
              ["Practice", "Question bank and topic practice", "Turn each attempt into evidence about your current level."],
              ["Perform", "Mocks, insights and certificates", "Measure improvement under realistic conditions and keep a record of progress."],
            ].map(([title, subtitle, body]) => (
              <div key={title} className="bg-background p-7 lg:p-9">
                <p className="section-label">{title}</p>
                <h3 className="text-xl font-semibold text-ink mt-5">{subtitle}</h3>
                <p className="text-sm text-ink-soft leading-relaxed mt-3">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-5xl mx-auto px-6 py-24 lg:py-32 text-center">
          <p className="section-label mb-5">Start with your syllabus</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.05em] leading-[0.98] text-ink">
            Know what to study.
            <br />
            Know why you are studying it.
          </h2>
          <p className="text-ink-soft leading-relaxed max-w-xl mx-auto mt-6">
            Set up your subjects, follow the syllabus, practise deliberately and
            let your performance shape what you revise next.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-9">
            <Link
              href="/signup"
              className="btn-primary px-7 py-3.5 rounded-full font-medium text-sm"
            >
              Create your account
            </Link>
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-full border border-rule text-sm font-medium hover:border-ink transition-colors"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
