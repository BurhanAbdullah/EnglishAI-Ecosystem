import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod/v4';

const server = new McpServer({ name: 'citation', version: '0.1.0' });

const sourceSchema = z.object({
  sourceId: z.string().min(1),
  title: z.string().min(1),
  uri: z.string().min(1),
  author: z.string().optional(),
  year: z.number().int().min(0).optional()
});

server.registerResource(
  'citation-policy',
  'english://citation/policy',
  { title: 'Citation and provenance policy', description: 'Rules for source-aware learning responses.', mimeType: 'text/plain' },
  async uri => ({ contents: [{ uri: uri.href, mimeType: 'text/plain', text: 'Every institutional source used for generated learning evidence must retain sourceId, title, and URI. Generated claims must not be presented as quotations unless the source text contains them.' }] })
);

server.registerTool(
  'validate_citation',
  {
    description: 'Validate the minimum provenance fields for a citation record.',
    inputSchema: sourceSchema,
    outputSchema: z.object({ valid: z.boolean(), errors: z.array(z.string()), source: sourceSchema })
  },
  async source => {
    const errors: string[] = [];
    if (!/^https?:\/\//.test(source.uri) && !/^english:\/\//.test(source.uri)) errors.push('URI must be an HTTP(S) or institutional english:// URI.');
    const value = { valid: errors.length === 0, errors, source };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerTool(
  'build_evidence_bundle',
  {
    description: 'Build a normalized evidence bundle for a learner-facing explanation.',
    inputSchema: z.object({ claim: z.string().min(1), sources: z.array(sourceSchema).min(1).max(10), explanation: z.string().min(1) }),
    outputSchema: z.object({ claim: z.string(), explanation: z.string(), citations: z.array(sourceSchema) })
  },
  async ({ claim, sources, explanation }) => {
    const value = { claim, explanation, citations: sources };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerTool(
  'format_citation',
  {
    description: 'Format a source into a simple human-readable citation string.',
    inputSchema: sourceSchema,
    outputSchema: z.object({ apaLike: z.string(), source: sourceSchema })
  },
  async source => {
    const apaLike = `${source.author ?? 'Institutional source'}${source.year ? ` (${source.year})` : ''}. ${source.title}. ${source.uri}`;
    const value = { apaLike, source };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerPrompt(
  'evidence_grounded_answer',
  {
    description: 'Guide the model to distinguish sourced evidence from explanation.',
    argsSchema: z.object({ question: z.string().min(1), level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1') })
  },
  async ({ question, level }) => ({ messages: [{ role: 'user', content: { type: 'text', text: `Answer for a ${level} English learner: ${question}. Separate source-supported evidence from your explanation. Do not invent quotations. Include source identifiers for retrieved material.` } }] })
);

await serveStdio(server);
