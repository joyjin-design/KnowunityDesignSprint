import type { Question } from './questions';
import type { StorageLike } from './turnLog';

/**
 * Real STT is deferred (spike pending — SPEC.md verification item 0 hasn't
 * run). Recording gets its transcript from one of these scripted answers
 * instead: a facilitator picks which one plays next, on `/log`, the same way
 * they already pick the latency override. Never seen by a student.
 */
export type ScriptedAnswerId = 'pass' | 'partial' | 'fail' | 'list' | 'question' | 'blank';

export const SCRIPTED_ANSWER_LABEL: Record<ScriptedAnswerId, string> = {
  pass: 'Pass',
  partial: 'Partial',
  fail: 'Fail',
  list: 'Keyword list',
  question: 'Asks a question',
  blank: "Silence (didn't hear anything)",
};

const VALUES: readonly ScriptedAnswerId[] = ['pass', 'partial', 'fail', 'list', 'question', 'blank'];

/** A generic question-shaped reply, for exercising the question-detection
 * Silence path (SPEC.md "On Send" step 4) independent of any one question's
 * own content. */
const GENERIC_QUESTION = 'Wait, can you say that again?';

/** The scripted text for one answer kind, against a specific question.
 * `list` falls back to the question's own Partial sample when it has no
 * list sample of its own (content/voice-recall-questions.md gives one only
 * for Q1, the stuffing-cap demonstration) — still a real, judgeable answer,
 * just not the bare-keyword-list case specifically. */
export function scriptedTextFor(answer: ScriptedAnswerId, question: Question): string {
  switch (answer) {
    case 'pass':
      return question.samples.pass;
    case 'partial':
      return question.samples.partial;
    case 'fail':
      return question.samples.fail;
    case 'list':
      return question.samples.list ?? question.samples.partial;
    case 'question':
      return GENERIC_QUESTION;
    case 'blank':
      return '';
  }
}

// ---- Facilitator's persisted pick, same read/write/subscribe shape as
// latencyOverride.ts, deliberately not shared code with it: the two values
// are unrelated and a shared helper would need generics for no real benefit.

const STORAGE_KEY = 'voice-recall:scripted-answer:v1';
const DEFAULT_ANSWER: ScriptedAnswerId = 'pass';

export function getScriptedAnswer(getStorage: () => StorageLike | null): ScriptedAnswerId {
  try {
    const raw = getStorage()?.getItem(STORAGE_KEY);
    if (raw && (VALUES as readonly string[]).includes(raw)) return raw as ScriptedAnswerId;
  } catch {
    // Fall through to the default.
  }
  return DEFAULT_ANSWER;
}

export function getServerScriptedAnswer(): ScriptedAnswerId {
  return DEFAULT_ANSWER;
}

const listeners = new Set<() => void>();

export function subscribeScriptedAnswer(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setScriptedAnswer(getStorage: () => StorageLike | null, value: ScriptedAnswerId): boolean {
  let saved = false;
  try {
    const storage = getStorage();
    if (storage) {
      storage.setItem(STORAGE_KEY, value);
      saved = true;
    }
  } catch {
    saved = false;
  }
  listeners.forEach((listener) => listener());
  return saved;
}

// ---- Streaming, standing in for webkitSpeechRecognition's interim results.

export interface ScriptedSpeechCallbacks {
  /** Fired as each new word arrives, with the transcript so far. */
  onInterim: (textSoFar: string) => void;
  /** Fired once, roughly mid-stream, on answers long enough to show it —
   * standing in for iOS restarting recognition on a pause (SPEC.md). Only
   * fires if streaming runs to completion past that point. */
  onStillListening?: () => void;
  /** Fired once streaming finishes on its own (not stopped early). */
  onFinal: (text: string) => void;
}

export interface ScriptedSpeechHandle {
  /** Ends the stream early (Cancel or Send before it finishes). No further
   * callbacks fire. */
  stop: () => void;
}

const WORD_INTERVAL_MS = 220;
/** Words in before "Still listening…" fires — only on answers with enough
 * of them left afterward for the cue to be visible. */
const STILL_LISTENING_MIN_WORDS = 7;

/**
 * Streams `fullText` into `onInterim` one word at a time, at a natural
 * reading pace, then `onFinal`. This is the fake speech source (sprint-
 * context.md decision, this build): written to the same shape — interim
 * callbacks while "listening", one final result, a `stop()` an in-progress
 * take can cancel — that a real `webkitSpeechRecognition` wrapper will need,
 * so swapping one in later is a small change, not a rewrite.
 */
export function startScriptedSpeech(fullText: string, callbacks: ScriptedSpeechCallbacks): ScriptedSpeechHandle {
  const tokens = fullText.split(/\s+/).filter(Boolean);
  const stillListeningAt = tokens.length >= STILL_LISTENING_MIN_WORDS ? Math.floor(tokens.length / 2) : -1;
  let index = 0;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function tick() {
    if (stopped) return;
    if (tokens.length === 0) {
      callbacks.onFinal('');
      return;
    }
    index += 1;
    callbacks.onInterim(tokens.slice(0, index).join(' '));
    if (index === stillListeningAt) callbacks.onStillListening?.();
    if (index >= tokens.length) {
      callbacks.onFinal(fullText);
      return;
    }
    timer = setTimeout(tick, WORD_INTERVAL_MS);
  }

  timer = setTimeout(tick, WORD_INTERVAL_MS);

  return {
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}
