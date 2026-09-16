import type { TutorAction, TutorLesson } from './types.js';

export function buildAdaptiveLesson(skill: string, level: string, action: TutorAction, difficulty: number, recurringError?: string): TutorLesson {
  const topic = recurringError && recurringError !== 'item-error' ? recurringError.replaceAll('-', ' ') : skill;
  const exercises: Record<string, TutorLesson['exercise']> = {
    grammar: { id: `grammar-${Date.now()}`, type: 'choice', prompt: 'Choose the correct sentence.', choices: ['I have lived here since 2022.', 'I live here since 2022.', 'I am lived here since 2022.'], expectedAnswer: 'I have lived here since 2022.', hint: 'Use have/has + past participle.' },
    vocabulary: { id: `vocabulary-${Date.now()}`, type: 'choice', prompt: 'Choose the closest meaning of “mitigate”.', choices: ['reduce the severity', 'make certain', 'describe precisely'], expectedAnswer: 'reduce the severity', hint: 'Think about reducing a problem.' },
    reading: { id: `reading-${Date.now()}`, type: 'choice', prompt: '“The evidence is promising, but the sample was small.” What is the key qualification?', choices: ['The evidence is impossible to use.', 'The evidence is encouraging but has a limitation.', 'The sample was larger than expected.'], expectedAnswer: 'The evidence is encouraging but has a limitation.', hint: 'Notice the contrast introduced by “but”.' },
    writing: { id: `writing-${Date.now()}`, type: 'free-response', prompt: 'Rewrite more clearly: “Due to the fact that the results were unclear, we repeated the experiment.”', expectedAnswer: 'Because the results were unclear, we repeated the experiment.', hint: 'Use a direct conjunction.' },
    speaking: { id: `speaking-${Date.now()}`, type: 'free-response', prompt: 'You disagree with a colleague. Give one polite sentence that acknowledges their view before yours.', hint: 'Try “I see your point; however, …”.' },
    listening: { id: `listening-${Date.now()}`, type: 'choice', prompt: '“I’ll get back to you.” What does it mean?', choices: ['I will contact you later.', 'I reject your idea.', 'I forgot the conversation.'], expectedAnswer: 'I will contact you later.', hint: 'It signals a later response.' },
  };
  const teach = action === 'teach';
  return {
    objective: `At ${level}, you will ${teach ? 'understand' : 'use'} ${topic}.`,
    microLesson: teach ? `First we focus on ${topic}, then you produce an answer. Your response determines the next step.` : `Practise ${topic}. Explain your choice when possible so the tutor can adapt.`,
    exercise: exercises[skill] ?? exercises.grammar!, difficulty, nextAction: action,
  };
}
