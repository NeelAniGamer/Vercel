# Security Architecture

## Edge Protection & Headers

Vercel injects the following security headers on all responses:

- **`X-Frame-Options: DENY`**: Prevents clickjacking by disabling iframe embedding.
- **`X-Content-Type-Options: nosniff`**: Prevents MIME-type confusion attacks.
- **`Strict-Transport-Security`**: Enforces HTTPS connections.
- **`Referrer-Policy`** and **`Permissions-Policy`**: Limit cross-origin referrers and disable camera, microphone, geolocation, and payment access outside the origin.
- **`Content-Security-Policy-Report-Only`**: A strict policy restricting script execution to the origin, Supabase, Google Accounts, and approved CDNs. It is report-only so that a policy change can be observed before it is enforced.
- **`X-Robots-Tag: noindex, nofollow, noarchive`**: Applied to internal routes only (`/admin`, `/dashboard`, `/q`, `/qr`, `/rpg`, `/verify`, `/feedback`, `/sitemap`, and the internal `/Traffic/*` pages).

---

## Automated Security Checks

Run the automated security regression test:

```bash
npm run security:check
```

This script validates:
- **Session Identity Isolation**: Confirms that `window.colUser` is not improperly mirrored to LocalStorage.
- **QR Engine Security**: Verifies that custom QR payload storage does not execute untrusted scripts and that passcode verifiers use salted PBKDF2 rather than plaintext.
- **Electron Sandbox**: Ensures desktop packaging flags keep `contextIsolation`, the sandbox, and web security active.
- **Traffic Engine Parity**: Confirms the generated objective list still matches the engine, so no declared objective is left without a handler.
- **CodeQL Integrity**: Checks that static analysis configurations remain intact and that no duplicate CodeQL workflow was added.

Two more gates run on every build:

```bash
npm run seo:check          # sitemap ↔ page metadata parity
node scripts/audit-pages.js # internal reference resolution
```

---

## GitHub Security Workflows

- **Microsoft Defender for DevOps** (`.github/workflows/defender-for-devops.yml`): Scans repository for vulnerabilities.
- **Microsoft DevSkim** (`.github/workflows/devskim.yml`): Analyzes code for insecure patterns.
- **CodeQL** (`.github/codeql/codeql-config.yml`): Static application security testing (SAST).
- **Dependabot**: Monitors root and `Traffic/` npm dependencies for known vulnerabilities.
