import { describe, expect, it } from 'vitest';
import { isQuestion, isRealSentence, judge } from './judge';
import { QUESTIONS } from './questions';
import type { QuestionId } from './types';

describe('isQuestion', () => {
  it('catches question openers', () => {
    expect(isQuestion('What does that mean?')).toBe(true);
    expect(isQuestion("What's a mitochondria")).toBe(true);
    expect(isQuestion('How does that work')).toBe(true);
    expect(isQuestion('Why is that')).toBe(true);
    expect(isQuestion('Can you repeat the question')).toBe(true);
    expect(isQuestion('Could you say that again')).toBe(true);
    expect(isQuestion('Is it the nucleus')).toBe(true);
    expect(isQuestion('Does it matter')).toBe(true);
    expect(isQuestion("I don't get it")).toBe(true);
    expect(isQuestion("I don't know what you mean")).toBe(true);
    expect(isQuestion('What does the nucleus do')).toBe(true);
    expect(isQuestion('Wait, can you say that again')).toBe(true);
  });

  it('catches a real answer that only ends in a question mark', () => {
    expect(isQuestion('It holds the DNA?')).toBe(true);
  });

  it('is an accepted loose match: a real answer starting "What happens is…" is caught too', () => {
    expect(isQuestion('What happens is the cell divides.')).toBe(true);
  });

  it('does not flag an ordinary answer', () => {
    expect(isQuestion('The nucleus is like the control center, it holds the DNA.')).toBe(false);
  });
});

describe('isRealSentence', () => {
  it('requires at least 6 words', () => {
    expect(isRealSentence('It protects the cell.')).toBe(false);
  });

  it('requires at least one linking word even at 6+ words', () => {
    expect(isRealSentence('Nucleus control DNA membrane cell energy power')).toBe(false);
  });

  it('passes with 6+ words and a linking word', () => {
    expect(isRealSentence("It's the part that makes energy today.")).toBe(true);
  });

  it('finds a linking word inside a contraction', () => {
    // "it's" splits into "it" + "s" — "it" is a linking word on its own.
    expect(isRealSentence("In eukaryotic cells it's in the nucleus today.")).toBe(true);
  });
});

describe('judge: transcript-level rules (On Send steps 3–4)', () => {
  it('an empty transcript is Silence', () => {
    expect(judge('', QUESTIONS.Q1)).toEqual({ outcome: 'Silence' });
    expect(judge('   ', QUESTIONS.Q1)).toEqual({ outcome: 'Silence' });
  });

  it('a question-shaped transcript is Silence, no matter how many concepts it names', () => {
    expect(judge('What does the nucleus do again?', QUESTIONS.Q1)).toEqual({ outcome: 'Silence' });
  });
});

describe('judge: the keyword judge (On Send step 5), every sample in content/voice-recall-questions.md', () => {
  const ids = Object.keys(QUESTIONS) as QuestionId[];

  it.each(ids)('%s: Pass sample judges Pass', (id) => {
    const q = QUESTIONS[id];
    expect(judge(q.samples.pass, q).outcome).toBe('Pass');
  });

  it.each(ids)('%s: Partial sample judges Partial', (id) => {
    const q = QUESTIONS[id];
    expect(judge(q.samples.partial, q).outcome).toBe('Partial');
  });

  it.each(ids)('%s: Fail sample judges Fail', (id) => {
    const q = QUESTIONS[id];
    expect(judge(q.samples.fail, q).outcome).toBe('Fail');
  });

  it('Q1: the bare keyword list caps at Partial, per the stuffing rule', () => {
    const q = QUESTIONS.Q1;
    expect(q.samples.list).toBeDefined();
    expect(judge(q.samples.list!, q).outcome).toBe('Partial');
  });
});

describe('judge: concept hits reported', () => {
  it('reports which concepts were found, in A/B/C order', () => {
    const result = judge(QUESTIONS.Q2.samples.pass, QUESTIONS.Q2);
    expect(result.outcome).toBe('Pass');
    expect(result).toMatchObject({ conceptsHit: ['A', 'C'] });
  });

  it('a Fail reports no concepts hit', () => {
    expect(judge(QUESTIONS.Q1.samples.fail, QUESTIONS.Q1)).toEqual({ outcome: 'Fail', conceptsHit: [] });
  });
});
