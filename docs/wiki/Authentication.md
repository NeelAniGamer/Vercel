# Authentication

## Architecture

Class Of Learners uses **Supabase Auth** as its unified identity provider, supporting:
1. **Google OAuth 2.0** &mdash; Primary one-click sign-in.
2. **Magic Link** &mdash; Passwordless sign-in link delivered via email.
3. **OTP (One-Time Password)** &mdash; 6-digit verification code.

---

## Session Security Rules

> ⚠️ **Non-Negotiable:** `window.colUser` is strictly **live-session-only**.
- LocalStorage profiles may be used to remember preferences offline, but must **never** be presented as an authenticated user or used for leaderboard submission.
- Prefer verified Google profile photos (`colUser.picture`), with initials fallback only when unavailable.

---

## Email Templates (`supabase/email-templates/`)

The platform includes 6 custom email templates designed for Supabase Auth, strictly under 45 lines each:

| Template | Subject | Lines |
|---|---|---|
| **Magic Link Or OTP** | `Your Sign-In Link And Verification Code` | 39 |
| **Confirm Sign Up** | `Confirm Your Email Address — Class Of Learners` | 39 |
| **Reset Password** | `Reset Your Password — Class Of Learners` | 39 |
| **Change Email** | `Confirm Your New Email Address` | 39 |
| **Invite User** | `You've Been Invited To Join Class Of Learners` | 34 |
| **Reauthentication** | `Confirm Your Identity — Verification Code` | 32 |

### Design Standards:
- **600px Desktop Container**: Centered card layout with responsive mobile fallback.
- **Buttonized Direct Links**: Replaced raw URL strings with styled `🔗 Direct Link →` buttons.
- **Space Mono OTP Box**: High-contrast monospace display for 6-digit codes.
- **Title Case**: Standardized capitalization across all text elements.
- **Interactive Preview**: Test templates locally via `supabase/email-templates/preview.html`.
