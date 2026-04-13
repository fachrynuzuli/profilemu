# Security & Deployment Notes

This repository is public by design. The goal: ship fast without leaking anything you'd regret.

## 1. Environment Variables & Secrets

The only environment values committed here are **public** Supabase client config:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (Supabase anon key)

These values are intentionally exposed to the browser and are required for the frontend to talk to Supabase. Anyone can see them via DevTools, so committing them does not increase the real risk surface.

**No service role keys, JWT secrets, or third-party API keys should ever live in this repo.**

### Rules of thumb

- Anything starting with `VITE_` is treated as public and may end up in the browser.
- Anything you would not show in DevTools should live only in the hosting environment (Lovable Cloud, Supabase, or other infra), never in Git history.

### Hygiene

- `.env.example` contains placeholder values and is safe to commit.
- `.env` is gitignored so local secrets can never be committed by accident.

## 2. Supabase & Data Access

This project uses Supabase for auth and storage. Security depends less on "hiding the anon key" and more on **access control**.

### Baseline expectations

- Row Level Security (RLS) is enabled on all non-public tables.
- Public data (e.g. what appears on a public profile) may allow `SELECT` for anonymous users.
- Private data (e.g. conversation history, analytics, internal settings) is only readable by the authenticated profile owner.
- Inserts/updates/deletes are always scoped to the current user, never "open to everyone".

Even with the anon key, a random user should **not** be able to:

- Read someone else's conversations.
- Update or delete another profile's configuration.
- Access any internal "admin view" data.

## 3. Frontend Behavior

The frontend is a standard React + Vite app:

- It uses the Supabase anon key from `VITE_SUPABASE_PUBLISHABLE_KEY` to make client-side calls.
- Any privileged behaviour (viewing/managing visitor conversations, analytics, or private settings) must be guarded by:
  - Auth checks on the client, **and**
  - Proper Supabase RLS / server-side checks on the backend.

The public UI (profile page + AI Twin chat) is intentionally world-readable. The contract: you can talk to the AI twin, but you can't take over someone's account or see data that belongs to another user.

## 4. Edge Functions / Server Logic

Server-side or edge logic (e.g. for AI calls, protected operations):

- Uses environment variables configured in the hosting platform, not hardcoded keys.
- Verifies who is calling (auth) and what they're allowed to touch (authorization).
- Never exposes service role keys or third-party API keys to the browser.

### If you are extending this project

- Read sensitive configuration from process env or platform env.
- Never log full secrets or raw tokens.
- Treat any function that uses a service role key as "root access" and enforce your own checks inside it.

## 5. Logging & Conversation Data

The app can record visitor conversations and analytics so profile owners can review what people ask.

### Guiding principles

- Only the profile owner should see their own visitors' conversations.
- Logs should store the minimum necessary data to be useful.
- Sensitive metadata (like IPs or personal identifiers) should be added only if there is a clear need and with care.

## 6. How to Report a Security Issue

If you notice:

- A hardcoded secret (service role key, API token, JWT secret, payment key), or
- An access control issue (you can see or modify data that isn't yours),

please open an issue or contact the maintainer so it can be:

1. Rotated at the provider (Supabase / AI / payments / etc).
2. Removed or refactored from the codebase.
3. Covered by tighter policies or checks.

---

**The north star**: the code can be fully open-source, but secrets stay in the environment and access control lives in Supabase policies and server logic — not in hope.
