# Security Architecture

## Edge Protection & Headers

Vercel injects the following security headers on all responses:

- **`X-Frame-Options: DENY`**: Prevents clickjacking by disabling iframe embedding.
- **`X-Content-Type-Options: nosniff`**: Prevents MIME-type confusion attacks.
- **`Strict-Transport-Security`**: Enforces HTTPS connections.
- **`Content-Security-Policy`**: Strict policy restricting script execution to origin, Supabase, Google Accounts, and approved CDNs.

---

## Automated Security Checks

Run the automated security regression test:

```bash
npm run security:check
```

This script validates:
- **Session Identity Isolation**: Confirms that `window.colUser` is not improperly mirrored to LocalStorage.
- **QR Engine Security**: Verifies that custom QR payload storage does not execute untrusted scripts.
- **Electron Sandbox**: Ensures desktop packaging flags keep security sandboxing active.
- **CodeQL Integrity**: Checks that static analysis configurations remain intact.

---

## GitHub Security Workflows

- **Microsoft Defender for DevOps** (`.github/workflows/defender-for-devops.yml`): Scans repository for vulnerabilities.
- **Microsoft DevSkim** (`.github/workflows/devskim.yml`): Analyzes code for insecure patterns.
- **CodeQL** (`.github/codeql/codeql-config.yml`): Static application security testing (SAST).
- **Dependabot**: Monitors root and `Traffic/` npm dependencies for known vulnerabilities.
