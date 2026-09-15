import { describe, expect, it } from 'vitest';
import { learnerContextSchema, provenanceSchema } from '../../schemas/mcp-contract.js';

describe('shared MCP contracts', () => {
  it('accepts a valid learner context', () => {
    const result = learnerContextSchema.safeParse({ learnerId: 'learner-001', proficiency: 'B1', targetSkill: 'grammar', courseId: 'ENG-B1' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid proficiency level', () => {
    const result = learnerContextSchema.safeParse({ learnerId: 'learner-001', proficiency: 'B7' });
    expect(result.success).toBe(false);
  });

  it('requires provenance source identity', () => {
    const result = provenanceSchema.safeParse({ title: 'Grammar Source', retrievedAt: new Date().toISOString() });
    expect(result.success).toBe(false);
  });

  it('accepts the full CEFR proficiency range', () => {
    for (const proficiency of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
      const result = learnerContextSchema.safeParse({ learnerId: 'learner-001', proficiency });
      expect(result.success).toBe(true);
    }
  });

  it('rejects a blank learner identifier', () => {
    const result = learnerContextSchema.safeParse({ learnerId: '', proficiency: 'B1' });
    expect(result.success).toBe(false);
  });

  it('accepts provenance when source identity is present', () => {
    const result = provenanceSchema.safeParse({
      title: 'Grammar Source',
      source: 'https://example.org/grammar',
      retrievedAt: new Date().toISOString()
    });
    expect(result.success).toBe(true);
  });
});
