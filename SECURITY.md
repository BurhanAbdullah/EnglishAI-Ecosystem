# Security

EnglishAI Ecosystem is an active-development project. Production deployment must keep implemented controls separate from planned controls.

## Required controls

- HTTPS/TLS for every public endpoint.
- Passwords must be handled only by a vetted authentication library and stored as Argon2id or bcrypt hashes. Plaintext passwords are prohibited.
- Sessions must use secure, HttpOnly cookies. Authentication tokens must not be stored in browser localStorage.
- Server-side RBAC is mandatory for learner and administrator routes.
- Administrative actions must produce an immutable audit record.
- State-changing browser requests require CSRF protection appropriate to the selected authentication architecture.
- Authentication, signup, password reset, join, and MCP-facing endpoints require rate limiting.
- Validate all API inputs with explicit schemas such as Zod.
- Never accept or proxy CV uploads. The join workflow stores a validated Google Drive URL only.
- Do not fetch applicant CV URLs from the server. Admins open them manually to avoid SSRF and file-proxy risks.
- Secrets belong in the deployment environment, never in source control.
- Logs must not contain passwords, access tokens, session cookies, or complete private CV URLs.
- Database credentials must use least privilege.
- Dependency and secret scanning should run in CI.

## Current implementation boundary

The repository contains an existing lightweight GitHub OAuth prototype. It is not the final production authentication implementation because it uses custom session signing and does not provide persistent user storage. It must not be presented as production-complete.

The PostgreSQL schema and initial migration in `prisma/` define the persistence target for users, learner profiles, usage events, usage policy, join applications, and administrator audit logs.

## Production decisions still required

Before deployment, select the managed PostgreSQL/authentication provider and configure the corresponding environment variables. No paid provider should be enabled without project-owner approval.

After provider selection, the implementation must be validated with automated tests covering authentication, RBAC, usage limits, Google Drive URL validation, CSRF, rate limiting, and administrative audit logging.
