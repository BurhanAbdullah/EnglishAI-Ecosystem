import { describe, expect, it } from 'vitest';
import { TutorEngine } from '../tutor/tutor-engine.js';

const learner = {
  learnerId: 'test-learner',
  proficiency: 'B1' as const,
  targetSkill: 'grammar' as const,
  learningGoal: 'Improve English grammar',
};

describe('TutorEngine', () => {
  it('creates an isolated learner model', () => {
    const engine = new TutorEngine();
    const model = engine.registerLearner(learner);
    expect(model.learner.learnerId).toBe('test-learner');
    expect(model.skills).toEqual({});
  });

  it('reteaches after repeated errors', () => {
    const engine = new TutorEngine();
    engine.registerLearner(learner);
    engine.recordAttempt({ learnerId: 'test-learner', skill: 'conditionals', correct: false, difficulty: 0.6 });
    engine.recordAttempt({ learnerId: 'test-learner', skill: 'conditionals', correct: false, difficulty: 0.6 });

    const decision = engine.decide({ learnerId: 'test-learner', skill: 'conditionals' });
    expect(decision.action).toBe('teach');
    expect(decision.agents).toContain('coach');
  });

  it('increases difficulty after sustained strong performance', () => {
    const engine = new TutorEngine();
    engine.registerLearner(learner);
    for (let i = 0; i < 8; i += 1) {
      engine.recordAttempt({ learnerId: 'test-learner', skill: 'vocabulary', correct: true, difficulty: 0.8 });
    }

    const decision = engine.decide({ learnerId: 'test-learner', skill: 'vocabulary', intent: 'practice' });
    expect(decision.action).toBe('increase-difficulty');
    expect(decision.recommendedDifficulty).toBeGreaterThan(0.85);
  });

  it('does not allow one learner to access another learner model', () => {
    const engine = new TutorEngine();
    engine.registerLearner(learner);
    expect(() => engine.decide({ learnerId: 'other-learner', skill: 'grammar' })).toThrow('Unknown learner');
  });
});
