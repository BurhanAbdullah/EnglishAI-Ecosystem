# EnglishAI-Ecosystem

A local, RAG- and MCP-enabled AI ecosystem for teaching English as a second/additional language.

EnglishAI-Ecosystem is designed as a learning platform rather than a chatbot-only application. It combines an English-learning knowledge base, local language-model inference, retrieval-augmented generation (RAG), Model Context Protocol (MCP) services, learning tools, assessment, provenance, teacher controls, and a learner-centered feedback loop.

## Live website

**EnglishAI Ecosystem:** https://burhanabdullah.github.io/EnglishAI-Ecosystem/

The project website is deployed from the `englishai/` and `web/` frontend assets through GitHub Pages Actions. The landing page uses the EnglishAI Ecosystem logo, project banner, interactive learner interface, and system architecture visual.

## Web experience

The repository includes a responsive learner interface in `web/` and the public-site assets in `englishai/`.

The learner interface includes:

- EnglishAI Tutor conversation interface
- Grammar, vocabulary, reading, writing, and assessment entry points
- learner proficiency selector
- guided learning prompts
- progress and skill map
- MCP architecture overview
- responsive mobile/desktop layout
- light/dark appearance toggle
- local browser persistence for practice and visitor counts

The browser UI is deliberately backend-neutral: the interaction shell can be connected to the orchestrator and MCP client layer without redesigning the learner experience.

## Core learning loop

`Ask -> Explain -> Practise -> Feedback -> Revise -> Improve`

The AI should help learners understand why an answer is correct, practise the skill, identify weaknesses, and retry. It should not simply replace student work.

## Architecture

```text
English Learning Resources
          |
          v
  Knowledge Base + Metadata
          |
          v
     RAG / Retrieval
          |
          v
       Local LLM
          |
          v
   MCP Integration Layer
     /    |      |    \\
    v     v      v     v
Grammar Vocabulary Writing Assessment ...
     \\    |      |    /
      \\   |      |   /
       v  v      v  v
       Student / Teacher UI
```

The architecture graphic is maintained as `englishai/architecture.svg`; the project identity graphic is maintained as `englishai/logo.svg`.

## MCP server model

The first-class MCP servers are:

- `english-content`: authorized English-learning resources, passages, examples, course materials, and source metadata.
- `grammar`: explanations, error analysis, constrained practice generation, and grammar-level feedback.
- `vocabulary`: definitions, collocations, word families, examples, spaced practice candidates, and level-aware support.
- `reading`: reading comprehension support, question generation, evidence extraction, and readability signals.
- `writing`: writing diagnostics, revision guidance, rubric-aligned feedback, and error categorization without silently rewriting the learner's work.
- `assessment`: quizzes, answer validation, skill tagging, attempts, mastery signals, and teacher-controlled assessment policies.
- `citation`: provenance records, source lookup, citation validation, and evidence bundles for retrieved material.

Servers expose MCP resources, tools, and prompts. All tool contracts are versioned and validated.

## Repository layout

```text
EnglishAI-Ecosystem/
├── README.md
├── LICENSE
├── CITATION.cff
├── docs/
│   ├── architecture/
│   ├── methodology/
│   ├── pedagogy/
│   ├── rag/
│   ├── mcp/
│   ├── assessment/
│   └── evaluation/
├── englishai/
│   ├── index.html
│   ├── banner.svg
│   ├── logo.svg
│   └── architecture.svg
├── web/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── apps/
│   ├── student-web/
│   └── teacher-dashboard/
├── services/
│   ├── orchestrator/
│   ├── rag/
│   ├── llm/
│   └── auth/
├── mcp-servers/
│   ├── english-content/
│   ├── grammar/
│   ├── vocabulary/
│   ├── reading/
│   ├── writing/
│   ├── assessment/
│   └── citation/
├── knowledge/
│   ├── ingestion/
│   ├── preprocessing/
│   ├── metadata/
│   ├── indexes/
│   └── datasets/
├── learning/
├── analysis/
├── schemas/
├── configs/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── mcp/
│   ├── rag/
│   ├── security/
│   └── evaluation/
├── scripts/
├── deployment/
└── research/
```

## Design principles

1. Learner-first: explanations and exercises are adapted to proficiency, task, and learning context.
2. Evidence-grounded: retrieved content is associated with source and provenance metadata.
3. Local-first: institutional materials and learner data can remain inside institutional infrastructure.
4. Tool-safe: tool access is explicit, typed, validated, permissioned, and auditable.
5. Teacher-governed: faculty control approved resources, courses, rubrics, assessment settings, and publication policies.
6. Researchable: evaluation, ablation, audit logs, and reproducible datasets are first-class components.

## User counter note

The current bottom-of-page counter is intentionally local and privacy-friendly: it counts distinct browsers that have visited the page using `localStorage`. It is **not** a global concurrent-user or total-user count. A real global counter should be added through the backend once deployment infrastructure is connected.

## Development status

The MCP layer and full front-end prototype are established. The next integration stage is to connect the web interface to the orchestrator, RAG service, local LLM, persistent learner profiles, and production MCP transports. These backends should be connected only after their authentication, authorization, provenance, validation, and evaluation contracts are in place.

## Author

Burhan Abdullah
