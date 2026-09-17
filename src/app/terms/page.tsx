import Link from "next/link";

export const metadata = { title: "Terms of Service — Skill Note" };

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-2">Terms of Service</h1>
      <p className="text-ink-faint text-xs mb-10">Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

      <div className="space-y-7 text-sm text-ink-soft leading-relaxed">
        <section>
          <h2 className="section-label mb-2">Using Skill Note</h2>
          <p>
            Skill Note is a study platform for Sri Lankan G.C.E. Advanced Level students. You are
            responsible for keeping your account credentials secure and for the activity that happens
            under your account.
          </p>
        </section>

        <section>
          <h2 className="section-label mb-2">Educational content</h2>
          <p>
            Course material, questions, and mock examinations on Skill Note are created by teachers,
            institutes, or Skill Note itself. They are study aids. Skill Note is not affiliated with the
            Department of Examinations of Sri Lanka, and content on the platform is not official
            examination material unless explicitly stated and licensed as such.
          </p>
        </section>

        <section>
          <h2 className="section-label mb-2">No guarantee of results</h2>
          <p>
            Mastery scores, readiness indicators, and study recommendations are calculated from your own
            activity on the platform. They are intended to guide your revision. They do not predict or
            guarantee your actual examination results.
          </p>
        </section>

        <section>
          <h2 className="section-label mb-2">Content you submit</h2>
          <p>
            You retain ownership of assignments and discussion posts you submit. You grant Skill Note and
            your institute permission to store and display that content as needed to operate the service.
            Do not upload content you do not have the right to share.
          </p>
        </section>

        <section>
          <h2 className="section-label mb-2">Acceptable use</h2>
          <p>
            Do not share account access, attempt to access other users&rsquo; data, upload harmful files,
            or post abusive content in discussions. Institutes may remove access for misuse.
          </p>
        </section>

        <section>
          <h2 className="section-label mb-2">Availability</h2>
          <p>
            We aim to keep Skill Note available and accurate, but the service is provided as-is. Features
            may change as the platform develops.
          </p>
        </section>

        <section>
          <h2 className="section-label mb-2">Contact</h2>
          <p>Questions about these terms: support@skillnote.lk</p>
        </section>
      </div>

      <Link href="/" className="text-sm text-ink-soft hover:text-ink mt-12 inline-block">
        ← Back to Skill Note
      </Link>
    </div>
  );
}
