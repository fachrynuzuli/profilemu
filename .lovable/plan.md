

## Plan: Add Security Documentation and .env.example

### What
Create two files to formalize the security posture documented in the user's message.

### Changes

**1. Create `.env.example`** with placeholder values (safe to commit):
```env
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
```

**2. Create `SECURITY.md`** at project root containing the user's security and deployment notes, formatted as proper Markdown documentation covering:
- Environment variables and secrets policy
- Supabase and data access expectations
- Frontend behavior contract
- Edge functions / server logic guidelines
- Logging and conversation data principles
- How to report a security issue

**3. Update `.gitignore`** to add `.env` and related patterns:
```
.env
.env.local
.env.*.local
```

Note: The `.env` file is auto-managed by Lovable Cloud. Adding it to `.gitignore` is a defensive measure — it won't affect Lovable's internal management but prevents accidental commits if someone clones and works locally.

### No database or code changes needed
All security scan findings are already resolved or appropriately ignored.

