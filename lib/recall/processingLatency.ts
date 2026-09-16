import type { LatencyOverride } from './latencyOverride';
import type { LatencyFlag } from './types';

export interface ProcessingPlan {
  /** How long to hold the Processing state before showing the verdict. */
  durationMs: number;
  flag: LatencyFlag;
  /** When true, no verdict ever arrives — the caller shows the Silence
   * sheet once `durationMs` (15s) elapses, without judging the answer at
   * all. The `?latency=hang` path (SPEC.md). */
  hangs: boolean;
}

const NORMAL_MIN_MS = 2000;
const NORMAL_MAX_MS = 4000;
const SLOW_MIN_MS = 7000;
const SLOW_MAX_MS = 8000;
const HANG_TIMEOUT_MS = 15000;
/** About 1 in 5 turns are randomly slow (SPEC.md's mock engine). */
const RANDOM_SLOW_CHANCE = 1 / 5;

function randomBetween(min: number, max: number, random: () => number): number {
  return Math.round(min + random() * (max - min));
}

/**
 * How long a turn's Processing state holds, and why (SPEC.md's "fake wait"
 * and the facilitator's latency override, already wired into `/log`).
 * `random` is injectable for tests; defaults to `Math.random`.
 */
export function planProcessing(override: LatencyOverride, random: () => number = Math.random): ProcessingPlan {
  if (override === 'hang') return { durationMs: HANG_TIMEOUT_MS, flag: 'hang', hangs: true };
  if (override === 'slow') {
    return { durationMs: randomBetween(SLOW_MIN_MS, SLOW_MAX_MS, random), flag: 'slow (forced)', hangs: false };
  }
  if (random() < RANDOM_SLOW_CHANCE) {
    return { durationMs: randomBetween(SLOW_MIN_MS, SLOW_MAX_MS, random), flag: 'slow (random)', hangs: false };
  }
  return { durationMs: randomBetween(NORMAL_MIN_MS, NORMAL_MAX_MS, random), flag: 'normal', hangs: false };
}
