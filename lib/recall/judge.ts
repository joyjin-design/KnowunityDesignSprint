import type { Question } from './questions';
import type { ConceptId, Verdict } from './types';

/**
 * SPEC.md's "On Send" step 4: the transcript reads as a question rather than
 * an answer, so it's redirected to the Silence sheet instead of judged.
 * Deliberately loose (SPEC.md's own words): a real answer starting "What
 * happens is…" is caught too, an accepted cost.
 */
const QUESTION_OPENERS = [
  'what',
  "what's",
  'how',
  'why',
  'can you',
  'could you',
  'is it',
  'does it',
  "i don't get",
  "i don't know what",
  'what does',
  'wait',
] as const;

/** SPEC.md's "real sentence" linking words for a Pass. Apostrophes split a
 * contraction into its parts ("it's" → "it", "s"), so "it's"/"they're"/
 * "that's" all still carry their linking word. */
const LINKING_WORDS = new Set([
  'is',
  'are',
  'it',
  'they',
  'has',
  'have',
  'makes',
  'uses',
  'because',
  'so',
  'and',
  'which',
  'that',
]);

function words(transcript: string): string[] {
  return transcript.toLowerCase().match(/[a-z]+/g) ?? [];
}

/** Opens with a question word/phrase, or ends with "?". */
export function isQuestion(transcript: string): boolean {
  const trimmed = transcript.trim();
  if (trimmed.endsWith('?')) return true;
  const lower = trimmed.toLowerCase();
  return QUESTION_OPENERS.some((opener) => lower.startsWith(opener));
}

/** At least 6 words, plus at least one linking word (SPEC.md, "On Send"
 * step 5). Required for a Pass; without it, 2–3 concepts cap at Partial. */
export function isRealSentence(transcript: string): boolean {
  const tokens = words(transcript);
  return tokens.length >= 6 && tokens.some((word) => LINKING_WORDS.has(word));
}

export type JudgeResult =
  | { outcome: 'Silence' }
  | { outcome: Verdict; conceptsHit: ConceptId[] };

/**
 * The mocked keyword judge (SPEC.md, "On Send" steps 3–5). Assumes the
 * caller already handled the under-~1s accidental-tap drop and the ~2s
 * final-result wait — those are timing concerns for the recording/processing
 * states, not the transcript itself. Empty or question-shaped transcripts
 * come back as Silence (no attempt used); everything else is judged against
 * the question's 3 concepts.
 */
export function judge(transcript: string, question: Question): JudgeResult {
  const trimmed = transcript.trim();
  if (trimmed === '' || isQuestion(trimmed)) return { outcome: 'Silence' };

  const lower = trimmed.toLowerCase();
  const conceptsHit = question.concepts
    .filter((concept) => concept.phrases.some((phrase) => lower.includes(phrase)))
    .map((concept) => concept.id);

  if (conceptsHit.length >= 2 && isRealSentence(trimmed)) return { outcome: 'Pass', conceptsHit };
  if (conceptsHit.length >= 1) return { outcome: 'Partial', conceptsHit };
  return { outcome: 'Fail', conceptsHit };
}
