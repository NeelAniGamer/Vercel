# Resend Free Domain Setup Guide

## Overview

Use Resend's free `@resend.dev` domain to send emails through Supabase without DNS verification. This works immediately — no domain setup needed.

**Free tier:** 3,000 emails/month, 100/day

---

## Step 1: Get Your Resend API Key

1. Go to [https://resend.com](https://resend.com) and sign up/login
2. In the dashboard, click **API Keys** in the sidebar
3. Click **Create API Key**
4. Name it `supabase-smtp`
5. Copy the key (starts with `re_...`)
6. **Save it somewhere safe** — you'll only see it once

---

## Step 2: Configure Supabase SMTP

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Project Settings** (gear icon, bottom-left)
4. Click **Authentication** in the sidebar
5. Scroll down to **SMTP Settings**
6. Toggle **Enable Custom SMTP** to ON
7. Fill in these exact values:

```
Sender email:    onboarding@resend.dev
Sender name:     Traffic Academy
Host:            smtp.resend.com
Port:            465
Username:        resend
Password:        re_YOUR_API_KEY_HERE
Minimum interval: 60
```

8. Click **Save**

> ⚠️ Replace `re_YOUR_API_KEY_HERE` with the actual key from Step 1

---

## Step 3: Update Email Templates (Optional)

In Supabase Dashboard → **Authentication** → **Email Templates**:

### Confirm signup template:
```html
<h2>Welcome to Traffic Academy!</h2>
<p>Your verification code is:</p>
<h1 style="font-size: 32px; letter-spacing: 8px; background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">{{ .Token }}</h1>
<p>This code expires in 5 minutes.</p>
<p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
```

### Reset password template:
```html
<h2>Reset Your Password</h2>
<p>Your verification code is:</p>
<h1 style="font-size: 32px; letter-spacing: 8px; background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">{{ .Token }}</h1>
<p>This code expires in 5 minutes.</p>
```

---

## Step 4: Test It

1. Go to `TrafficSetup.html`
2. Click **Sign up now**
3. Enter your email + password → **Create Account**
4. Check your email inbox (and spam folder)
5. You should see an email from `onboarding@resend.dev`
6. Enter the 6-digit code → Verify

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No email received | Check Supabase **Logs** → **Auth** for errors |
| Emails in spam | Normal for `@resend.dev` — ask users to whitelist it |
| "Rate limit" error | Free tier: 100 emails/day. Wait or upgrade Resend |
| SMTP connection error | Double-check the API key hasn't expired |
| "Sender not verified" | Make sure you're using `onboarding@resend.dev` exactly |

---

## What the Emails Will Look Like

From: `Traffic Academy <onboarding@resend.dev>`

The sender address will show as `onboarding@resend.dev` — this is Resend's built-in testing domain. It works immediately without any DNS verification.

---

## Future: Use Your Own Domain

When you're ready to use a custom domain (like `mail.yourdomain.com`):

1. Buy a domain you own (not a ddns.org subdomain)
2. Add it to Cloudflare (free) for DNS management
3. Add the domain in Resend dashboard
4. Add the TXT/MX records Cloudflare gives you
5. Update Supabase SMTP to use your domain:
   ```
   Sender email:    noreply@yourdomain.com
   Host:            smtp.resend.com
   Port:            465
   Username:        resend
   Password:        re_YOUR_API_KEY
   ```

---

## Quick Reference

| Setting | Value |
|---------|-------|
| SMTP Host | `smtp.resend.com` |
| SMTP Port | `465` (SSL) |
| Username | `resend` |
| Password | Your Resend API key (`re_...`) |
| Sender Email | `onboarding@resend.dev` |
| Free Limit | 3,000/month, 100/day |
