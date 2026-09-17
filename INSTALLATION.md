# Skill Note — Installation & Setup Guide

Complete guide to running Skill Note locally and deploying it to production.

---

## 1. What Skill Note is built with

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Next.js Server Actions (no separate API server) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + password) |
| File storage | Supabase Storage |
| Hosting | Vercel |

**Important architectural note:** there is no separate backend server to install or run. All backend logic lives in Next.js Server Actions (files marked `"use server"`), and the database, authentication, and file storage are provided by Supabase. When you run the frontend, you are running the whole application.

---

## 2. Prerequisites

Install these before you start:

- **Node.js 20 or newer** — https://nodejs.org (check with `node -v`)
- **npm** — comes bundled with Node
- **Git** — https://git-scm.com
- A **Supabase account** — https://supabase.com (free tier is fine)
- A **Vercel account** — https://vercel.com (free tier is fine)

---

## 3. Running locally

### 3.1 Get the code

```bash
git clone https://github.com/LinukaBandara/skillnote.git
cd skillnote
```

Or unzip the source archive and `cd` into the `skillnote` folder.

### 3.2 Install dependencies

```bash
npm install
```

This installs Next.js, React, Tailwind, and the Supabase client libraries. Takes a minute or two on first run.

### 3.3 Create your environment file

Create a file named `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://driqyqvlqhxvscvpdtck.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Nm0KZ42aTxFplRypdvAQpw_pZXi69SR
```

These are the **publishable** keys for the existing Skill Note Supabase project. They are safe to expose in a browser — row-level security in the database is what actually protects the data.

> **Never** put the Supabase `service_role` key in this file or anywhere in frontend code. It bypasses all security rules.

### 3.4 Start the dev server

```bash
npm run dev
```

Open **http://localhost:3000**. The app should load with the landing page.

### 3.5 Other useful commands

```bash
npm run build    # Production build — run this before pushing to catch type errors
npm run start    # Serve the production build locally
npm run lint     # Check code style
```

---

## 4. Setting up your own Supabase project (optional)

Skip this if you're using the existing project. Do this if you want a separate database (e.g. for a staging environment or a fresh commercial deployment).

### 4.1 Create the project

1. Go to https://supabase.com/dashboard and click **New project**
2. Pick a name, a strong database password, and a region close to Sri Lanka (Singapore / `ap-southeast-1` is a good choice for latency)
3. Wait for it to finish provisioning

### 4.2 Get your keys

In the Supabase dashboard: **Project Settings → API**

- **Project URL** → this is your `NEXT_PUBLIC_SUPABASE_URL`
- **Publishable / anon key** → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Put both in `.env.local`.

### 4.3 Create the database schema

All tables, security policies, and functions were created through migrations. To rebuild them in a fresh project, run the SQL from the **SQL Editor** in the Supabase dashboard, in this order:

1. **Core tables** — `profiles`, `courses`, `modules`, `lessons`, `enrollments`, `lesson_progress`, `quizzes`, `quiz_questions`, `quiz_attempts`, `certificates`, `discussion_threads`, `discussion_comments`
2. **Row-level security** — RLS policies on all of the above, plus the `is_admin()` / `is_teacher_or_above()` / `current_institute_id()` helper functions, plus the `handle_new_user()` trigger that creates a profile row on signup
3. **A/L structure** — `institutes`, `streams`, `subjects`, `student_subjects`, `syllabus_units`, `syllabus_topics`, `topic_progress`
4. **Question bank** — `questions`, `question_attempts`
5. **Mock exams** — `mock_exams`, `mock_exam_questions`, `mock_exam_attempts`, `mock_exam_answers`
6. **Study plan** — `study_plan_items`
7. **Assignments** — `assignments`, `assignment_submissions` (plus the `assignment-files` storage bucket and its policies)
8. **Notifications** — `notifications` table and the `create_notification()` function
9. **Mastery** — `topic_mastery` table and the `update_topic_mastery()` function

> If you need the exact SQL for each of these, ask and I can export them as numbered migration files. Supabase also keeps a full migration history under **Database → Migrations** in the existing project, which you can copy from directly.

### 4.4 Create the storage bucket

**Storage → New bucket**

- Name: `assignment-files`
- Public: **off** (files must stay private)

Then apply the storage policies so students can upload to their own folder and staff can read submissions.

### 4.5 Recommended auth settings

**Authentication → Providers → Email**

- Enable **Confirm email** for production (off is easier for testing)
- Under **Authentication → Policies**, turn on **leaked password protection** (checks against HaveIBeenPwned) — this is currently OFF and should be enabled before launch

---

## 5. Seeding content

A fresh database will have no streams, subjects, or questions. You have two options:

### Option A — Through the UI (recommended)

1. Sign up for an account through the app
2. Promote it to platform admin by running this in the Supabase SQL Editor:
   ```sql
   update public.profiles set role = 'platform_admin' where email = 'your@email.com';
   ```
3. Log out and back in. You now have access to `/admin`, where you can create institutes, courses, questions, and mock exams through the interface.

Note: streams, subjects, and syllabus units/topics currently have no admin UI — those must be inserted via SQL (see Option B).

### Option B — Via SQL

Insert streams (Physical Science, Biological Science, Commerce, Arts, Technology), then subjects linked to those streams, then syllabus units, then topics under each unit. Questions and mock exams can then be created through the admin UI.

---

## 6. Deploying to Vercel

### 6.1 First-time setup

1. Push your code to GitHub
2. Go to https://vercel.com/new and click **Import Git Repository**
3. Select your `skillnote` repo
4. Vercel auto-detects Next.js — leave the build settings as-is
5. **Before deploying**, expand **Environment Variables** and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL      = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-publishable-key
   ```
6. Click **Deploy**

### 6.2 Ongoing deploys

Once connected, every `git push` to `main` automatically triggers a new deployment. No manual step needed.

```bash
git add .
git commit -m "Your change"
git push
```

### 6.3 Adding a custom domain

**Vercel → your project → Settings → Domains → Add**

Enter your domain (e.g. `skillnote.lk`), then update your DNS records at your registrar as Vercel instructs. SSL is issued automatically.

---

## 7. Project structure

```
skillnote/
├── src/
│   ├── app/
│   │   ├── page.tsx                  Landing page
│   │   ├── layout.tsx                Root layout (nav, footer, loading bar)
│   │   ├── globals.css               Design tokens + shared component styles
│   │   ├── login/  signup/           Authentication
│   │   ├── onboarding/               A/L year, medium, subject selection
│   │   ├── dashboard/                Student dashboard
│   │   ├── subjects/                 Syllabus tracker, practice, mock exams
│   │   ├── courses/                  Course delivery, lessons, quizzes, assignments
│   │   ├── practice/                 Practice hub
│   │   ├── study-plan/               Study planner
│   │   ├── certificates/             Earned certificates
│   │   ├── notifications/            In-app notifications
│   │   ├── search/                   Global search
│   │   ├── verify/[code]/            Public certificate verification
│   │   ├── privacy/  terms/          Legal pages
│   │   └── admin/                    Staff area (courses, questions, exams,
│   │                                 students, institutes, assignments)
│   ├── components/
│   │   ├── Logo.tsx                  Brand mark
│   │   ├── NavBar.tsx                Public top navigation
│   │   ├── Footer.tsx                Public footer
│   │   ├── LoadingScreen.tsx         Branded loading state
│   │   └── dashboard/                AppShell, Sidebar, MobileNav, MiniCalendar
│   ├── lib/supabase/                 Client, server, middleware, profile helpers
│   └── types/db.ts                   TypeScript database types
├── middleware.ts                     Route protection + session refresh
└── .env.local                        Your environment variables (never commit)
```

**Where backend logic lives:** any file named `actions.ts` with `"use server"` at the top. These run on the server and handle all database writes.

---

## 8. Common problems

**"Browse 0 subjects" on the landing page**
Your database has no subjects yet. See section 5 on seeding.

**`/admin` redirects me back to the dashboard**
Your account still has the `student` role. Run the promotion SQL in section 5, then sign out and back in.

**Changes don't appear after `git push`**
Check the Vercel dashboard → Deployments to see if the build failed. Type errors will block deployment — always run `npm run build` locally first.

**Build fails with a type error**
Run `npm run build` locally to see the exact file and line. This catches problems that `npm run dev` does not.

**Environment variables not working**
They must start with `NEXT_PUBLIC_` to be readable in the browser. After changing `.env.local`, restart the dev server. On Vercel, changing env vars requires a redeploy.

**File uploads failing on assignments**
Confirm the `assignment-files` bucket exists, is set to private, and has its storage policies applied.

---

## 9. Before you launch commercially

These are genuinely outstanding and matter before taking payment or onboarding real students:

- [ ] Enable leaked-password protection in Supabase Auth
- [ ] Enable email confirmation for signups
- [ ] Test tenant isolation with two real institutes (verify Institute A staff cannot see Institute B students)
- [ ] Review copyright status of any past-paper content before distributing it
- [ ] Have the privacy policy and terms reviewed by someone qualified — the included drafts are a starting point, not legal advice
- [ ] Set up database backups (Supabase → Database → Backups)
- [ ] Add error monitoring (e.g. Sentry)
- [ ] Write automated tests — there are currently none
