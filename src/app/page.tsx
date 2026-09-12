import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("subjects")
    .select("*", { count: "exact", head: true });

  return (
    <div>
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
          <div>
            <h1 className="text-[3.25rem] leading-[1.05] font-semibold mb-7 text-ink">
              Know exactly
              <br />
              what to study next.
            </h1>
            <p className="text-lg text-ink-soft leading-relaxed mb-10 max-w-md">
              Skill Note tracks your G.C.E. Advanced Level syllabus, past-paper
              practice, and weak topics, then tells you what to revise before
              your next exam.
            </p>
            <div className="flex items-center gap-5">
              <Link
                href="/signup"
                className="btn-primary px-6 py-3 rounded-full font-medium text-sm"
              >
                Start studying
              </Link>
              <Link
                href="/subjects"
                className="text-sm text-ink-soft hover:text-ink transition-colors border-b border-rule hover:border-ink pb-0.5"
              >
                Browse {count ?? 0} subject{count === 1 ? "" : "s"}
              </Link>
            </div>
          </div>

          <div className="clay p-8">
            <div className="flex items-baseline justify-between mb-8 pb-6 border-b border-rule">
              <span className="text-sm text-ink-soft">G.C.E. A/L 2027</span>
              <span className="stat-serif text-4xl text-ink">326<span className="text-base font-sans not-italic text-ink-soft ml-1">days</span></span>
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-ink">Combined Mathematics</span>
                  <span className="text-ink-faint">72%</span>
                </div>
                <div className="highlight-bar" style={{ ["--pct" as string]: "72%" }} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-ink">Physics</span>
                  <span className="text-ink-faint">54%</span>
                </div>
                <div className="highlight-bar" style={{ ["--pct" as string]: "54%" }} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-ink">Chemistry</span>
                  <span className="text-ink-faint">88%</span>
                </div>
                <div className="highlight-bar" style={{ ["--pct" as string]: "88%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-rule">
        <div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-12">
          <div>
            <h3 className="stat-serif text-3xl text-ink mb-3">Syllabus tracker</h3>
            <p className="text-ink-soft text-sm leading-relaxed max-w-[26ch]">
              Every unit and topic in your stream, with a clear status: not
              started, in progress, completed, or needs revision.
            </p>
          </div>
          <div>
            <h3 className="stat-serif text-3xl text-ink mb-3">Past papers</h3>
            <p className="text-ink-soft text-sm leading-relaxed max-w-[26ch]">
              Filter by subject, year, and topic. Every attempt is recorded so
              you can see where marks are actually being lost.
            </p>
          </div>
          <div>
            <h3 className="stat-serif text-3xl text-ink mb-3">Skill insight</h3>
            <p className="text-ink-soft text-sm leading-relaxed max-w-[26ch]">
              A short, honest note on what&rsquo;s slipping and what to revise
              next, based on your actual quiz and practice history.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
