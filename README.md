# EnglishAI-Ecosystem

> A local-first, retrieval-augmented, MCP-enabled software architecture for AI-assisted English language learning and teaching.

## 1. Scope and objective

EnglishAI-Ecosystem is a modular software and research framework for English as a second or additional language. The architecture treats language-model inference as one component of a larger learning system comprising knowledge resources, retrieval, executable learning capabilities, learner state, assessment, provenance, governance, and evaluation.

The target pedagogical loop is:

```text
ASK → EXPLAIN → PRACTISE → ATTEMPT → FEEDBACK → RETRY → IMPROVE
```

The system is designed to support learner-facing and teacher-facing workflows while keeping currently implemented components distinct from proposed production components.

## 2. Architectural model

The system is decomposed into four principal concerns:

```text
Knowledge
    │
    ├── approved resources
    ├── metadata
    └── retrieval/evidence

Inference
    │
    ├── local model/runtime
    └── language generation

Capabilities
    │
    ├── MCP services
    ├── schemas
    └── bounded operations

Learning state
    │
    ├── learner context
    ├── attempts
    ├── assessment signals
    └── progress/mastery state
```

The intended runtime separation is:

```text
Learner / Teacher
        ↓
Application / Orchestrator
        ↓
Learner Context ─── Knowledge / RAG
        ↓                     ↓
     Capability Selection ← Evidence
        ↓
Schema Validation
        ↓
Authorization / Policy
        ↓
MCP Capability
        ↓
Structured Result + Provenance
        ↓
Local LLM
        ↓
Explanation / Practice / Feedback
        ↓
Assessment Signal / Learning State
```

## 3. Runtime request lifecycle

A representative request is modelled as:

```text
1. Request received
2. Authentication / service identity established
3. Learner context loaded
4. Intent and target skill determined
5. Retrieval requirement determined
6. Authorised evidence retrieved when required
7. MCP capability selected
8. Input schema validated
9. Permission and policy checks applied
10. MCP operation executed
11. Structured result and provenance returned
12. Local LLM produces learner-facing output
13. Activity presented
14. Attempt / assessment signal recorded where permitted
15. Learning state updated where permitted
16. Subsequent practice selected
```

The complete orchestrator, persistence layer, production RAG deployment, and production transport remain implementation targets unless explicitly present in the repository.

## 4. English-learning capability model

The initial capability decomposition is:

| Capability | Responsibility | Representative operations |
|---|---|---|
| `english-content` | Authorised English-learning resources and metadata | resource lookup, passage retrieval, source metadata |
| `grammar` | Grammar analysis and instruction | error analysis, rule explanation, constrained practice |
| `vocabulary` | Lexical learning | definitions, context, collocations, word families, recall candidates |
| `reading` | Reading comprehension | passage support, questions, evidence extraction, readability signals |
| `writing` | Writing diagnosis and revision | error diagnosis, clarity feedback, rubric guidance |
| `assessment` | Measurement and validation | quiz generation, answer validation, skill tagging, mastery signals |
| `citation` | Evidence and provenance | source lookup, provenance construction, citation validation |

Capabilities are intended to remain independently testable and replaceable behind explicit contracts.

## 5. Learner-context model

The shared learner-context model currently defines:

```text
Proficiency:
A1 · A2 · B1 · B2 · C1 · C2

Skills:
grammar · vocabulary · reading · writing · speaking · listening
```

Current `learnerContextSchema` fields:

```ts
learnerContextSchema = {
  learnerId: string,
  proficiency?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
  firstLanguage?: string,
  targetSkill?: "grammar" | "vocabulary" | "reading" |
                 "writing" | "speaking" | "listening",
  courseId?: string,
  learningGoal?: string
}
```

The model is deliberately explicit so downstream services do not have to infer foundational learner state from free-form prompt text.

A future learner profile may incorporate activity history, assessment history, error patterns, vocabulary exposure, mastery estimates, feedback history, preferences, and consent/retention policy. Those extensions are not to be treated as deployed functionality until implemented and evaluated.

## 6. Retrieval-augmented generation

The conceptual RAG pipeline is:

```text
Authorised English resources
        ↓
Ingestion
        ↓
Cleaning / normalisation
        ↓
Chunking
        ↓
Metadata enrichment
        ↓
Embedding / indexing
        ↓
Candidate retrieval
        ↓
Filtering / reranking
        ↓
Evidence package
        ↓
Local LLM
        ↓
Answer + provenance
```

Retrieval metadata may include:

```text
source identifier
resource title
resource type
proficiency level
skill
topic
author/provider
version
publication information
licensing information
locator
retrieval timestamp
approval status
```

The architecture requires retrieval to respect resource authorization. The complete production vector database, embedding model, reranker, and persistence technology are implementation decisions and should not be presented as fixed unless established in the repository.

## 7. MCP capability architecture

MCP is used as the explicit capability boundary between orchestration and specialised services.

A capability contract is abstracted as:

```text
T = (N, D, I, O, V, P, S, E)
```

where:

- `N` — capability name
- `D` — description
- `I` — input schema
- `O` — output schema
- `V` — version
- `P` — permission requirements
- `S` — safety constraints
- `E` — evidence/provenance requirements

The design distinguishes MCP primitives as follows:

**Resources** — read-oriented learning, source, rubric, policy, and governance context.

**Tools** — bounded executable operations such as analysis, lookup, diagnosis, assessment, and validation.

**Prompts** — reusable pedagogical interaction patterns that structure tutoring workflows.

Execution boundary:

```text
LLM / Orchestrator
       ↓
Capability selection
       ↓
Schema validation
       ↓
Permission / policy checks
       ↓
MCP server
       ↓
Bounded operation
       ↓
Structured result
       ├── evidence / provenance
       └── diagnostics / metadata
```

The boundary exists to prevent arbitrary or implicit execution by generated model output.

## 8. Shared contracts and evidence model

The current shared TypeScript contract layer is implemented using Zod in `schemas/mcp-contract.ts`.

### Learner context

```ts
learnerContextSchema = {
  learnerId: string,
  proficiency?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
  firstLanguage?: string,
  targetSkill?: "grammar" | "vocabulary" | "reading" |
                 "writing" | "speaking" | "listening",
  courseId?: string,
  learningGoal?: string
}
```

### Provenance

```ts
provenanceSchema = {
  sourceId: string,
  title: string,
  locator?: string,
  version?: string,
  uri?: string,
  retrievedAt: ISODateTime
}
```

### Evidence

```ts
evidenceSchema = {
  quote?: string,
  explanation: string,
  provenance: Provenance[]
}
```

### Common tool envelope

```ts
toolEnvelopeSchema = {
  requestId: string,
  learner: LearnerContext,
  locale: string,
  dryRun: boolean
}
```

Current contract version: `0.1.0`.

Contract changes should be versioned deliberately. Breaking changes must not silently invalidate clients, fixtures, or evaluation artifacts.

## 9. Assessment, writing support, security, and evaluation

### Assessment and learning state

The intended signal flow is:

```text
Activity
  ↓
Attempt
  ↓
Response
  ↓
Diagnostic analysis
  ↓
Skill / error tags
  ↓
Feedback
  ↓
Mastery signal
  ↓
Future practice selection
```

The repository does not claim a validated psychometric mastery model unless such a model is explicitly implemented and evaluated.

### Writing support

The intended writing workflow is diagnostic rather than silent replacement:

```text
Learner text
    ↓
Segmentation / analysis
    ↓
Grammar + lexical + organisation diagnostics
    ↓
Evidence / explanation
    ↓
Revision guidance
    ↓
Learner revision
    ↓
Re-analysis
```

### Security and governance

Production deployment requires explicit controls for authentication, authorization, least privilege, tool allow-listing, resource allow-listing, schema validation, auditability, provenance, credential isolation, learner-data lifecycle management, and operational limits on tool execution.

### Evaluation

Evaluation is intended to measure more than model response quality. The architecture provides for assessment of:

```text
contract correctness
MCP tool reliability
retrieval recall / ranking
metadata filtering
provenance correctness
unsupported-answer rate
latency
learning improvement
error reduction
vocabulary retention
reading performance
writing revision quality
assessment calibration
learner usability
teacher usability
```

## 10. Implementation status, reproducibility, and research program

### Current status

**Prototype / active development.**

The current repository establishes the software structure, MCP-oriented architecture, shared contracts, initial capability domains, and testing foundation. It should not be interpreted as a completed production learning platform.

Current development targets include integration of the orchestrator, production RAG, persistent learner state, selected local-model runtimes, authentication/authorization, production MCP transport, observability, security controls, provenance propagation, and educational evaluation.

### Repository structure

```text
EnglishAI-Ecosystem/
├── README.md
├── LICENSE
├── CITATION.cff
├── CONTRIBUTING.md
├── apps/
│   ├── student-web/
│   └── teacher-dashboard/
├── services/
│   ├── orchestrator/
│   ├── rag/
│   ├── llm/
│   └── authentication/
├── mcp-servers/
│   ├── english-content/
│   ├── grammar/
│   ├── vocabulary/
│   ├── reading/
│   ├── writing/
│   ├── assessment/
│   └── citation/
├── knowledge/
├── learning/
├── analysis/
├── schemas/
├── configs/
├── tests/
├── scripts/
├── deployment/
├── docs/
└── research/
```

### Development environment

Current package targets:

```text
Node.js >= 20
TypeScript 5.x
ES modules
MCP TypeScript SDK v2 package
Zod 4
Vitest
tsx
```

```bash
git clone https://github.com/BurhanAbdullah/EnglishAI-Ecosystem.git
cd EnglishAI-Ecosystem
npm install
npm run typecheck
npm test
npm run test:mcp
```

Current development entry points include:

```bash
npm run dev:content
npm run dev:grammar
npm run dev:vocabulary
npm run dev:reading
npm run dev:writing
npm run dev:assessment
npm run dev:citation
```

### Reproducibility and research direction

The intended verification hierarchy is:

```text
Unit tests
   ↓
Schema / contract tests
   ↓
MCP tests
   ↓
Integration tests
   ↓
RAG evaluation
   ↓
Security / authorization tests
   ↓
End-to-end learning workflows
   ↓
Educational evaluation
```

Research questions include the effect of evidence grounding, specialised MCP capabilities, learner-context conditioning, iterative feedback, local deployment, provenance propagation, retrieval strategy, assessment signals, and teacher governance on system reliability and learning outcomes.

The repository separates implemented functionality from research hypotheses and planned production components. Claims should be supported by code, tests, experimental protocols, or published evaluation rather than by architectural intent alone.

## Leadership and contribution

**Burhan Abdullah** — Project Lead / Lead Contributor  
https://github.com/BurhanAbdullah

**Dr. Mudasir Rahman** — Project Lead / Lead Contributor  
https://github.com/Drmudasirrahman

The repository is open to direct contributions through GitHub. Contributions may address software engineering, MCP services, schemas, RAG, English-language resources, pedagogy, assessment, evaluation, documentation, reproducibility, or related research infrastructure.

## License

MIT License. See [`LICENSE`](./LICENSE).
