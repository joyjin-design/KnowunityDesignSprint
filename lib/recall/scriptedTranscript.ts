import type { Question } from './questions';
import type { StorageLike } from './turnLog';

/**
 * Recording gets its transcript from one of these scripted answers, or from
 * the real recognizer (`live`, `lib/recall/webSpeech.ts`, wired in
 * 2026-09-16 once SPEC.md verification item 0's spike ran) — a facilitator
 * picks which one plays next, on `/log`, the same way they already pick the
 * latency override. Never seen by a student. `live` is the default (see
 * `DEFAULT_ANSWER` below); a facilitator switches to a scripted value
 * deliberately to test without speaking.
 */
export type ScriptedAnswerId = 'pass' | 'partial' | 'fail' | 'list' | 'question' | 'blank' | 'live';

export const SCRIPTED_ANSWER_LABEL: Record<ScriptedAnswerId, string> = {
  pass: 'Pass',
  partial: 'Partial',
  fail: 'Fail',
  list: 'Keyword list',
  question: 'Asks a question',
  blank: "Silence (didn't hear anything)",
  live: 'Live mic (real speech)',
};

const VALUES: readonly ScriptedAnswerId[] = ['pass', 'partial', 'fail', 'list', 'question', 'blank', 'live'];

/** A generic question-shaped reply, for exercising the question-detection
 * Silence path (SPEC.md "On Send" step 4) independent of any one question's
 * own content. */
const GENERIC_QUESTION = 'Wait, can you say that again?';

/** The scripted text for one answer kind, against a specific question.
 * `list` falls back to the question's own Partial sample when it has no
 * list sample of its own (content/voice-recall-questions.md gives one only
 * for Q1, the stuffing-cap demonstration) — still a real, judgeable answer,
 * just not the bare-keyword-list case specifically. `live` has no scripted
 * text of its own (LoopScreen sources it from `lib/recall/webSpeech.ts`
 * instead) — this only fires if `live` is picked without recognizer support,
 * where it behaves like `blank`. */
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
    case 'live':
      return '';
  }
}

// ---- Facilitator's persisted pick, same read/write/subscribe shape as
// latencyOverride.ts, deliberately not shared code with it: the two values
// are unrelated and a shared helper would need generics for no real benefit.

const STORAGE_KEY = 'voice-recall:scripted-answer:v1';
/** `live` by default (2026-09-16, your call): a fresh session — real
 * participant or a plain page load with nothing saved to `/log` yet — should
 * hear the student, not a canned sample. A facilitator switches this back to
 * a scripted value on `/log` when testing without speaking. Safe for every
 * existing Storybook story: `LoopScreen`'s own stories always pass
 * `scriptedAnswer` as an explicit arg (bypassing this default entirely), and
 * no `PrototypeFlow` story taps Start, so none of them read this value. */
const DEFAULT_ANSWER: ScriptedAnswerId = 'live';

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
  /** Fired once streaming finishes on its own (not stopped early). */
  onFinal: (text: string) => void;
}

export interface ScriptedSpeechHandle {
  /** Ends the stream early (Cancel or Send before it finishes). No further
   * callbacks fire. */
  stop: () => void;
}

const WORD_INTERVAL_MS = 220;

/**
 * Streams `fullText` into `onInterim` one word at a time, at a natural
 * reading pace, then `onFinal`. This is the fake speech source (sprint-
 * context.md decision, this build): written to the same shape — interim
 * callbacks while "listening", one final result, a `stop()` an in-progress
 * take can cancel — that a real `webkitSpeechRecognition` wrapper will need,
 * so swapping one in later is a small change, not a rewrite. Once streaming
 * finishes, this fires no further callbacks — a facilitator sitting on that
 * finished take, not yet tapping Send, is genuine silence, so LoopScreen's
 * own real-silence timer (2026-09-16) picks it up the same as it would a
 * live pause.
 */
export function startScriptedSpeech(fullText: string, callbacks: ScriptedSpeechCallbacks): ScriptedSpeechHandle {
  const tokens = fullText.split(/\s+/).filter(Boolean);
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
