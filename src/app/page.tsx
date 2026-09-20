import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const features = [
  {
    number: "01",
    title: "Track the syllabus",
    text: "Turn the full A/L syllabus into a living checklist. See every unit, topic and learning outcome move from not started to mastered.",
    tag: "Syllabus",
  },
  {
    number: "02",
    title: "Practice with purpose",
    text: "Practice questions are connected to your progress, so weak areas get attention instead of another round of questions you already know.",
    tag: "Practice",
  },
  {
    number: "03",
    title: "Know your weak points",
    text: "Skill Insights turns attempts into a clear picture of accuracy, mastery, developing skills and topics that need revision.",
    tag: "Insights",
  },
  {
    number: "04",
    title: "Prepare with mock exams",
    text: "Use timed mock exams to test your readiness, review answers and understand where your marks are being lost.",
    tag: "Exams",
  },
];

const streams = [
  ["SCI", "Science", "Physics · Chemistry · Biology · Combined Mathematics"],
  ["COM", "Commerce", "Accounting · Business Studies · Economics"],
  ["ART", "Arts", "Languages · History · Geography · Arts subjects"],
  ["TEC", "Technology", "Engineering Technology · Science for Technology · ICT"],
];

export default async function Home() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("subjects")
    .select("*", { count: "exact", head: true });

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(circle_at_72%_24%,rgba(108,126,240,0.18),transparent_34%),radial-gradient(circle_at_15%_20%,rgba(139,127,232,0.10),transparent_28%)]" />
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="grid lg:grid-cols-[1fr_0.9fr] gap-14 lg:gap-20 items-center">
            <div>
              <div className="section-label mb-5">G.C.E. Advanced Level · Sri Lanka</div>
              <h1 className="text-[3.4rem] sm:text-[4.5rem] lg:text-[5.2rem] leading-[0.98] font-semibold tracking-[-0.055em] text-ink">
                Study less
                <br />
                <span className="text-cobalt">blindly.</span>
                <br />
                Know what&apos;s next.
              </h1>
              <p className="mt-7 max-w-xl text-base md:text-lg leading-8 text-ink-soft">
                Skill Note brings your syllabus, practice, mock exams and
                learning progress into one place — built around the way
                Sri Lankan A/L students actually prepare.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href="/signup" className="btn-primary px-7 py-3.5 rounded-full font-medium text-sm">
                  Start studying
                </Link>
                <Link href="/subjects" className="btn-outline px-7 py-3.5 rounded-full font-medium text-sm">
                  Explore subjects
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-faint">
                <span>✓ Syllabus tracking</span>
                <span>✓ Adaptive practice</span>
                <span>✓ Mock exams</span>
                <span>✓ Skill insights</span>
              </div>
            </div>

            {/* Product preview */}
            <div className="relative">
              <div className="absolute -inset-5 rounded-[32px] bg-cobalt/5 blur-2xl" />
              <div className="clay relative p-4 sm:p-6">
                <div className="flex items-center justify-between px-2 pb-5">
                  <div>
                    <div className="text-xs text-ink-faint">MY PROGRESS</div>
                    <div className="text-lg font-semibold mt-1">Study overview</div>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-bg-warm flex items-center justify-center text-xs font-semibold text-cobalt">SN</div>
                </div>
                <div className="clay-inset p-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs text-ink-faint">Overall mastery</div>
                      <div className="text-4xl font-semibold tracking-[-0.04em] mt-1">72%</div>
                    </div>
                    <div className="text-xs font-medium text-sage">+8.4% this month</div>
                  </div>
                  <div className="mt-5 h-2 rounded-full bg-white overflow-hidden">
                    <div className="h-full rounded-full bg-cobalt w-[72%]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-cobalt text-white rounded-2xl p-5">
                    <div className="text-[10px] uppercase tracking-widest opacity-70">Practice</div>
                    <div className="text-3xl font-semibold mt-3">84%</div>
                    <div className="text-xs opacity-70 mt-1">recent accuracy</div>
                  </div>
                  <div className="bg-white border border-rule rounded-2xl p-5">
                    <div className="text-[10px] uppercase tracking-widest text-ink-faint">Revision</div>
                    <div className="text-3xl font-semibold mt-3">12</div>
                    <div className="text-xs text-ink-soft mt-1">topics due</div>
                  </div>
                </div>
                <div className="bg-white border border-rule rounded-2xl mt-3 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold">Today&apos;s focus</span>
                    <span className="text-[11px] text-cobalt">View plan →</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="h-7 w-7 rounded-lg bg-cobalt/10 text-cobalt text-[10px] font-bold flex items-center justify-center">01</span>
                      <div className="flex-1">
                        <div className="text-xs font-medium">Electrochemistry</div>
                        <div className="highlight-bar mt-1.5" style={{ ["--pct" as string]: "42%" }} />
                      </div>
                      <span className="text-[10px] text-ink-faint">Revise</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-7 w-7 rounded-lg bg-lilac/10 text-lilac text-[10px] font-bold flex items-center justify-center">02</span>
                      <div className="flex-1">
                        <div className="text-xs font-medium">Functions</div>
                        <div className="highlight-bar mt-1.5" style={{ ["--pct" as string]: "68%" }} />
                      </div>
                      <span className="text-[10px] text-ink-faint">Practice</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block absolute -right-8 -bottom-7 clay px-5 py-4 w-48">
                <div className="text-[10px] uppercase tracking-widest text-ink-faint">Readiness</div>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-2xl font-semibold">68%</span>
                  <span className="text-xs text-cobalt font-medium">Building</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Positioning */}
      <section className="border-y border-rule bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">One learning system.</span> From your first topic to your next mock exam.
          </p>
          <div className="text-xs text-ink-faint">
            {count ?? 0} subject{count === 1 ? "" : "s"} available in the platform
          </div>
        </div>
      </section>

      {/* What Skill Note does */}
      <section className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        <div className="max-w-2xl">
          <div className="section-label mb-4">The learning loop</div>
          <h2 className="text-3xl md:text-5xl leading-tight">
            Your preparation should get smarter as you study.
          </h2>
          <p className="mt-5 text-ink-soft leading-7">
            Skill Note connects what you learn with what you practise and what
            you get wrong. Every attempt can make the next recommendation more
            useful.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mt-14">
          {features.map((feature) => (
            <div key={feature.number} className="clay p-7 md:p-9 group">
              <div className="flex items-start justify-between gap-5">
                <span className="text-xs text-ink-faint font-medium">{feature.number}</span>
                <span className="rounded-full bg-bg-warm px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                  {feature.tag}
                </span>
              </div>
              <h3 className="text-2xl mt-12">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-soft max-w-lg">{feature.text}</p>
              <div className="mt-7 h-px bg-rule group-hover:bg-cobalt/30 transition-colors" />
            </div>
          ))}
        </div>
      </section>

      {/* Syllabus visual */}
      <section className="bg-surface border-y border-rule">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-14 lg:gap-24 items-center">
            <div>
              <div className="section-label mb-4">01 · Syllabus tracker</div>
              <h2 className="text-3xl md:text-5xl leading-[1.05]">
                Stop guessing how much of the syllabus is actually done.
              </h2>
              <p className="mt-6 text-ink-soft leading-7">
                Break subjects down into units, topics and learning outcomes.
                Mark what you have completed, what needs revision and what still
                needs work.
              </p>
              <Link href="/subjects" className="inline-flex mt-8 text-sm font-medium text-cobalt">
                Browse the syllabus <span className="ml-2">→</span>
              </Link>
            </div>

            <div className="clay p-5 sm:p-7">
              <div className="flex items-center justify-between border-b border-rule pb-5">
                <div>
                  <div className="text-xs text-ink-faint">CHEMISTRY</div>
                  <div className="font-semibold mt-1">Syllabus progress</div>
                </div>
                <span className="text-2xl font-semibold">64%</span>
              </div>
              <div className="mt-6 space-y-5">
                {[
                  ["01", "Atomic Structure", "Completed", "100%"],
                  ["02", "Chemical Bonding", "Completed", "92%"],
                  ["03", "Chemical Energetics", "In progress", "58%"],
                  ["04", "Electrochemistry", "Needs revision", "41%"],
                ].map(([no, title, status, pct]) => (
                  <div key={no} className="flex items-center gap-4">
                    <span className="text-[10px] text-ink-faint w-5">{no}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-3 text-xs mb-2">
                        <span className="font-medium truncate">{title}</span>
                        <span className="text-ink-faint">{pct}</span>
                      </div>
                      <div className="highlight-bar" style={{ ["--pct" as string]: pct }} />
                    </div>
                    <span className="hidden sm:block text-[10px] text-ink-faint w-24 text-right">{status}</span>
                  </div>
                ))}
              </div>
              <div className="clay-inset mt-7 p-4 flex items-center justify-between">
                <span className="text-xs text-ink-soft">12 outcomes need revision</span>
                <span className="text-xs font-medium text-cobalt">Review →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Practice + intelligence */}
      <section className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center max-w-2xl mx-auto">
          <div className="section-label mb-4">02 · Practice engine</div>
          <h2 className="text-3xl md:text-5xl leading-tight">Practise the things that need you.</h2>
          <p className="mt-5 text-ink-soft leading-7">
            Your question history becomes useful data. Skill Note can identify
            weak and developing outcomes and use them to shape your practice.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 mt-14">
          <div className="gradient-card-1 p-7 min-h-[270px] flex flex-col justify-between">
            <div>
              <div className="text-xs opacity-65">ADAPTIVE QUEUE</div>
              <div className="text-3xl font-semibold mt-8">Next 10</div>
              <p className="text-sm leading-6 opacity-75 mt-2">Questions selected around your current mastery.</p>
            </div>
            <div className="text-xs opacity-65">Weak → Developing → Mastered</div>
          </div>
          <div className="gradient-card-2 p-7 min-h-[270px] flex flex-col justify-between">
            <div>
              <div className="text-xs opacity-65">QUESTION BANK</div>
              <div className="text-3xl font-semibold mt-8">Topic × Year</div>
              <p className="text-sm leading-6 opacity-75 mt-2">Build focused practice by subject, topic, year and difficulty.</p>
            </div>
            <div className="text-xs opacity-65">Every attempt is remembered</div>
          </div>
          <div className="gradient-card-3 p-7 min-h-[270px] flex flex-col justify-between">
            <div>
              <div className="text-xs opacity-65">PERFORMANCE</div>
              <div className="text-3xl font-semibold mt-8">84% accuracy</div>
              <p className="text-sm leading-6 opacity-75 mt-2">See what is improving and where marks are still slipping.</p>
            </div>
            <div className="text-xs opacity-65">Based on your actual attempts</div>
          </div>
        </div>
      </section>

      {/* Mock readiness */}
      <section className="bg-ink text-white">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-14 lg:gap-24 items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-45">03 · Mock readiness</div>
              <h2 className="text-3xl md:text-5xl leading-[1.05] mt-5 text-white">
                Don&apos;t wait for exam day to find your gaps.
              </h2>
              <p className="mt-6 text-sm md:text-base leading-7 opacity-65 max-w-lg">
                Readiness combines syllabus coverage, mastery, recent practice
                accuracy and revision status into one understandable signal.
              </p>
              <Link href="/skill-insights" className="inline-flex mt-8 rounded-full bg-white text-ink px-6 py-3 text-sm font-medium">
                View Skill Insights
              </Link>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-6 sm:p-8">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xs opacity-45 uppercase tracking-widest">Mock readiness</div>
                  <div className="text-6xl font-semibold tracking-[-0.05em] mt-2">68<span className="text-2xl opacity-40">%</span></div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/80">Building</div>
                  <div className="text-[11px] text-white/40 mt-1">Keep strengthening gaps</div>
                </div>
              </div>
              <div className="mt-7 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-white/80 w-[68%]" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">
                {[
                  ["Coverage", "74%"],
                  ["Mastery", "63%"],
                  ["Accuracy", "81%"],
                  ["Revision", "55%"],
                ].map(([label, value]) => (
                  <div key={label} className="border border-white/10 rounded-2xl p-4">
                    <div className="text-[10px] uppercase tracking-wider text-white/35">{label}</div>
                    <div className="text-lg font-semibold mt-2">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Study plan + certificate */}
      <section className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="clay p-7 md:p-9">
            <div className="section-label">04 · Study plan</div>
            <h2 className="text-3xl mt-5">A revision list that reacts to your progress.</h2>
            <p className="text-sm text-ink-soft leading-6 mt-4">
              Turn weak outcomes and revision flags into practical next steps.
              Keep the plan focused instead of trying to revise everything at once.
            </p>
            <div className="mt-8 space-y-3">
              {[
                ["Revise", "Electrochemistry", "High priority"],
                ["Practice", "Differentiation", "Medium priority"],
                ["Review", "Organic reactions", "Due today"],
              ].map(([type, topic, priority]) => (
                <div key={topic} className="flex items-center gap-3 rounded-xl bg-bg-warm p-3.5">
                  <span className="text-[9px] uppercase font-semibold tracking-wider text-cobalt w-12">{type}</span>
                  <span className="text-xs font-medium flex-1">{topic}</span>
                  <span className="text-[10px] text-ink-faint">{priority}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="clay p-7 md:p-9">
            <div className="section-label">05 · Progress you can prove</div>
            <h2 className="text-3xl mt-5">Finish a course. Earn a certificate.</h2>
            <p className="text-sm text-ink-soft leading-6 mt-4">
              Completed learning can lead to a certificate with a public
              verification flow, making achievements easier to validate.
            </p>
            <div className="mt-8 rounded-2xl border border-rule bg-surface p-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.16em] text-ink-faint">SKILL NOTE</div>
                  <div className="font-semibold mt-3">Course completion</div>
                  <div className="text-xs text-ink-soft mt-1">Advanced Level Chemistry</div>
                </div>
                <div className="h-10 w-10 rounded-full bg-cobalt/10 text-cobalt flex items-center justify-center text-xs font-bold">✓</div>
              </div>
              <div className="mt-7 flex items-center justify-between text-[10px] text-ink-faint">
                <span>Verified achievement</span>
                <span>SN-AL-2048</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Streams */}
      <section className="bg-surface border-y border-rule">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="section-label mb-4">Built for A/L</div>
              <h2 className="text-3xl md:text-5xl">Your stream. Your subjects. Your pace.</h2>
            </div>
            <Link href="/subjects" className="text-sm font-medium text-cobalt whitespace-nowrap">See all subjects →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {streams.map(([code, name, subjects]) => (
              <div key={code} className="clay p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cobalt">{code}</span>
                  <span className="text-[10px] text-ink-faint">A/L</span>
                </div>
                <h3 className="text-xl mt-10">{name}</h3>
                <p className="text-xs text-ink-soft leading-5 mt-2">{subjects}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform */}
      <section className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center max-w-2xl mx-auto">
          <div className="section-label mb-4">More than practice</div>
          <h2 className="text-3xl md:text-5xl">A complete learning platform.</h2>
          <p className="mt-5 text-ink-soft leading-7">
            Students get the learning workflow. Teachers and institutes get the
            tools to organise, monitor and support it.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-14">
          {[
            ["For students", "Learn, practise, track progress, take mocks, follow a study plan and understand your performance."],
            ["For teachers", "Manage learning content, questions, assignments and student progress from one place."],
            ["For institutes", "Organise subjects, courses and learners with role-based administration and oversight."],
          ].map(([title, text], i) => (
            <div key={title} className="clay p-7">
              <div className="h-9 w-9 rounded-xl bg-bg-warm flex items-center justify-center text-xs font-bold text-cobalt">0{i + 1}</div>
              <h3 className="text-xl mt-8">{title}</h3>
              <p className="text-sm text-ink-soft leading-6 mt-3">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Language / community strip */}
      <section className="border-t border-rule">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <div className="section-label mb-3">Made for Sri Lanka</div>
            <h2 className="text-2xl md:text-3xl">Learn in the language that works for you.</h2>
            <p className="text-sm text-ink-soft mt-3 max-w-2xl leading-6">
              Skill Note is designed with English, Sinhala and Tamil learning
              experiences in mind, alongside discussions, assignments and course content.
            </p>
          </div>
          <div className="flex gap-2">
            {["EN", "සිං", "த"].map((language) => (
              <span key={language} className="h-11 min-w-11 px-3 rounded-full border border-rule bg-surface flex items-center justify-center text-xs font-semibold text-ink">
                {language}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        <div className="relative overflow-hidden rounded-[30px] bg-cobalt text-white p-8 sm:p-12 md:p-16">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-20 -bottom-28 h-64 w-64 rounded-full bg-lilac/30 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">Ready when you are</div>
            <h2 className="text-4xl md:text-6xl leading-[1] tracking-[-0.05em] mt-5 text-white">
              Make your next study session count.
            </h2>
            <p className="text-sm md:text-base leading-7 text-white/70 mt-6 max-w-xl">
              Start with your subjects. Build your progress. Let Skill Note show
              you where to focus next.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="rounded-full bg-white text-ink px-7 py-3.5 text-sm font-semibold">
                Create your account
              </Link>
              <Link href="/subjects" className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-medium text-white">
                Browse subjects
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
