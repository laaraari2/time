# Supabase setup

1. Create a Supabase project.
2. In **SQL Editor**, run `supabase/schema.sql`.
3. In **Authentication → Users**, create the first user (email + password).
4. Copy the project URL and publishable/anon key into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

5. Install dependencies with `npm install` and start with `npm run dev`.

The application no longer uses the old local username/password, Prisma database, or JSON project persistence. Projects are stored in Supabase and protected by Row Level Security so each authenticated user sees only their own projects.

## Security note
The original archive contained a live database credential in `.env`. It was removed from this cleaned project. If that credential is still active, rotate/revoke it immediately.
