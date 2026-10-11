# WeekPlan Pro

Plan your week hour by hour. Create reusable tasks, drag them into time slots,
and see how your hours split across categories.

**Live demo:** [HERE](https://weekplan-ten.vercel.app/)

## Features
- Drag-and-drop weekly grid (or click a slot to assign a task)
- Customizable day range: pick any start and end hour, including past midnight
- Up to 4 custom categories with your own names and colors, plus live hour totals
- Email/password login with password reset (Supabase Auth)
- Each user's tasks, schedule and settings saved to their own account, with row-level security
- Export and import your schedule as JSON
- Neo-brutalist UI

## Tech stack
Vanilla JavaScript (ES modules), Vite, Supabase (Auth + Postgres), Vercel

## Getting started
See Setup below for the Supabase and Vercel steps.

## 1. Setup Supabase (free, ~5 minutes)

1. Create a project at https://supabase.com.
2. **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, click **Run**.
   This creates the `plans` table with Row Level Security, so every user can only read/write their own row.
3. **Project Settings → API**: copy the **Project URL** and the **anon public** key.
4. **Authentication → URL Configuration**: set **Site URL** to your Vercel URL
   (and add `http://localhost:5173` under Redirect URLs for local dev). Confirmation and
   password-reset emails link back to this URL.
5. Optional, Google sign-in: **Authentication → Providers → Google**, then set `VITE_ENABLE_GOOGLE=true`.

## 2. Run locally

```bash
cp .env.example .env.local   # fill in the two Supabase values
npm install
npm run dev
```

## 3. Deploy on Vercel

1. Push the project to GitHub and import it in Vercel (framework preset: **Vite**).
2. **Project Settings → Environment Variables**: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   (and `VITE_ENABLE_GOOGLE` if used). Then redeploy, since Vite bakes these in at build time.

The anon key is meant to be public; the security comes from the Row Level Security policies in `schema.sql`.
Never put the `service_role` key in this project.

## Notes
- Data from the pre-login version (saved in the browser) is uploaded once into the first account that logs in on that browser, then removed from the browser.
- Email confirmation is on by default in Supabase. You can turn it off under Authentication → Providers → Email while testing.
