import Link from "next/link";

export const metadata = { title: "Privacy Policy — Skill Note" };

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-2">Privacy Policy</h1>
      <p className="text-ink-faint text-xs mb-10">Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

      <div className="space-y-7 text-sm text-ink-soft leading-relaxed">
        <section>
          <h2 className="section-label mb-2">What we collect</h2>
          <p>
            When you create a Skill Note account we store your name, email address, chosen A/L
            examination year, medium of instruction, and selected subjects. As you use the platform we
            also record your learning activity: topic statuses, practice answers, quiz and mock exam
            attempts, assignment submissions, study plan entries, and discussion posts.
          </p>
        </section>

        <section>
          <h2 className="section-label mb-2">How we use it</h2>
          <p>
            Your activity data is used to show your own progress, calculate topic mastery, schedule
            revision, and generate study recommendations. If you belong to a tuition institute, teachers
            and administrators of <em>that institute only</em> can see your performance data so they can
            support your learning.
          </p>
        </section>

        <section>
          <h2 className="section-label mb-2">Students under 18</h2>
          <p>
            Skill Note is intended for G.C.E. Advanced Level students, many of whom are under 18. We
            collect only what is needed to run the service. We do not sell personal data, and we do not
            show advertising. If you are under 18, please review this policy with a parent or guardian.
          </p>
        </section>

        <section>
          <h2 className="section-label mb-2">Who can see your data</h2>
          <p>
            Other students cannot see your grades, practice results, or mastery scores. Discussion posts
            you write are visible to others enrolled in the same course. Certificates you earn can be
            verified publicly by certificate code, which shows your name, the course, and the issue date.
          </p>
        </section>

        <section>
          <h2 className="section-label mb-2">Storage and security</h2>
          <p>
            Data is stored using Supabase (PostgreSQL) with row-level security policies that restrict
            access by account and institute. Files you upload for assignments are stored privately and are
            accessible only to you and your institute&rsquo;s teaching staff.
          </p>
        </section>

        <section>
          <h2 className="section-label mb-2">Your choices</h2>
          <p>
            You can edit your subjects and profile details at any time from Settings. To request a copy of
            your data or deletion of your account, contact us at the address below.
          </p>
        </section>

        <section>
          <h2 className="section-label mb-2">Contact</h2>
          <p>Questions about this policy: support@skillnote.lk</p>
        </section>
      </div>

      <Link href="/" className="text-sm text-ink-soft hover:text-ink mt-12 inline-block">
        ← Back to Skill Note
      </Link>
    </div>
  );
}
