# Portfolio — Security Hardening Guide

Steps to close the verified vulnerability: anyone can currently create an
account on this Supabase project (`disable_signup: false`) and, because the
Row Level Security (RLS) policies allowed *any authenticated user* to
write, tamper with the live portfolio content.

Do these steps in order. Total time: ~10 minutes.

---

## 1. Disable public signups (Supabase Dashboard)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
   → **Authentication** → **Sign In / Up** → **Email** provider.
2. Turn **OFF** the toggle *"Allow new users to sign up"*.
3. Save.

Existing users (your admin account) are unaffected. Nobody new can register.

> Optional stronger option: instead of turning signups fully off, use the
> **email allowlist** (Authentication → Settings → Emails → Allow list) and
> add only your admin address. The dashboard option may vary slightly by UI
> version; if you cannot find it, turning signups off entirely is sufficient.

## 2. Enable MFA on your admin account (recommended)

1. **Authentication** → **Users** → open your admin user.
2. In the *Enrolled Factors* section, click **Enroll MFA** (or log in to the
   admin once and enroll a TOTP app like Google Authenticator / 1Password).
3. Optional enforcement (free tier): **Authentication** → **Policies** →
   enable *"MFA verification enforcement"* for your admin user.

## 3. Lock write access to only you (SQL Editor)

1. **SQL Editor** → New query.
2. Run the first statement of `db/security-fixes.sql` to find your user ID:

   ```sql
   SELECT id, email FROM auth.users;
   ```

3. Copy your `id` UUID from the result.
4. Open `db/security-fixes.sql`, replace **both** occurrences of
   `<ADMIN_USER_ID>` with your UUID (keeping the single quotes), run the whole
   file.
5. The final verification query must list only:
   - `projects` → `Public can read projects` (SELECT)
   - `projects` → the three "Only admin can ..." policies
   - `objects` → `Public can view images` (SELECT) + the two "Only admin ..." policies

   There must be **no** remaining `Authenticated users can ...` policies.

## 4. Verify it works

- Open the admin at `https://lilfroshtech.vercel.app/tokens/` and log in —
  everything still works (you are the admin).
- Confirm a stranger can no longer sign up: in a private browser window try
  `https://lilfroshtech.vercel.app/tokens/login.html` → Sign In fails for
  unknown accounts, and no new user can be created.

## What this protects

- Only your account can create / edit / delete projects or upload images.
- Public visitors can still read projects and view images (required).
- The anon key in `js/supabase.js` is safe to be public by design — the
  security boundary is RLS, not the key.
