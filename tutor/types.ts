import type { LearnerContext } from '../schemas/mcp-contract.js';

export type TutorAction =
  | 'diagnose'
  | 'teach'
  | 'practice'
  | 'assess'
  | 'review'
  | 'increase-difficulty';

export type AgentName =
  | 'tutor'
  | 'diagnostic'
  | 'practice'
  | 'assessment'
  | 'coach'
  | 'evidence';

export interface SkillState {
  skill: string;
  mastery: number;
  confidence: number;
  attempts: number;
  recentAccuracy: number;
  consecutiveErrors: number;
  lastUpdatedAt: string;
}

export interface LearnerModel {
  learner: LearnerContext;
  skills: Record<string, SkillState>;
  goals: string[];
  recurringErrors: string[];
  sessionCount: number;
  updatedAt: string;
}

export interface TutorRequest {
  learnerId: string;
  skill: string;
  intent?: 'learn' | 'practice' | 'review' | 'assess';
}

export interface TutorDecision {
  learnerId: string;
  skill: string;
  action: TutorAction;
  rationale: string[];
  recommendedDifficulty: number;
  agents: AgentName[];
  expectedOutcome: string;
}

export interface LearningAttempt {
  learnerId: string;
  skill: string;
  correct: boolean;
  difficulty: number;
  confidence?: number;
  errorType?: string;
  timestamp?: string;
}
