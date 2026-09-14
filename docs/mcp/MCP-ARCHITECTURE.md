# MCP Architecture

## Objective

EnglishAI-Ecosystem uses MCP as the capability boundary between the local AI orchestrator and specialized English-learning services. The current implementation follows the MCP TypeScript SDK v2 model, where servers expose tools, resources, and prompts. The official SDK v2 implements the 2026-07-28 MCP specification. citeturn226514search0turn226514search6

## Primitive mapping

### Resources

Resources are read-only learning or governance data: passages, grammar topic material, rubrics, policies, source metadata, and approved content. The SDK treats resources as application-controlled context that the client can list and read. citeturn226514search2

### Tools

Tools perform bounded operations such as search, grammar analysis, vocabulary lookup, writing diagnosis, assessment creation, and citation validation. Tool inputs and outputs are schema-defined.

### Prompts

Prompts provide reusable, pedagogically constrained interaction patterns such as grammar tutoring, reading tutoring, writing coaching, vocabulary coaching, and evidence-grounded answers.

## Shared contract

The project models each capability as:

```text
T = (N, D, I, O, V, P, S, E)
```

where:

- `N`: capability name
- `D`: description
- `I`: input schema
- `O`: output schema
- `V`: version
- `P`: permission requirements
- `S`: safety constraints
- `E`: evidence/provenance requirements

## Request lifecycle

```text
Student request
      |
      v
Intent + learner context
      |
      v
Orchestrator
      |
      +--> Retrieval required? --> RAG / English Content
      |
      +--> Specialized operation? --> MCP tool
      |
      v
Schema validation + permission checks
      |
      v
Tool execution
      |
      v
Structured result + provenance
      |
      v
Local LLM explanation
      |
      v
Learner-facing answer / practice / feedback
      |
      v
Attempt and learning event (where permitted)
```

## Why separate servers

Separate servers prevent the language model from becoming coupled to one monolithic tool implementation. Grammar logic, vocabulary services, reading support, writing diagnostics, assessment, and provenance can evolve independently while keeping a stable protocol boundary.

## Security and governance requirements

The implementation must evolve from the current development data into:

1. allow-listed tools and resource URIs;
2. authenticated and authorized server access for institutional deployments;
3. least-privilege service accounts;
4. schema validation at the boundary;
5. input/output size and latency limits;
6. audit events for sensitive operations;
7. provenance propagation for source-backed outputs;
8. faculty-controlled assessment and content policies;
9. explicit treatment of learner data retention and deletion;
10. separate production credentials and secrets management.

The current repository intentionally does not embed secrets or external service credentials.

## Implementation basis

The repository uses the current official TypeScript v2 packages rather than the older monolithic v1 package. The v2 server package exposes the `McpServer` API for tools, resources, and prompts, and the official getting-started guidance targets Node.js 20+ with ESM. citeturn226514search0turn226514search3turn226514search9
