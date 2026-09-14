# MCP Servers

This directory contains the Model Context Protocol capability layer for EnglishAI-Ecosystem.

## Contract

Every server follows the same conceptual contract:

`T = (N, D, I, O, V, P, S, E)`

where `N` is name, `D` description, `I` input schema, `O` output schema, `V` version, `P` permissions, `S` safety constraints, and `E` evidence/provenance requirements.

## Servers

| Server | Primary responsibility | Example resources | Example tools |
|---|---|---|---|
| English Content | Authorized learning content | texts, lessons, source metadata | search_content, fetch_source |
| Grammar | Grammar learning | grammar topics, rules, examples | explain_grammar, analyze_grammar, generate_practice |
| Vocabulary | Lexical learning | words, collocations, examples | lookup_word, analyze_vocabulary, generate_vocab_practice |
| Reading | Reading skills | passages, questions, evidence | create_questions, find_evidence, explain_reading |
| Writing | Writing skills | rubrics, writing guidance | analyze_writing, suggest_revision, score_rubric |
| Assessment | Learning measurement | attempts, skills, rubrics | create_assessment, validate_answer, record_attempt |
| Citation | Provenance and evidence | sources, citations | validate_citation, build_evidence_bundle |

## Interaction pattern

A student request is routed through the orchestrator. The orchestrator determines whether retrieval, an MCP tool, or a combination is needed. Tool input is schema-validated; tool execution is permission-checked; outputs are normalized and accompanied by provenance when the operation uses institutional content.

The student interface should receive explanations and learning feedback, not raw infrastructure details.
