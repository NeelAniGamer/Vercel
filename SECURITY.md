# Security Policy

Class Of Learners takes security reports seriously. This policy covers the public
Class Of Learners website, the Traffic Academy, and the other interactive tools
hosted on the production Vercel site.

## Supported Versions

Security fixes are provided for the current production release and the previous
release line while it remains actively maintained. The version labels below are
used for release tracking in this repository.

| Version | Supported |
| ------- | --------- |
| 5.1.x (current production line) | :white_check_mark: |
| 5.0.x (previous release line) | :x: |
| 4.0.x (security-only support) | :white_check_mark: |
| < 4.0 | :x: |

The `Cyberpunk/` archive and local desktop builds are not part of the supported
public production surface.

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

## Security Controls

- Production builds use an allowlisted Vercel output directory and exclude local
  agent configuration, environment files, databases, dependencies, and Cyberpunk
  archive code.
- Security headers and cache rules are defined in `vercel.json`.
- Authentication identity is resolved from the live Supabase session; stale local
  profiles must not be presented as signed-in accounts. Local credentials and
  QR passcodes are never stored as plaintext.
- Supabase access is protected by Row-Level Security and security-definer function
  reviews.
- Service-worker caching excludes configuration, analytics, and dynamic endpoints.
- `npm run verify:production` checks the generated output for unsafe files, missing
  local routes, and security regressions.
- GitHub code scanning analyzes maintained JavaScript/TypeScript and Python source
  using `.github/codeql/codeql-config.yml`; generated and local-agent paths are
  excluded.

## Safe Harbor

Good-faith research is authorized when it:

- Uses only accounts and data you own or have permission to test.
- Avoids privacy violations, data destruction, persistence, and denial of service.
- Stops immediately if unrelated personal data or credentials are encountered.
- Gives the maintainers reasonable time to remediate before disclosure.

This safe-harbor statement does not authorize attacks against third-party services,
accounts, or infrastructure.
