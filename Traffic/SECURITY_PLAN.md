# Maximum Security Plan for Free (Vercel + Supabase + GitHub + ClouDNS)

This document outlines comprehensive security measures you can implement for FREE across your entire tech stack.

---

## Table of Contents

1. [Vercel Security](#1-vercel-security)
2. [Supabase Security](#2-supabase-security)
3. [GitHub Security](#3-github-security)
4. [ClouDNS Security](#4-cloudns-security)
5. [Quick Start Checklist](#5-quick-start-checklist)

---

## 1. Vercel Security

### What's Free on Vercel (Hobby Plan)

| Feature | Free Tier | Notes |
|---------|-----------|-------|
| WAF (Web Application Firewall) | ✅ Yes | Basic protection included |
| DDoS Mitigation | ✅ Yes | Automatic |
| Automatic HTTPS/SSL | ✅ Yes | All deployments encrypted |
| HSTS | ✅ Yes | Auto-enabled on .vercel.app |
| Rate Limiting (Beta) | ✅ Yes | Available on all plans |
| Custom Firewall Rules | ✅ Yes | IP, JA4, geolocation filtering |
| Vercel Authentication | ✅ Yes | Protects preview deployments |
| Enterprise SRT | ❌ No | Requires Pro ($20+/mo) |

### Critical: Environment Variables

**MOST COMMON MISTAKE:** Using `NEXT_PUBLIC_` prefix on secrets exposes them to the browser.

| Prefix | Exposed to Browser? | Use For |
|--------|---------------------|---------|
| `NEXT_PUBLIC_` | ✅ Yes | Public API URLs, feature flags |
| No prefix | ❌ No (server-only) | API keys, secrets, credentials |

**Action Items:**
- [ ] Review ALL environment variables in Vercel Dashboard → Project Settings → Environment Variables
- [ ] Remove `NEXT_PUBLIC_` from any secret keys (Stripe, Supabase service_role, etc.)
- [ ] Store all secrets without the prefix

### Add Security Headers (vercel.json)

Create or update `vercel.json` in your project root:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
      ]
    }
  ]
}
```

### Protect Preview Deployments

By default, preview deployment URLs are publicly discoverable. Enable Vercel Authentication:

1. Go to **Project Settings → Deployment Protection**
2. Enable **Vercel Authentication**
3. Now preview URLs require login

### Secure API Routes

Every API route should include authentication:

```javascript
// Example: Basic auth check in API route
export default async function handler(req, res) {
  // Check for valid session/user
  const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.replace('Bearer ', ''));
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Your logic here
}
```

### Rate Limiting

Enable rate limiting in Project Settings → Git Integration → Rate Limiting (Beta)

---

## 2. Supabase Security

### Row Level Security (RLS) - THE MOST IMPORTANT

**CRITICAL:** If RLS is not enabled, your entire database is PUBLIC.

#### Enable RLS on Every Table

```sql
-- Enable RLS on a table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;  -- Applies to owner too

-- Enable on ALL tables with user data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
```

#### Create Policies (Always Use These Patterns)

```sql
-- Users can only read their own data
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Users can only insert their own profile
CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can only update their own profile
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

**Note:** Always use `(SELECT auth.uid())` instead of `auth.uid()` for performance (171ms → <0.1ms)

### API Key Management

| Key | Usage | Safety |
|-----|-------|--------|
| `anon` key | Frontend/client-side | ✅ Safe (subject to RLS) |
| `service_role` key | Server-side admin | ❌ **NEVER expose in frontend** |

**Action Items:**
- [ ] Verify `anon` key is used in frontend (not service_role)
- [ ] Never put service_role key in environment variables accessible to client
- [ ] Use Row Level Security to restrict `anon` key access

### Authentication Best Practices

```sql
-- Set minimum password length (do this in Supabase Dashboard)
-- Go to Authentication → Providers → Email → Password minimum length: 12

-- Configure JWT expiry (shorter = more secure)
-- Go to Authentication → URL Configuration → JWTExpiry: 3600 (1 hour)
```

**Action Items:**
- [ ] Enable email confirmation (Authentication → Providers → Email → Confirm email: ON)
- [ ] Set minimum password to 12+ characters
- [ ] Set JWT expiry to 1 hour (3600 seconds) or less

### Multi-Tenant Isolation (If Applicable)

Store tenant context in `app_metadata` (not `user_metadata` which users can modify):

```sql
CREATE POLICY "tenant_isolation" ON orders
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);
```

### Test RLS Using Impersonation

In Supabase Studio → Dashboard → [Your Project] → SQL Editor:

```sql
-- Test as authenticated user
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claims = '{"sub": "user-uuid-here", "role": "authenticated"}';
SELECT * FROM profiles;  -- Should only return matching rows
```

---

## 3. GitHub Security

### Free Security Features (Available on All Plans)

| Feature | Public Repos | Private Repos |
|---------|--------------|---------------|
| Dependabot Alerts | ✅ | ✅ |
| Secret Scanning Alerts | ✅ | ✅ (with push protection) |
| Push Protection | ✅ | ❌ (paid) |
| Code Scanning | ✅ | ❌ (paid) |
| Dependency Review | ✅ | ❌ (paid) |
| Private Vulnerability Reporting | ✅ | ✅ |

### Enable These Critical Settings NOW

#### 1. Branch Protection Rules

Go to Repository Settings → Branches → Add rule:

- [ ] Require pull request reviews before merging (1 reviewer)
- [ ] Require status checks to pass before merging
- [ ] Require conversation resolution before merging
- [ ] Include administrators (don't let admins bypass)
- [ ] Require signed commits (optional but recommended)

#### 2. Enable Dependabot

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule: "weekly"
    open-pull-requests-limit: 10
    
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: "weekly"
```

#### 3. Create SECURITY.md

Create `.github/SECURITY.md`:

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

Please report security vulnerabilities to [your-email@example.com].
We will respond within 24 hours.

Do NOT report security vulnerabilities in public issues.
```

#### 4. Enable Secret Scanning (For Public Repos)

Go to Repository Settings → Security → Secret scanning → Enable

#### 5. Require 2FA for All Members

If this is an organization:
- Go to Organization Settings → Member privileges → Enable 2FA requirement

---

## 4. ClouDNS Security

### What's Free vs Paid

| Feature | Free Plan | Paid Plans |
|---------|-----------|------------|
| DNSSEC | ❌ No | ✅ Yes ($2.95+/mo) |
| Rate Limiting | ❌ Limited | ✅ Yes |
| Anycast | ❌ No | ✅ Yes |
| DDoS Protection | ❌ No | ✅ Yes ($5.95+/mo) |

### Free Tier Security Measures

#### 1. Hide Your Master DNS

In ClouDNS Dashboard:
- Set master DNS as **Hidden Master** (not exposed in NS records)
- Use strict firewall rules

#### 2. Use Strong DNS Records

- [ ] Enable **SPF** record (prevents email spoofing)
- [ ] Enable **DMARC** record (email authentication)
- [ ] Use **TXT** records properly

#### 3. Disable Recursion

- [ ] Ensure recursion is disabled on your authoritative servers
- This prevents your DNS from being used in amplification attacks

#### 4. Monitor Traffic

- [ ] Regularly check query logs for unusual patterns
- [ ] Set up alerts for unusual traffic spikes

### If You Upgrade (Recommended for Production)

If you can afford it, consider upgrading to Premium DNS ($2.95/mo) for:
- DNSSEC (critical for preventing DNS spoofing)
- Better rate limiting
- Anycast for DDoS protection

---

## 5. Quick Start Checklist

Copy this and check off as you complete:

### Vercel (5 min)
- [ ] Review environment variables - remove `NEXT_PUBLIC_` from secrets
- [ ] Add security headers in `vercel.json`
- [ ] Enable Vercel Authentication for preview deployments
- [ ] Add auth checks to all API routes
- [ ] Enable rate limiting

### Supabase (15 min)
- [ ] Enable RLS on ALL tables with user data
- [ ] Create SELECT/INSERT/UPDATE policies for each table
- [ ] Verify anon key is used in frontend (not service_role)
- [ ] Set password minimum to 12+ characters
- [ ] Enable email confirmation
- [ ] Set JWT expiry to 1 hour
- [ ] Test RLS policies with SQL impersonation

### GitHub (10 min)
- [ ] Enable branch protection rules (require PR reviews)
- [ ] Create dependabot.yml
- [ ] Create SECURITY.md
- [ ] Enable 2FA on your account
- [ ] Enable secret scanning (if public repo)

### ClouDNS (5 min)
- [ ] Enable hidden master
- [ ] Disable recursion
- [ ] Add SPF/DMARC records for email
- [ ] Monitor query logs regularly

---

## Summary: What You Can Get For Free

| Layer | Free Protection |
|-------|-----------------|
| **Deploy (Vercel)** | WAF, DDoS mitigation, SSL, security headers, rate limiting, preview auth |
| **Database (Supabase)** | Row Level Security, RLS policies, anon key restrictions |
| **Code (GitHub)** | Dependabot alerts, secret scanning, branch protection, 2FA |
| **DNS (ClouDNS)** | Basic DNS, hidden master, manual monitoring |

---

## Sources

- [Vercel Security Best Practices](https://vercel.com/docs/deployment-protection)
- [Vercel Security Checklist](https://checkyourvibe.dev/blog/checklists/vercel-security-checklist)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Security Best Practices](https://bastion.tech/blog/supabase-security-best-practices/)
- [GitHub Security Settings](https://github.blog/security/6-security-settings-every-github-maintainer-should-enable-this-week/)
- [GitHub Security Features](https://docs.github.com/en/code-security/getting-started/github-security-features)
- [ClouDNS DNSSEC](https://www.cloudns.net/wiki/article/339/)
- [ClouDNS Best Practices](https://www.cloudns.net/blog/dns-best-practices/)

---

*Last Updated: 2026-07-03*