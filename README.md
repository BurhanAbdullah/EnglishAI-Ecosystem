# EnglishAI-Ecosystem

A local, RAG- and MCP-enabled AI ecosystem for teaching English as a second/additional language.

EnglishAI-Ecosystem is designed as a learning platform rather than a chatbot-only application. It combines an English-learning knowledge base, local language-model inference, retrieval-augmented generation (RAG), Model Context Protocol (MCP) services, learning tools, assessment, provenance, teacher controls, and a learner-centered feedback loop.

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
     /    |      |    \
    v     v      v     v
Grammar Vocabulary Writing Assessment ...
     \    |      |    /
      \   |      |   /
       v  v      v  v
       Student / Teacher UI
```

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

## Development status

The repository is being established as a research-grade implementation. The MCP layer is intentionally designed before adding a full student UI so that educational capabilities remain modular, testable, and auditable.

## Author

Burhan Abdullah
