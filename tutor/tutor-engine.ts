import { learnerContextSchema } from '../schemas/mcp-contract.js';
import { updateSkillState } from './mastery.js';
import { chooseTutorDecision } from './adaptation-policy.js';
import type { LearningAttempt, LearnerModel, TutorDecision, TutorRequest } from './types.js';

export class TutorEngine {
  private readonly learners = new Map<string, LearnerModel>();

  registerLearner(input: LearnerModel['learner']): LearnerModel {
    const learner = learnerContextSchema.parse(input);
    const existing = this.learners.get(learner.learnerId);
    if (existing) return existing;

    const model: LearnerModel = {
      learner,
      skills: {},
      goals: learner.learningGoal ? [learner.learningGoal] : [],
      recurringErrors: [],
      sessionCount: 0,
      updatedAt: new Date().toISOString(),
    };
    this.learners.set(learner.learnerId, model);
    return model;
  }

  getLearner(learnerId: string): LearnerModel | undefined {
    return this.learners.get(learnerId);
  }

  recordAttempt(attempt: LearningAttempt): LearnerModel {
    const model = this.learners.get(attempt.learnerId);
    if (!model) throw new Error(`Unknown learner: ${attempt.learnerId}`);

    model.skills[attempt.skill] = updateSkillState(model.skills[attempt.skill], attempt);
    if (attempt.errorType && !model.recurringErrors.includes(attempt.errorType)) {
      model.recurringErrors.push(attempt.errorType);
    }
    model.sessionCount += 1;
    model.updatedAt = new Date().toISOString();
    return model;
  }

  decide(request: TutorRequest): TutorDecision {
    const model = this.learners.get(request.learnerId);
    if (!model) throw new Error(`Unknown learner: ${request.learnerId}`);
    return chooseTutorDecision(request, model.skills[request.skill]);
  }
}
