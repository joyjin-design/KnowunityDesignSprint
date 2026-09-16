import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QUESTIONS } from './questions';
import {
  getScriptedAnswer,
  scriptedTextFor,
  setScriptedAnswer,
  startScriptedSpeech,
  type ScriptedAnswerId,
} from './scriptedTranscript';
import type { StorageLike } from './turnLog';

function memoryStorage(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe('scriptedTextFor', () => {
  it('returns each question sample by kind', () => {
    const q = QUESTIONS.Q2;
    expect(scriptedTextFor('pass', q)).toBe(q.samples.pass);
    expect(scriptedTextFor('partial', q)).toBe(q.samples.partial);
    expect(scriptedTextFor('fail', q)).toBe(q.samples.fail);
  });

  it('list falls back to the question\'s Partial sample when it has no list sample', () => {
    expect(QUESTIONS.Q2.samples.list).toBeUndefined();
    expect(scriptedTextFor('list', QUESTIONS.Q2)).toBe(QUESTIONS.Q2.samples.partial);
    expect(scriptedTextFor('list', QUESTIONS.Q1)).toBe(QUESTIONS.Q1.samples.list);
  });

  it('question and blank are the same regardless of question', () => {
    expect(scriptedTextFor('question', QUESTIONS.Q1)).toBe(scriptedTextFor('question', QUESTIONS.Q5));
    expect(scriptedTextFor('blank', QUESTIONS.Q1)).toBe('');
  });
});

describe('scripted answer override', () => {
  it('defaults to live and round-trips through storage', () => {
    const storage = memoryStorage();
    expect(getScriptedAnswer(() => storage)).toBe('live');
    setScriptedAnswer(() => storage, 'fail');
    expect(getScriptedAnswer(() => storage)).toBe<ScriptedAnswerId>('fail');
  });

  it('falls back to live for garbage storage', () => {
    const storage = memoryStorage();
    storage.setItem('voice-recall:scripted-answer:v1', 'nonsense');
    expect(getScriptedAnswer(() => storage)).toBe('live');
  });
});

describe('startScriptedSpeech', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('streams one word at a time, then fires onFinal with the full text', () => {
    const onInterim = vi.fn();
    const onFinal = vi.fn();
    startScriptedSpeech('one two three', { onInterim, onFinal });

    vi.advanceTimersByTime(220);
    expect(onInterim).toHaveBeenLastCalledWith('one');
    vi.advanceTimersByTime(220);
    expect(onInterim).toHaveBeenLastCalledWith('one two');
    vi.advanceTimersByTime(220);
    expect(onInterim).toHaveBeenLastCalledWith('one two three');
    expect(onFinal).toHaveBeenCalledWith('one two three');
    expect(onFinal).toHaveBeenCalledTimes(1);
  });

  it('resolves an empty string straight to onFinal, nothing interim', () => {
    const onInterim = vi.fn();
    const onFinal = vi.fn();
    startScriptedSpeech('', { onInterim, onFinal });

    vi.advanceTimersByTime(1000);
    expect(onInterim).not.toHaveBeenCalled();
    expect(onFinal).toHaveBeenCalledWith('');
  });

  it('stop() ends the stream early: no further interim or final callbacks', () => {
    const onInterim = vi.fn();
    const onFinal = vi.fn();
    const handle = startScriptedSpeech('one two three four', { onInterim, onFinal });

    vi.advanceTimersByTime(220);
    expect(onInterim).toHaveBeenCalledTimes(1);
    handle.stop();
    vi.advanceTimersByTime(1000);
    expect(onInterim).toHaveBeenCalledTimes(1);
    expect(onFinal).not.toHaveBeenCalled();
  });
});
