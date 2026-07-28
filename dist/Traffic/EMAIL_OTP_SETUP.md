# Email OTP & Confirmation Setup Guide

## Overview

Traffic Academy uses **Supabase Auth** for email verification. This guide covers two approaches:
1. **Supabase built-in OTP** (currently implemented) — easiest, no extra services
2. **Resend** — for custom branded transactional emails (advanced)

---

## Option 1: Supabase Built-in OTP (Recommended — Already Working)

Your app already uses Supabase's `signInWithOtp` and `verifyOtp` methods. This sends a **6-digit code** via Supabase's built-in email service.

### Setup Steps

1. **Go to Supabase Dashboard** → [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project → **Authentication** → **Email Templates**
3. Configure the **Confirm signup** template:
   - Subject: `Your Traffic Academy Verification Code`
   - Body: Use `{{ .Token }}` for the 6-digit code
4. Under **Authentication** → **Providers** → **Email**:
   - ✅ Enable Email provider
   - ✅ Confirm email (set to "Confirmed" if you want auto-confirm, or "Unconfirmed" to require OTP)
   - Set **Mailer** to "Supabase" (default) or your custom SMTP

### Testing

1. Go to `TrafficSetup.html`
2. Click "Sign up now"
3. Enter email + password → "Create Account"
4. Check email for 6-digit code
5. Enter code → Verify → Should advance to Step 2

### Troubleshooting

| Issue | Fix |
|-------|-----|
| No email received | Check Supabase **Logs** → **Auth** for errors. Gmail may rate-limit. |
| "Invalid code" error | Code expires after 5 minutes. Click "Send again" if needed. |
| Rate limited | Supabase free tier: 30 emails/hour. Wait or upgrade. |
| Emails in spam | Add your domain to Supabase's **Sender Domain** settings |

---

## Option 2: Custom SMTP (Gmail, etc.)

If Supabase's default email goes to spam, configure a custom SMTP provider:

### Using Gmail

1. Enable **2-Factor Authentication** on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for "Mail"
4. In Supabase Dashboard → **Project Settings** → **Authentication** → **SMTP Settings**:
   ```
   Sender email:    yourname@gmail.com
   Sender name:     Traffic Academy
   Host:            smtp.gmail.com
   Port:            587 (STARTTLS) or 465 (TLS)
   Username:        yourname@gmail.com
   Password:        your-app-password-here
   Minimum interval: 60 (seconds between emails)
   ```
5. Click **Save**

### Using Resend (Recommended for Production)

1. Sign up at [https://resend.com](https://resend.com) (free tier: 3000 emails/month)
2. Verify your domain (e.g., `academy.yourdomain.com`)
3. Get your **API Key** from Resend dashboard
4. In Supabase Dashboard → **Project Settings** → **Authentication** → **SMTP Settings**:
   ```
   Sender email:    noreply@yourdomain.com
   Sender name:     Traffic Academy
   Host:            smtp.resend.com
   Port:            465
   Username:        resend
   Password:        re_your_api_key_here
   Minimum interval: 60
   ```

---

## Option 3: Resend Direct API (Advanced — For Custom Emails)

If you want full control over email design (HTML templates, branding), use Resend's API directly:

### Step 1: Install Resend SDK

```html
<!-- Add to TrafficSetup.html <head> -->
<script src="https://cdn.jsdelivr.net/npm/resend@latest/build/browser.js"></script>
```

Or use a backend proxy (recommended — never expose API keys in frontend).

### Step 2: Create Email Template

```javascript
// resend-email.js (run on your server/Vercel Edge Function)
import { Resend } from 'resend';

const resend = new Resend('re_your_api_key');

async function sendOTPEmail(email, otpCode) {
  await resend.emails.send({
    from: 'Traffic Academy <noreply@yourdomain.com>',
    to: email,
    subject: 'Your Verification Code',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px;">
        <h1 style="color: #f2b84b; font-size: 24px;">🎮 Traffic Academy</h1>
        <p style="color: #333; font-size: 16px;">Your verification code is:</p>
        <div style="background: #f8f9fa; border: 2px dashed #f2b84b; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: 700; color: #070a14; letter-spacing: 8px;">${otpCode}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in 5 minutes.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
      </div>
    `
  });
}
```

### Step 3: Create a Vercel Edge Function (or Serverless Function)

```javascript
// api/send-otp.js (Vercel Serverless Function)
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { email, code } = req.body;
  
  try {
    await resend.emails.send({
      from: 'Traffic Academy <noreply@yourdomain.com>',
      to: email,
      subject: 'Your Traffic Academy Verification Code',
      html: `<h2>Your code: ${code}</h2><p>Expires in 5 minutes.</p>`
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
```

### Step 4: Store API Key in Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add: `RESEND_API_KEY` = `re_your_api_key`
3. Redeploy

---

## Recommended Architecture

```
User enters email → Supabase signInWithOtp({ email })
                  → Supabase sends 6-digit code automatically
                  → User enters code → Supabase verifyOtp({ email, token, type: 'email' })
                  → Session created → Advance to Step 2
```

**For most projects, Supabase's built-in OTP is sufficient.** Only use Resend if you need:
- Custom branded HTML emails
- Higher send limits (free: 3000/mo, paid: 50,000+/mo)
- Email analytics (open rates, click tracking)
- Multi-domain support

---

## Current Implementation in TrafficSetup.html

The app already implements these functions:

| Function | Purpose |
|----------|---------|
| `sendLoginOtp()` | Sends OTP via `supabase.auth.signInWithOtp({ email })` |
| `verifyLoginOtp()` | Verifies login OTP via `supabase.auth.verifyOtp({ email, token, type: 'email' })` |
| `handleEmailAuth()` | Handles both signup (password) and login (password) |
| `verifySignupOtp()` | Verifies signup OTP via `supabase.auth.verifyOtp({ email, token, type: 'signup' })` |

All these use the **Supabase built-in email service** — no extra setup needed beyond the Supabase dashboard configuration above.
