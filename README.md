# Profile.Mu — Your AI Twin, Always On

Profile.Mu lets professionals create an **AI-powered digital twin** that knows their background, expertise, and personality — so visitors can have real conversations with "you" anytime, anywhere.

## What It Does

- **AI Twin Chat** — Visitors chat with your AI twin on your public profile page. It responds in your voice, using context from your resume, bio, and knowledge base.
- **Resume & Text Import** — Paste your LinkedIn summary, bio, or resume text and AI automatically categorizes it into structured profile context.
- **Knowledge Management** — Add, edit, and organize expertise areas, work history, and talking points that shape how your twin responds.
- **Embeddable Widget** — Drop a `<script>` or `<iframe>` snippet on any website to let visitors chat with your AI twin outside Profile.Mu.
- **Conversation History** — See what visitors are asking, review full chat transcripts, and track engagement analytics.
- **Personality Tuning** — Customize greeting messages, tone (professional / friendly / casual), and response length.
- **Social Auth** — Sign in with Google, Apple, or email.

## Tech Stack

- **Frontend** — React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend** — Lovable Cloud (Supabase) for auth, database, edge functions, and file storage
- **AI** — Streaming chat responses via edge functions with configurable model support

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd profile-mu
npm install
npm run dev
```

## Deploy

Open [Lovable](https://lovable.dev/projects/bc32105f-3db0-418b-ab39-12705f3e4c08) and click **Share → Publish**.

## Custom Domain

Navigate to **Project → Settings → Domains → Connect Domain**.  
Docs: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
