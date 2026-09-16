# Modern English UX implementation

This milestone implements the requested account and learner-state surfaces without replacing the existing MCP tutor.

## Design tokens

`assets/tokens.css` centralizes the values already present in the existing site CSS: white/near-black surfaces, `#e10600` accent, Inter/system typography, borders, shadows, radii, and spacing. The existing stylesheet defines the same core palette and Inter family. fileciteturn4file0

## Routes

- `/login.html` — learner login surface. Email/password UI is present as a contract placeholder; the currently configured backend exposes GitHub OAuth, so the GitHub action remains the working authentication path. fileciteturn8file0
- `/signup.html` — existing GitHub account entry surface.
- `/admin/login.html` — visually separate administrative entry surface with the same token system.
- `/profile.html` — reusable learner profile editor/onboarding form.
- `/learner.html` — existing adaptive diagnostic/practice workspace, preserved and still wired to the MCP assessment gateway. fileciteturn6file0
- `/dashboard.html` — personalized learner dashboard backed by the same browser learner state used by the tutor.

## Authentication boundary

The frontend currently calls `https://englishai-auth-api.onrender.com` for session state and GitHub OAuth. It does not contain an application password API, so the new email/password forms deliberately do not pretend to authenticate until a corresponding backend contract is implemented. fileciteturn5file0

## Verification

The repository's Pages workflow already runs TypeScript checks, tests, and `validate:site` before deployment. fileciteturn23file0
