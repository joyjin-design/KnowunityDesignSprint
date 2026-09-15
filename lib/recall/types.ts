import type { ResultBtmVariant } from '@/app/components/ResultBtm';

/** Q1–Q4 are node 1 (Organelle Identification), Q5–Q8 node 2 (Comparing
 * Cell Types), as in content/voice-recall-questions.md. */
export type QuestionId = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q5' | 'Q6' | 'Q7' | 'Q8';

/** The two voice nodes on the exam plan: 1 is Organelle Identification,
 * 2 is Comparing Cell Types. */
export type NodeId = 1 | 2;

/** Each question's three concepts, lettered as in the content file. */
export type ConceptId = 'A' | 'B' | 'C';

/** 1 is a question's first run, 2 its Try again. There is no third. */
export type Round = 1 | 2;

/** What the keyword judge can return. Never binary (CLAUDE.md). */
export type Verdict = 'Pass' | 'Partial' | 'Fail';

/**
 * How a turn ended. Pass / Partial / Fail come from the judge; the rest are
 * the moments the turn log also records (sprint-context.md, 2026-09-14).
 * Cancel and the accidental quick tap are never logged.
 */
export type TurnOutcome =
  | Verdict
  | 'Silence'
  | 'Skipped'
  | 'Interrupted'
  | 'Mic off'
  | 'Left (idle)'
  | 'Left (judging)'
  | 'Tried typing';

/**
 * Why a turn took as long as it did. `slow (random)` is the roughly 1 in 5
 * slow turns; `slow (forced)` and `hang` come from the facilitator's latency
 * switch or `?latency=`.
 */
export type LatencyFlag = 'normal' | 'slow (random)' | 'slow (forced)' | 'hang';

/** The judge's vocabulary mapped onto ResultBtm's, which reuses snackbar's
 * Success/Error words. Only outcomes that show a verdict sheet map. */
export function toResultVariant(outcome: Verdict | 'Silence'): ResultBtmVariant {
  switch (outcome) {
    case 'Pass':
      return 'Success';
    case 'Fail':
      return 'Error';
    default:
      return outcome;
  }
}
