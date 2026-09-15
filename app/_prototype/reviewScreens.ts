import type { FrameId } from './frames';
import type { VerdictOutcome } from '@/app/screens/VerdictScreen';
import type { NodeId } from '@/lib/recall/types';

/** Which screen the prototype is showing. Prototype scaffolding, not app state. */
export type PrototypeView =
  | { screen: 'exam-plan'; frame: FrameId }
  | { screen: 'gate'; node: NodeId; sheetOpen: boolean }
  | { screen: 'mic-off' }
  | { screen: 'typing' }
  | { screen: 'verdict'; outcome: VerdictOutcome }
  | { screen: 'not-built'; caption: string };

/** What the prototype knows about mic permission, in memory only: a reload
 * starts over, and iOS itself answers straight away if it already has. */
export type MicState = 'unknown' | 'granted' | 'denied';

export interface PrototypeStart {
  view: PrototypeView;
  mic: MicState;
}

export const HOME: PrototypeStart = { view: { screen: 'exam-plan', frame: '00Homescreen' }, mic: 'unknown' };

/**
 * `/?screen=<name>` opens one screen directly, for reviewing screens the flow
 * can't reach yet (everything after the gate waits on the loop, screen 10).
 * Nothing is written to the turn log from these.
 */
export const REVIEW_SCREENS: Record<string, PrototypeStart> = {
  gate: { view: { screen: 'gate', node: 1, sheetOpen: false }, mic: 'unknown' },
  'gate-sheet': { view: { screen: 'gate', node: 1, sheetOpen: true }, mic: 'unknown' },
  'gate-denied': { view: { screen: 'gate', node: 1, sheetOpen: false }, mic: 'denied' },
  'mic-off': { view: { screen: 'mic-off' }, mic: 'unknown' },
  typing: { view: { screen: 'typing' }, mic: 'unknown' },
  'verdict-pass': { view: { screen: 'verdict', outcome: 'Pass' }, mic: 'unknown' },
  'verdict-partial': { view: { screen: 'verdict', outcome: 'Partial' }, mic: 'unknown' },
  'verdict-fail': { view: { screen: 'verdict', outcome: 'Fail' }, mic: 'unknown' },
  'verdict-silence': { view: { screen: 'verdict', outcome: 'Silence' }, mic: 'unknown' },
};

/** An unknown or missing `?screen=` starts the normal flow on 00Homescreen. */
export function reviewScreen(name: string | string[] | undefined): PrototypeStart {
  return (typeof name === 'string' && Object.hasOwn(REVIEW_SCREENS, name) ? REVIEW_SCREENS[name] : undefined) ?? HOME;
}
