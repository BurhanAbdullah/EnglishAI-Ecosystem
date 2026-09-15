import type { SkillState, TutorAction, TutorDecision, TutorRequest } from './types.js';

export function chooseTutorDecision(request: TutorRequest, state?: SkillState): TutorDecision {
  const skill = state?.skill ?? request.skill;
  const mastery = state?.mastery ?? 0.5;
  const accuracy = state?.recentAccuracy ?? 0.5;
  const errors = state?.consecutiveErrors ?? 0;
  const intent = request.intent ?? 'learn';

  let action: TutorAction;
  let difficulty = mastery;
  const rationale: string[] = [];

  if (intent === 'assess') {
    action = 'assess';
    rationale.push('The learner explicitly requested assessment.');
  } else if (errors >= 2 || mastery < 0.4) {
    action = 'teach';
    difficulty = Math.max(0.2, mastery - 0.1);
    rationale.push('Mastery is low or the learner has repeated consecutive errors.');
    rationale.push('Reteaching is preferred before increasing task difficulty.');
  } else if (mastery < 0.7 || accuracy < 0.7) {
    action = 'practice';
    difficulty = Math.max(0.25, Math.min(0.75, mastery));
    rationale.push('The learner is developing the skill and needs targeted practice.');
  } else if (mastery >= 0.85 && accuracy >= 0.85) {
    action = 'increase-difficulty';
    difficulty = Math.min(1, mastery + 0.1);
    rationale.push('Recent performance and estimated mastery are consistently strong.');
    rationale.push('A harder or more contextual task is recommended.');
  } else {
    action = 'review';
    difficulty = Math.min(0.9, mastery + 0.03);
    rationale.push('The learner is near proficiency; review should consolidate the skill.');
  }

  return {
    learnerId: request.learnerId,
    skill,
    action,
    rationale,
    recommendedDifficulty: Number(difficulty.toFixed(3)),
    agents: agentsFor(action),
    expectedOutcome: expectedOutcomeFor(action, skill),
  };
}

function agentsFor(action: TutorAction) {
  switch (action) {
    case 'teach': return ['tutor', 'coach', 'evidence'] as const;
    case 'practice': return ['tutor', 'practice', 'assessment'] as const;
    case 'assess': return ['tutor', 'assessment', 'diagnostic'] as const;
    case 'increase-difficulty': return ['tutor', 'practice', 'assessment', 'coach'] as const;
    case 'review': return ['tutor', 'practice', 'assessment'] as const;
    case 'diagnose': return ['tutor', 'diagnostic'] as const;
  }
}

function expectedOutcomeFor(action: TutorAction, skill: string): string {
  switch (action) {
    case 'teach': return `Improve conceptual understanding of ${skill} before further practice.`;
    case 'practice': return `Increase reliable performance on ${skill} through targeted practice.`;
    case 'assess': return `Obtain a fresh performance signal for ${skill}.`;
    case 'increase-difficulty': return `Transfer ${skill} to a more challenging context.`;
    case 'review': return `Consolidate ${skill} and check retention.`;
    case 'diagnose': return `Identify the learner's current strengths and gaps in ${skill}.`;
  }
}
