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
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
```

Use the publishable key from the Supabase dashboard. It is safe to expose in a browser when the database is protected by correct row-level security.

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

All tables, security policies, and functions were created through migrations. To rebuild them in a fresh project, run the SQL migrations in chronological order.

The current schema includes:

1. **Core tables** — `profiles`, `courses`, `modules`, `lessons`, `enrollments`, `lesson_progress`, `quizzes`, `quiz_questions`, `quiz_attempts`, `certificates`, `discussion_threads`, `discussion_comments`
2. **Row-level security** — RLS policies on the core tables plus the existing helper functions and signup trigger
3. **A/L structure** — `institutes`, `streams`, `subjects`, `student_subjects`, `syllabus_units`, `syllabus_topics`, `topic_progress`
4. **Phase 1 academic foundation** — versioned syllabi, subject/version mapping, competencies, competency levels, optional subtopics, and learning outcomes
5. **Question bank** — `questions`, `question_attempts`
6. **Mock exams** — `mock_exams`, `mock_exam_questions`, `mock_exam_attempts`, `mock_exam_answers`
7. **Study plan** — `study_plan_items`
8. **Assignments** — `assignments`, `assignment_submissions` plus the `assignment-files` storage bucket and its policies
9. **Notifications** — `notifications` and the `create_notification()` function
10. **Mastery** — `topic_mastery` and the `update_topic_mastery()` function

The Phase 1 migration is stored at:

```text
supabase/migrations/20260917150000_phase1_academic_foundation.sql
```

It is additive: the existing stream → subject → unit → topic structure remains valid, while new content can opt into a syllabus version and continue down to competency → competency level → subtopic → learning outcome.

> Do not populate official Sri Lankan syllabus content from memory or unverified sources. Version records should identify their verified source before being treated as official content.

### 4.4 Create the storage bucket

**Storage → New bucket**

- Name: `assignment-files`
- Public: **off** (files must stay private)

Then apply the storage policies so students can upload to their own folder and staff can read submissions.

### 4.5 Recommended auth settings

**Authentication → Providers → Email**

- Enable **Confirm email** for production (off is easier for testing)
- Under **Authentication → Policies**, turn on **leaked password protection** — this is currently OFF and should be enabled before launch

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

Note: streams, subjects, and syllabus units/topics currently have no admin UI. Phase 1 adds the database foundation for versioned syllabus management; the syllabus management UI will be added separately without changing the student-facing design.

### Option B — Via SQL

Insert streams (Physical Science, Biological Science, Commerce, Arts, Technology), then subjects linked to those streams, then syllabus versions and version/subject mappings, followed by syllabus units/topics/subtopics/learning outcomes. Questions and mock exams can then be created through the admin UI.

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
git push origin main
```

---

## 7. Commercial launch checklist

Before selling Skill Note to institutes or students:

- [ ] Enable leaked-password protection
- [ ] Enable email confirmation
- [ ] Test tenant isolation with two institutes
- [ ] Verify all syllabus/question sources and licensing status
- [ ] Add backups and recovery checks
- [ ] Add Sentry or equivalent error monitoring
- [ ] Add automated tests for critical flows
- [ ] Review security advisors and RLS policies
- [ ] Verify demo data is clearly marked as demo data
- [ ] Review all public marketing claims before launch
