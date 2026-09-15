import type { LearningAttempt, SkillState } from './types.js';

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Conservative baseline knowledge-tracing update.
 * This is intentionally deterministic so the adaptive loop is testable before
 * introducing learned mastery models.
 */
export function updateSkillState(
  previous: SkillState | undefined,
  attempt: LearningAttempt,
  now = new Date().toISOString(),
): SkillState {
  const priorMastery = previous?.mastery ?? 0.5;
  const priorConfidence = previous?.confidence ?? 0.5;
  const priorAttempts = previous?.attempts ?? 0;
  const priorAccuracy = previous?.recentAccuracy ?? 0.5;
  const priorErrors = previous?.consecutiveErrors ?? 0;

  const evidence = attempt.correct ? 0.12 : -0.14;
  const difficultyAdjustment = (attempt.difficulty - 0.5) * 0.06;
  const mastery = clamp(priorMastery + evidence + difficultyAdjustment);
  const confidence = clamp(
    priorConfidence + (attempt.correct ? 0.08 : -0.06) + ((attempt.confidence ?? 0.5) - 0.5) * 0.04,
  );
  const recentAccuracy = clamp(priorAccuracy * 0.7 + (attempt.correct ? 1 : 0) * 0.3);

  return {
    skill: attempt.skill,
    mastery,
    confidence,
    attempts: priorAttempts + 1,
    recentAccuracy,
    consecutiveErrors: attempt.correct ? 0 : priorErrors + 1,
    lastUpdatedAt: attempt.timestamp ?? now,
  };
}
