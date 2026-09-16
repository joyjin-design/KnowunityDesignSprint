import { NODE_QUESTIONS } from '@/lib/recall/questions';
import type { NodeId, QuestionId, TurnOutcome, Verdict } from '@/lib/recall/types';
import type { FrameId } from './frames';
import type { VerdictOutcome } from '@/app/screens/VerdictScreen';

/** The prototype's real session state: which node, which question in it,
 * and what's happened on each question so far (for the summary's count).
 * Try again is out (sprint-context.md, this build — SummaryScreen's own
 * 2026-09-15 rebuild dropped it), so a session is one pass through 4
 * questions and `round` is always 1. */
export interface Session {
  sessionNumber: number;
  node: NodeId;
  order: readonly QuestionId[];
  /** Index into `order` of the question currently being answered (Loop), or
   * just answered (Verdict/Why). */
  index: number;
  outcomes: Partial<Record<QuestionId, TurnOutcome>>;
}

export function newSession(sessionNumber: number, node: NodeId): Session {
  return { sessionNumber, node, order: NODE_QUESTIONS[node], index: 0, outcomes: {} };
}

/** The current turn's real transcript/verdict, set once Send judges an
 * answer, read by the Verdict and Why? screens. Review links (`?screen=`)
 * that open Verdict/Why directly have no session and supply their own fixed
 * sample instead — see reviewScreens.ts's REVIEW_SCREENS. */
export interface LastTurn {
  question: QuestionId;
  transcript: string;
  /** Includes 'Silence' so a Silence turn's transcript/question can still be
   * carried for the Verdict sheet — Silence never reaches the Why? sheet
   * (that field is narrowed to Verdict there), so this only ever widens what
   * Verdict needs. */
  verdict: VerdictOutcome;
  conceptsHit: readonly string[];
}

/** Which screen the prototype is showing. Prototype scaffolding, not app
 * state. */
export type PrototypeView =
  | { screen: 'exam-plan'; frame: FrameId }
  | { screen: 'gate'; node: NodeId; sheetOpen: boolean }
  | { screen: 'mic-off' }
  | { screen: 'typing' }
  | { screen: 'loop' }
  | { screen: 'verdict'; outcome: VerdictOutcome }
  | { screen: 'why'; outcome: Verdict }
  | { screen: 'summary'; passCount: number; totalCount: number };

/** What the prototype knows about mic permission, in memory only: a reload
 * starts over, and iOS itself answers straight away if it already has. */
export type MicState = 'unknown' | 'granted' | 'denied';

export interface PrototypeStart {
  view: PrototypeView;
  mic: MicState;
  /** Only review links into the loop/verdict/why/summary screens need one;
   * the real flow builds its own via `newSession` when a node opens. */
  session?: Session;
  lastTurn?: LastTurn;
}

export const HOME: PrototypeStart = { view: { screen: 'exam-plan', frame: '00Homescreen' }, mic: 'unknown' };

const Q2_LAST_TURN = (verdict: Verdict, transcript: string, conceptsHit: readonly string[]): LastTurn => ({
  question: 'Q2',
  transcript,
  verdict,
  conceptsHit,
});

/**
 * `/?screen=<name>` opens one screen directly, for reviewing screens in
 * isolation with fixed sample content instead of playing through a real
 * session. Opening one writes nothing to the turn log; tapping something
 * that logs a turn in the real flow (Skip, Send, Close…) still does, exactly
 * as it would there, since PrototypeFlow can't tell a review link's session
 * apart from a real one once it's showing.
 */
export const REVIEW_SCREENS: Record<string, PrototypeStart> = {
  gate: { view: { screen: 'gate', node: 1, sheetOpen: false }, mic: 'unknown' },
  'gate-sheet': { view: { screen: 'gate', node: 1, sheetOpen: true }, mic: 'unknown' },
  'gate-denied': { view: { screen: 'gate', node: 1, sheetOpen: false }, mic: 'denied' },
  'mic-off': { view: { screen: 'mic-off' }, mic: 'unknown', session: newSession(0, 1) },
  typing: { view: { screen: 'typing' }, mic: 'unknown' },
  'loop-idle': { view: { screen: 'loop' }, mic: 'granted', session: newSession(0, 1) },
  'verdict-pass': {
    view: { screen: 'verdict', outcome: 'Pass' },
    mic: 'unknown',
    session: { ...newSession(0, 1), index: 1 },
    lastTurn: Q2_LAST_TURN('Pass', 'They make energy for the cell by breaking down glucose.', ['A', 'C']),
  },
  'verdict-partial': {
    view: { screen: 'verdict', outcome: 'Partial' },
    mic: 'unknown',
    session: { ...newSession(0, 1), index: 1 },
    lastTurn: Q2_LAST_TURN('Partial', "They're the powerhouse of the cell.", ['A']),
  },
  'verdict-fail': {
    view: { screen: 'verdict', outcome: 'Fail' },
    mic: 'unknown',
    session: { ...newSession(0, 1), index: 1 },
    lastTurn: Q2_LAST_TURN('Fail', 'They help the cell divide.', []),
  },
  'verdict-silence': {
    view: { screen: 'verdict', outcome: 'Silence' },
    mic: 'unknown',
    session: newSession(0, 1),
    lastTurn: { question: 'Q1', transcript: '', verdict: 'Silence', conceptsHit: [] },
  },
  'why-pass': {
    view: { screen: 'why', outcome: 'Pass' },
    mic: 'unknown',
    session: { ...newSession(0, 1), index: 1 },
    lastTurn: Q2_LAST_TURN('Pass', 'They make energy for the cell by breaking down glucose.', ['A', 'C']),
  },
  'why-partial': {
    view: { screen: 'why', outcome: 'Partial' },
    mic: 'unknown',
    session: { ...newSession(0, 1), index: 1 },
    lastTurn: Q2_LAST_TURN('Partial', "They're the powerhouse of the cell.", ['A']),
  },
  'why-fail': {
    view: { screen: 'why', outcome: 'Fail' },
    mic: 'unknown',
    session: { ...newSession(0, 1), index: 1 },
    lastTurn: Q2_LAST_TURN('Fail', 'They help the cell divide.', []),
  },
  'summary-some-non-pass': { view: { screen: 'summary', passCount: 1, totalCount: 4 }, mic: 'unknown' },
  'summary-all-pass': { view: { screen: 'summary', passCount: 4, totalCount: 4 }, mic: 'unknown' },
};

/** An unknown or missing `?screen=` starts the normal flow on 00Homescreen. */
export function reviewScreen(name: string | string[] | undefined): PrototypeStart {
  return (typeof name === 'string' && Object.hasOwn(REVIEW_SCREENS, name) ? REVIEW_SCREENS[name] : undefined) ?? HOME;
}
