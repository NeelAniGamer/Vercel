# Security Policy

Class Of Learners takes security reports seriously. This policy covers the public
Class Of Learners website, the Traffic Academy, and the other interactive tools
hosted on the production Vercel site.

## Supported Versions

The public web surface is deployed continuously and is always served from the
current production revision, so security fixes reach it immediately. Individually
versioned native releases are supported on the following lines:

| Artifact                                   | Version line            | Supported |
| ------------------------------------------ | ----------------------- | --------- |
| Class Of Learners web studio (`/`)          | continuous production    | :white_check_mark: |
| Advanced Typing Instructor — web (`/ati`)   | 1.4.x                    | :white_check_mark: |
| Advanced Typing Instructor — Windows build  | 3.2.x                    | :white_check_mark: |
| Class Of Learners Android app (`COL.apk`)   | 2.0.x                    | :white_check_mark: |
| Perceptus Flow desktop build                | 2.5.x                    | :white_check_mark: |
| Solar System Engine                         | 3.3.x                    | :white_check_mark: |
| CastFlow Android app                        | 1.1.x                    | :white_check_mark: |
| Traffic Academy                             | current level catalog   | :white_check_mark: |
| Superseded release lines                    | < the line above        | :x: |

Local desktop builds and unreleased prototype archives are not part of the
supported public production surface.

## Reporting a Vulnerability

Please report suspected vulnerabilities through GitHub Private Vulnerability
Reporting rather than opening a public issue:

1. Open the repository's **Security** tab.
2. Select **Report a vulnerability**.
3. Include the affected URL, reproduction steps, impact, and any relevant logs.
4. Do not include access tokens, passwords, private database data, or personal
   information in the report.

If private reporting is unavailable, open a public issue containing only a short
notice that a private security report is needed and the contact method. Do not
publish exploit details or sensitive data in a public issue.

You can expect:

- An acknowledgement within **3 business days**.
- An initial triage and severity assessment within **7 days**.
- A status update at least every **7 days** while the report is being investigated.
- A target mitigation window of **72 hours** for actively exploited critical issues,
  **14 days** for high-severity issues, and a planned release for lower-severity
  findings.

If a report is accepted, we will coordinate a fix, validate it against the
production deployment, and credit the reporter when requested. If a report is
declined, we will explain the reason when possible and suggest safer alternatives.
Please do not publicly disclose a vulnerability until we have confirmed that a
fix or mitigation is available.

## In-Scope Findings

- Authentication or session bypass.
- Unauthorized access to another user's profile, progress, wallet, badges, or
  certificates.
- Cross-site scripting, HTML injection, or unsafe DOM injection.
- Exposed credentials, private source files, local databases, or build artifacts.
- Supabase Row-Level Security or privileged RPC weaknesses.
- Deployment misconfiguration that exposes non-public files or administrative data.
- Privacy leaks involving account identity or user-generated content.
- Weakness in the QR passcode verifier or in any stored credential path.

## Out of Scope

- Reports that only disclose a dependency vulnerability without a demonstrated
  impact on this project.
- Social engineering, phishing, or physical attacks.
- Denial-of-service or stress-testing requests.
- Automated scanner output without a reproducible finding.
- Vulnerabilities in third-party providers that cannot be mitigated or demonstrated
  through this project.
- Findings that require a user to deliberately expose their own credentials or
  private local files.
- Missing security headers on routes that only serve cached static assets.

## Security Controls

These are the controls actually enforced in this repository and by the deployment
configuration. The first group is verified automatically on every build.

### Enforced by the build

- `build.js` is **deny-list** based: it recreates `dist/` from the source tree and
  excludes environment files, databases, local agent state, dependency trees,
  source-only directories, archives, and selected large model paths. Because the
  filter is a deny-list, new files ship by default — review before committing.
- `scripts/production-check.js` fails the build when required outputs are missing,
  forbidden paths appear in `dist/`, or a source file that should not ship is
  present.
- `scripts/seo-check.js` fails the build when a page listed in `sitemap.xml` is
  missing required metadata, when a page references a route that does not exist,
  or when two pages claim the same title or description.
- `scripts/security-check.js` fails the build when a security invariant regresses:
  `SECURITY.md` must exist; `col-auth.js` must not persist a live session to
  `localStorage`; QR passcodes must use salted PBKDF2 verifiers and never store
  plaintext passwords; the Traffic objective list must stay in step with the
  engine; and the repository must not contain a second CodeQL workflow.
- `scripts/audit-pages.js` resolves every internal `src`/`href` against the built
  tree and reports pages with incomplete head metadata.
- `.vercelignore` controls what is uploaded to the Vercel build, independently of
  what `build.js` emits.

### Enforced by the deployment

- Security headers and cache rules are defined in `vercel.json`: HSTS,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a referrer policy, a
  permissions policy, and a report-only Content-Security-Policy.
- `X-Robots-Tag: noindex` is applied to internal routes (`/admin`, `/dashboard`,
  `/q`, `/qr`, `/rpg`, `/verify`, `/feedback`, `/sitemap`, and the internal
  `/Traffic/*` pages).
- Clean URLs are enabled and every public route resolves to a static file.

### Enforced by the code

- Authentication identity is resolved from the live Supabase session; stale local
  profiles must not be presented as signed-in accounts. Local credentials and
  QR passcodes are never stored as plaintext.
- Supabase access is protected by Row-Level Security and security-definer function
  reviews.
- Service-worker caching excludes configuration, analytics, and dynamic endpoints.
- The Electron desktop shell runs with `contextIsolation` enabled, Node integration
  disabled, sandboxing on, and web security left intact. These flags are asserted
  by `scripts/security-check.js`.
- `config.json` is publishable configuration and must never contain secrets;
  secrets belong in environment variables that never enter the repository or the
  build artifact.

### Continuous analysis

- GitHub code scanning (CodeQL) analyzes maintained JavaScript/TypeScript and
  Python source using `.github/codeql/codeql-config.yml`; generated output,
  vendored libraries, and local agent directories are excluded.
- DevSkim pattern scanning, Defender for DevOps, and Dependabot cover dependency
  and secret hygiene across the root and the nested `Traffic/` package.

## Data We Handle

The production site stores the minimum needed to run the tools. Progression data
(level completion, certificates, badges, wallet) is tied to the live Supabase
account; local profiles exist only to support offline setup and are never shown as
a signed-in identity. Camera frames in the gesture tool, audio in Cereal, and
keystrokes in ATI are processed on-device and are not uploaded by the web build.
See `privacy.html` for the published policy.

## Safe Harbor

Good-faith research is authorized when it:

- Uses only accounts and data you own or have permission to test.
- Avoids privacy violations, data destruction, persistence, and denial of service.
- Stops immediately if unrelated personal data or credentials are encountered.
- Gives the maintainers reasonable time to remediate before disclosure.

This safe-harbor statement does not authorize attacks against third-party services,
accounts, or infrastructure.
