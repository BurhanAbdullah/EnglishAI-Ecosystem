<picture>
  <source media="(prefers-color-scheme: dark)" srcset="englishai/banner-dark.svg">
  <img alt="EnglishAI Ecosystem" src="englishai/banner.svg">
</picture>

<p align="center">
  <a href="https://burhanabdullah.github.io/EnglishAI-Ecosystem/"><img alt="Live site" src="https://img.shields.io/badge/live%20site-github%20pages-1B2A4A"></a>
  <a href="./LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-1B2A4A"></a>
  <img alt="Status" src="https://img.shields.io/badge/status-prototype-C43D3D">
  <img alt="MCP" src="https://img.shields.io/badge/MCP-enabled-1B2A4A">
</p>

<p align="center"><i>A local, RAG- and MCP-enabled AI ecosystem for teaching English as a second/additional language.</i></p>

---

EnglishAI Ecosystem is a learning platform, not a chatbot wrapper. It combines an English-learning knowledge base, retrieval-augmented generation, configurable local language-model inference, Model Context Protocol (MCP) services, assessment, source provenance, and teacher controls into one learner-centred feedback loop.

**Live site:** https://burhanabdullah.github.io/EnglishAI-Ecosystem/

## Project leadership

**Burhan Abdullah** — Project Lead · Lead Contributor  
https://github.com/BurhanAbdullah

**Dr. Mudasir Rahman** — Project Lead · Lead Contributor  
https://github.com/Drmudasirrahman

The project is open to direct GitHub contributions and to applicants who want to join the coordinated collaboration group.

## Why it's built this way

- **Learner-first.** Explanations and exercises adapt to proficiency, task, and learning context.
- **Evidence-grounded.** Retrieved content carries source and provenance metadata, so answers can be checked.
- **Local-first.** A local LLM is a deployment choice, not an institution-only requirement. An individual, research team, school, university, organisation, or other deployment owner can operate a configurable local model environment.
- **Tool-safe.** Every tool the model can call is explicit, typed, validated, permissioned, and auditable.
- **Teacher-governed.** Where teacher controls are used, educators can manage approved resources, rubrics, assessment settings, and publication.
- **Researchable.** Evaluation, ablations, audit logs, and reproducible datasets are first-class, not an afterthought.

## The learning loop

```text
Ask → Explain → Practise → Attempt → Feedback → Retry → Improve
```

The model's job is to help a learner understand why an answer is correct, practise the skill, see their own errors explained, and try again — not to produce the answer for them.

## Website

The project website is intentionally multi-page:

- **Home** — project overview and learning ecosystem.
- **Architecture** — interactive system architecture and deployment model.
- **Team** — project leads and contribution streams.
- **Contribute** — direct GitHub contribution versus coordinated group participation.
- **Join the Group** — application form collecting identity, email, role, stream, proposed contribution and suggestions.

## Joining the group

Group participation is separate from direct GitHub contribution. Applicants submit a team application through the website. The application is opened as a GitHub issue for review by the project leads. Approved applicants can receive a confirmation email from the project team.

The repository contains a GitHub Actions workflow for approval-email delivery. Email delivery requires the project maintainers to configure the appropriate repository secrets for the selected email provider.

## Direct contributions

You do not need to join the group to contribute. Fork the repository, open an issue, improve documentation, add tests, improve the English-learning modules, build MCP services, work on RAG/local-model integration, or submit a pull request.

See `CONTRIBUTING.md` for the contribution model.

## What's inside

| Module | Does |
|---|---|
| **Grammar Coach** | Rule explanations, examples, error analysis, level-aware practice |
| **Vocabulary Builder** | Words in context, definitions, word families, spaced recall |
| **Reading Lab** | Passages, comprehension questions, vocabulary support, evidence extraction |
| **Writing Studio** | Feedback on grammar, clarity, and organisation — without rewriting the learner's voice |
| **Assessment** | Diagnostic and formative activities linked to level and skill mastery |
| **MCP Learning Tools** | Controlled access to specialist English resources through explicit, typed interfaces |

## Architecture

```text
English learning resources
            │
            ▼
   Knowledge base + metadata
            │
            ▼
        RAG / retrieval
            │
            ▼
   Configurable Local LLM
            │
            ▼
    MCP integration layer
   ╱     │      │      ╲
Grammar Vocabulary Reading Writing Assessment Citation
   ╲     │      │      ╱
       Learning experience
            │
            ▼
     Feedback + assessment
            │
            ▼
       Learner progress
```

The local model is intentionally described as configurable deployment. The operator controls the model/runtime environment and decides what resources and tools it can access. The same architecture can therefore be adapted to personal, research, educational, organisational or other controlled environments.

## MCP servers

| Server | Responsibility |
|---|---|
| `english-content` | Authorized resources, passages, examples, and source metadata |
| `grammar` | Explanations, error analysis, constrained practice generation |
| `vocabulary` | Definitions, collocations, word families, spaced-practice candidates |
| `reading` | Comprehension support, question generation, readability signals |
| `writing` | Diagnostics, revision guidance, rubric-aligned feedback |
| `assessment` | Quizzes, answer validation, skill tagging, mastery signals |
| `citation` | Provenance records, source lookup, citation validation |

Every server exposes MCP resources, tools, and prompts. All tool contracts are versioned and validated — nothing is called implicitly.

## Repository layout

```text
EnglishAI-Ecosystem/
├── README.md · LICENSE · CITATION.cff · CONTRIBUTING.md
├── docs/
├── englishai/        public multi-page website and assets
├── web/              learner interface
├── apps/             student-web/, teacher-dashboard/
├── services/         orchestrator/, rag/, llm/, auth/
├── mcp-servers/      English learning MCP services
├── knowledge/        ingestion/, preprocessing/, metadata/, indexes/
├── learning/ · analysis/ · schemas/ · configs/
├── tests/             unit/, integration/, mcp/, rag/, security/, evaluation/
├── scripts/ · deployment/ · research/
└── .github/workflows/ Pages deployment and team-approval email workflow
```

## Development status

The MCP layer and front-end prototype are established. The next stage is connecting the web interface to the orchestrator, RAG service, local LLM, and persistent learner profiles over production MCP transports — each gated on authentication, authorization, provenance, safety and evaluation contracts.

## Getting started

```bash
git clone https://github.com/BurhanAbdullah/EnglishAI-Ecosystem.git
cd EnglishAI-Ecosystem
npm install
```

See `docs/architecture/` for system design and `docs/mcp/` for server contracts.

## License

MIT