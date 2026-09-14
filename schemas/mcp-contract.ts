import { z } from 'zod/v4';

export const proficiencyLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export const skillAreas = ['grammar', 'vocabulary', 'reading', 'writing', 'speaking', 'listening'] as const;

export const learnerContextSchema = z.object({
  learnerId: z.string().min(1),
  proficiency: z.enum(proficiencyLevels).optional(),
  firstLanguage: z.string().min(2).optional(),
  targetSkill: z.enum(skillAreas).optional(),
  courseId: z.string().min(1).optional(),
  learningGoal: z.string().min(1).optional()
});

export const provenanceSchema = z.object({
  sourceId: z.string().min(1),
  title: z.string().min(1),
  locator: z.string().min(1).optional(),
  version: z.string().min(1).optional(),
  uri: z.string().url().optional(),
  retrievedAt: z.string().datetime()
});

export const evidenceSchema = z.object({
  quote: z.string().min(1).optional(),
  explanation: z.string().min(1),
  provenance: z.array(provenanceSchema).default([])
});

export const toolEnvelopeSchema = z.object({
  requestId: z.string().min(1),
  learner: learnerContextSchema,
  locale: z.string().min(2).default('en'),
  dryRun: z.boolean().default(false)
});

export const capabilityNameSchema = z.string().regex(/^[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*$/);

export const permissionSchema = z.object({
  scope: z.string().min(1),
  reason: z.string().min(1).optional()
});

export const safetyConstraintSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1)
});

/** Stable metadata contract for an MCP capability exposed to the orchestrator. */
export const capabilityContractSchema = z.object({
  name: capabilityNameSchema,
  description: z.string().min(1),
  inputSchema: z.record(z.string(), z.unknown()),
  outputSchema: z.record(z.string(), z.unknown()),
  version: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
  permissions: z.array(permissionSchema).default([]),
  safetyConstraints: z.array(safetyConstraintSchema).default([]),
  requiresEvidence: z.boolean().default(false)
});

export type LearnerContext = z.infer<typeof learnerContextSchema>;
export type Provenance = z.infer<typeof provenanceSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type ToolEnvelope = z.infer<typeof toolEnvelopeSchema>;
export type CapabilityContract = z.infer<typeof capabilityContractSchema>;

export const contractVersion = '0.1.0';
