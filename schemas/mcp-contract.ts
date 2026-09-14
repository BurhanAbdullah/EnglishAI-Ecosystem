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
  uri: z.string().min(1).optional(),
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

export type LearnerContext = z.infer<typeof learnerContextSchema>;
export type Provenance = z.infer<typeof provenanceSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;

export const contractVersion = '0.1.0';
