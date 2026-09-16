/**
 * Real STT (SPEC.md Verification §0's spike ran 2026-09-16, sprint-context.md):
 * wraps `webkitSpeechRecognition` to the same shape
 * `lib/recall/scriptedTranscript.ts`'s `startScriptedSpeech` already
 * established — interim callbacks while listening, and a `stop()` an
 * in-progress take can cancel or finalize — so LoopScreen treats a live take
 * and a scripted one identically past the point where one is chosen.
 * "Still listening…" isn't this module's concern (2026-09-16, your call): it
 * now fires off real silence — no new `onInterim` call for 3s — which
 * LoopScreen tracks itself from the callback timing, the same way for both
 * this and the scripted stand-in, rather than each transcript source
 * guessing at its own trigger (this one guessed "iOS just restarted
 * recognition on a pause"; that's still why a restart happens below, it just
 * no longer reports it as a listening cue on its own).
 *
 * No custom STT engine (CLAUDE.md): this only wraps the browser's own
 * recognizer, never replaces it.
 */

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  /** Fires the moment the recognizer detects speech starting — before it has
   * transcribed anything. Real, not a proxy: unlike `onresult` (which needs
   * actual words), this is the earliest "there is voice coming in right
   * now" signal the API exposes, still not amplitude but a step earlier
   * than text. */
  onspeechstart: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function getRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.webkitSpeechRecognition ?? window.SpeechRecognition;
}

export function isWebSpeechSupported(): boolean {
  return getRecognitionConstructor() !== undefined;
}

export interface WebSpeechCallbacks {
  /** Fired with the transcript so far (finalized text plus the current
   * interim chunk) on every recognizer result. */
  onInterim: (textSoFar: string) => void;
  /** Fired the instant the recognizer detects speech starting, ahead of any
   * transcribed text (2026-09-16, your call: "Still listening…" should hide
   * the moment voice comes back in, not wait for the first recognized word
   * — which can lag a beat behind actual speech, especially right after a
   * long gap). Optional so a caller that doesn't care about the distinction
   * can ignore it and rely on `onInterim` alone, same as before. */
  onSpeechStart?: () => void;
}

export interface WebSpeechHandle {
  /** Ends the take. No further callbacks fire. */
  stop: () => void;
}

/** Restarts this many times at most before giving up — guards against a
 * runaway restart loop if the recognizer fails immediately on every start
 * (e.g. a revoked permission mid-take). The spike's own throwaway test page
 * never got close to this in normal use. */
const MAX_RESTARTS = 20;

export function startWebSpeech(callbacks: WebSpeechCallbacks): WebSpeechHandle {
  const RecognitionCtor = getRecognitionConstructor();
  if (!RecognitionCtor) {
    // Callers check isWebSpeechSupported() first; this only guards the type.
    return { stop: () => {} };
  }
  // Rebound to a definitely-assigned const: `attach` below is a nested
  // function, and TS doesn't carry the narrowing above into its closure.
  const Recognition: SpeechRecognitionConstructor = RecognitionCtor;

  let finalTranscript = '';
  let stoppedByCaller = false;
  let restarts = 0;
  let recognition: SpeechRecognitionLike;

  function attach() {
    recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript = finalTranscript ? `${finalTranscript} ${chunk.trim()}` : chunk.trim();
        } else {
          interim = chunk;
        }
      }
      const combined = finalTranscript && interim ? `${finalTranscript} ${interim}` : finalTranscript || interim;
      callbacks.onInterim(combined.trim());
    };

    recognition.onspeechstart = () => callbacks.onSpeechStart?.();

    // An empty or erroring take already reads as Silence on Send (SPEC.md
    // "On Send" step 3) — nothing else to do with the error itself.
    recognition.onerror = () => {};

    recognition.onend = () => {
      if (stoppedByCaller || restarts >= MAX_RESTARTS) return;
      restarts += 1;
      attach();
    };

    recognition.start();
  }

  attach();

  return {
    stop: () => {
      stoppedByCaller = true;
      recognition.stop();
    },
  };
}
