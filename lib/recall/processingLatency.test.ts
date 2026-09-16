import { describe, expect, it } from 'vitest';
import { planProcessing } from './processingLatency';

describe('planProcessing', () => {
  it('hang ignores random entirely: always 15s, flagged hang, and never judges', () => {
    expect(planProcessing('hang', () => 0)).toEqual({ durationMs: 15000, flag: 'hang', hangs: true });
    expect(planProcessing('hang', () => 0.99)).toMatchObject({ flag: 'hang', hangs: true });
  });

  it('a forced slow override is always 7–8s, regardless of the random roll', () => {
    const low = planProcessing('slow', () => 0);
    const high = planProcessing('slow', () => 1);
    expect(low).toMatchObject({ flag: 'slow (forced)', hangs: false });
    expect(low.durationMs).toBeGreaterThanOrEqual(7000);
    expect(high.durationMs).toBeLessThanOrEqual(8000);
  });

  it('normal override: a low roll (under 1-in-5) is randomly slow', () => {
    const plan = planProcessing('normal', () => 0);
    expect(plan.flag).toBe('slow (random)');
    expect(plan.durationMs).toBeGreaterThanOrEqual(7000);
    expect(plan.durationMs).toBeLessThanOrEqual(8000);
  });

  it('normal override: a high roll stays in the 2–4s normal range', () => {
    const plan = planProcessing('normal', () => 0.99);
    expect(plan.flag).toBe('normal');
    expect(plan.durationMs).toBeGreaterThanOrEqual(2000);
    expect(plan.durationMs).toBeLessThanOrEqual(4000);
  });
});
