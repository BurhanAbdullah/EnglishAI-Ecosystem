import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod/v4';

const server = new McpServer({ name: 'english-content', version: '0.1.0' });

const contentItem = {
  id: 'demo-grammar-present-perfect',
  title: 'Present Perfect: Overview',
  level: 'B1',
  skill: 'grammar',
  text: 'The present perfect connects a past action or experience with the present. Example: I have visited Delhi.',
  source: 'Demo institutional learning resource',
  sourceId: 'demo-b1-grammar-001'
};

server.registerResource(
  'demo-b1-grammar',
  'english://content/demo-b1-grammar-001',
  {
    title: contentItem.title,
    description: 'Demo English-learning resource used for local development and tests.',
    mimeType: 'text/plain'
  },
  async uri => ({ contents: [{ uri: uri.href, mimeType: 'text/plain', text: contentItem.text }] })
);

server.registerTool(
  'search_content',
  {
    description: 'Search authorized English-learning content using a simple local development index.',
    inputSchema: z.object({
      query: z.string().min(1),
      level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
      skill: z.enum(['grammar', 'vocabulary', 'reading', 'writing', 'speaking', 'listening']).optional(),
      limit: z.number().int().min(1).max(20).default(5)
    }),
    outputSchema: z.object({
      results: z.array(z.object({
        id: z.string(), title: z.string(), level: z.string(), skill: z.string(), sourceId: z.string(), score: z.number()
      }))
    })
  },
  async ({ query, level, skill, limit }) => {
    const haystack = `${contentItem.title} ${contentItem.text}`.toLowerCase();
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const hits = terms.filter(term => haystack.includes(term)).length;
    const levelMatch = !level || level === contentItem.level;
    const skillMatch = !skill || skill === contentItem.skill;
    const score = terms.length === 0 ? 0 : hits / terms.length;
    const results = hits > 0 && levelMatch && skillMatch ? [{
      id: contentItem.id,
      title: contentItem.title,
      level: contentItem.level,
      skill: contentItem.skill,
      sourceId: contentItem.sourceId,
      score
    }].slice(0, limit) : [];

    return {
      structuredContent: { results },
      content: [{ type: 'text', text: JSON.stringify({ results }) }]
    };
  }
);

server.registerTool(
  'fetch_source',
  {
    description: 'Fetch an authorized content item by source identifier.',
    inputSchema: z.object({ sourceId: z.string().min(1) }),
    outputSchema: z.object({ sourceId: z.string(), title: z.string(), text: z.string(), level: z.string(), skill: z.string() })
  },
  async ({ sourceId }) => {
    if (sourceId !== contentItem.sourceId) throw new Error(`Unknown sourceId: ${sourceId}`);
    const value = {
      sourceId: contentItem.sourceId,
      title: contentItem.title,
      text: contentItem.text,
      level: contentItem.level,
      skill: contentItem.skill
    };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerPrompt(
  'explain_from_authorized_source',
  {
    description: 'Generate a grounded learner-facing explanation plan using an authorized source.',
    argsSchema: z.object({ question: z.string().min(1), level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional() })
  },
  async ({ question, level }) => ({
    messages: [{
      role: 'user',
      content: { type: 'text', text: `Explain this English-learning question at ${level ?? 'the learner\'s appropriate level'}: ${question}. Use only the authorized source returned by english-content and identify the source.` }
    }]
  })
);

await serveStdio(() => server);
