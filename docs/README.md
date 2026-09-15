# EnglishAI Ecosystem Website

This directory contains the static research-community website for EnglishAI Ecosystem.

## GitHub Pages

Recommended Pages configuration:

- **Source:** GitHub Actions
- **Workflow:** `.github/workflows/pages.yml`
- **Artifact:** `./docs`

The site includes:

- Home
- Platform
- Capabilities
- Architecture
- Research programme
- Documentation
- Research community application (`join.html`)

## Community application

The application page deliberately does not upload CVs to the public repository. Applicants provide a CV URL (or other shareable link) and conceptual responses; the page prepares an email that the applicant reviews before sending.

For production recruitment, replace the mailto flow with a privacy-aware form backend before collecting uploaded CV files or other personal data.
