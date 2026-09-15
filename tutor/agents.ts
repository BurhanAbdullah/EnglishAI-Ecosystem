import type { AgentName, LearnerModel, TutorDecision, TutorRequest } from './types.js';

export interface AgentInput {
  learner: LearnerModel;
  request: TutorRequest;
  decision: TutorDecision;
}

export interface AgentResult {
  agent: AgentName;
  status: 'planned' | 'completed' | 'blocked';
  summary: string;
  data?: Record<string, unknown>;
}

export interface TutorAgent {
  readonly name: AgentName;
  run(input: AgentInput): Promise<AgentResult>;
}

export const specialistAgentRoles: Record<AgentName, string> = {
  tutor: 'Plans the learning session and coordinates specialist capabilities.',
  diagnostic: 'Identifies skill gaps, error patterns and confidence signals.',
  practice: 'Selects or generates constrained practice activities.',
  assessment: 'Evaluates learner attempts and emits structured learning evidence.',
  coach: 'Chooses reteaching, practice, review or increased challenge based on evidence.',
  evidence: 'Retrieves authorised learning resources and preserves provenance.',
};
