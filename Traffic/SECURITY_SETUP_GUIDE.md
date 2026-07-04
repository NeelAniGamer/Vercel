# Security Setup Walkthrough
## Do These in Order - Start with Critical

---

## ✅ Already Done (Don't Need to Do)
- vercel.json (security headers)
- .github/dependabot.yml
- .github/SECURITY.md
- Checked code for secrets (SAFE)

---

## 🔴 CRITICAL: Step 1 - Vercel Environment Variables

**Time: 2 minutes**

1. Go to: https://vercel.com/dashboard
2. Click your **Project**
3. Go to **Settings** (top right) → **Environment Variables**
4. Look at EACH variable:
   - If it starts with `NEXT_PUBLIC_` and contains a secret key ❌ REMOVE THE PREFIX
   - Only keep `NEXT_PUBLIC_` on public things (like public URLs)

**Examples of WRONG:**
```
NEXT_PUBLIC_STRIPE_KEY = sk_test_123...     ❌
NEXT_PUBLIC_API_SECRET = abc123             ❌
```

**Examples of RIGHT:**
```
STRIPE_KEY = sk_test_123...                ✅
API_SECRET = abc123                        ✅
NEXT_PUBLIC_GA_ID = UA-123456              ✅ (ok because it's public)
```

5. Click **Save Changes**

---

## 🔴 CRITICAL: Step 2 - Vercel Deployment Protection

**Time: 1 minute**

1. In same Project Settings
2. Click **Deployment Protection** (left sidebar)
3. Toggle **Vercel Authentication** to **ON**
4. Done!

---

## 🟠 HIGH: Step 3 - GitHub Branch Protection

**Time: 2 minutes**

1. Go to: https://github.com/your-username/your-repo/settings/branches
2. Click **Add rule**
3. Branch name pattern: `main`
4. Check these boxes:
   - ✅ **Require pull request reviews before merging** (set to 1)
   - ✅ **Require status checks to pass before merging**
   - ✅ **Include administrators**
5. Click **Save changes**

---

## 🟠 HIGH: Step 4 - GitHub 2FA

**Time: 3 minutes**

1. Go to: https://github.com/settings/security
2. Click **Enable two-factor authentication**
3. Click **Set up using an app**
4. It will show a QR code
5. Download **Authy** (or Google Authenticator) app on your phone
6. Scan the QR code with the app
7. Enter the 6-digit code to confirm
8. **SAVE THE RECOVERY CODES** somewhere safe!
9. Done!

---

## 🟠 HIGH: Step 5 - Supabase Security Settings

**Time: 3 minutes**

1. Go to: https://supabase.com/dashboard
2. Click your **Project**
3. Go to **Authentication** (left sidebar) → **Providers** → **Email**
4. Make these changes:
   - **Confirm email**: Toggle to **ON**
   - **Password minimum length**: Change to **12**
5. Go to **Authentication** → **URL Configuration**
6. Change **JWT Expiry** to **3600** (1 hour)
7. Done!

---

## 🟡 MEDIUM: Step 6 - ClouDNS Security

**Time: 3 minutes**

1. Go to: https://www.cloudns.net/
2. Log in to your account
3. Click your **domain**
4. Go to **Master DNS** settings
5. Enable **Hidden Master** (if available)
6. Go to **Zone settings**
7. Make sure **Recursion** is **disabled**
8. Add SPF record (for email):
   - Click **Add Record**
   - Type: **TXT**
   - Host: **@** (or your domain)
   - Value: `v=spf1 include:_spf.google.com ~all`
9. Done!

---

## 📋 Complete Checklist

After finishing all steps, check this list:

| Step | What to Do | Status |
|------|------------|--------|
| 1 | Vercel env vars - remove NEXT_PUBLIC_ from secrets | [ ] |
| 2 | Vercel Authentication - enable | [ ] |
| 3 | GitHub branch protection - enable | [ ] |
| 4 | GitHub 2FA - enable | [ ] |
| 5 | Supabase email confirm + password 12+ | [ ] |
| 6 | ClouDNS hidden master + SPF | [ ] |

---

## ⚠️ If You Add Tables to Supabase Later

Run this SQL in Supabase SQL Editor:

```sql
-- Enable RLS on your new table
ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;
ALTER TABLE your_table_name FORCE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users read own" ON your_table_name
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users insert own" ON your_table_name
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users update own" ON your_table_name
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

Replace `your_table_name` and `user_id` with your actual names.

---

## 🎉 You're Done!

Your app is now as secure as possible for FREE.

**What you got:**
- Vercel: WAF, DDoS protection, SSL, security headers, preview auth
- Supabase: Secure auth, RLS ready for future tables
- GitHub: Branch protection, 2FA, dependabot alerts
- ClouDNS: Hidden master, SPF, no recursion

---

*Last Updated: 2026-07-03*