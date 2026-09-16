# 004 — Waveform bars enter from the right when there's sound, pause during real silence

- **Commit:** f7251d2
- **Severity:** MEDIUM (user-directed redesign, not an audit-severity bug)
- **Category:** Physicality & origin / Purpose & frequency
- **Estimated scope:** 2 files, ~50 lines changed (mostly in `LoopScreen.tsx`)

## Problem

Today, `revealedBarCount()` derives the visible bar count from the recognized transcript's word count (`BARS_PER_WORD = 3` bars per word), and each newly-revealed bar mounts in place with a vertical grow (`scaleY(0)` → `scaleY(1)`). Two changes were requested:

1. Bars should always enter from the right side of the row, one at a time, on a continuous clock — not in bursts tied to word boundaries, and not growing vertically in place.
2. That clock should only advance **while there's sound coming in**. When there's no sound at all, no new bars should appear — instead, the existing "Still listening…" cue should show. The two are meant to be complementary: bars trickle in during speech, "Still listening…" shows during silence, and they don't overlap.

Point 2 reuses a signal this screen already computes for exactly this purpose: `LoopScreen.tsx`'s existing `SILENCE_TIMEOUT_MS` (3000ms) / `armSilenceTimer()` mechanism already tracks "no new interim result for 3s" and drives the `stillListening` state that shows that exact cue. Rather than inventing a second, separate "is there sound right now" detector, this plan gates the waveform's reveal clock off that same state.

The row's horizontal position also needs a fix: it should sit 28px in from the screen edge on both sides, matching Figma node `13696:7029` (the Processing frame — same 28px inset the row's own children use there), not flush with `Screen`'s existing 16px `bottomContent` padding.

## Where

| File | Lines | What's there |
| --- | --- | --- |
| `app/screens/LoopScreen.tsx` | 56–67 | `BARS_PER_WORD` constant and `revealedBarCount()` — removed |
| `app/screens/LoopScreen.tsx` | 143–161 | State/ref declarations — add new state + refs |
| `app/screens/LoopScreen.tsx` | 158–161 | The `phaseRef`/`transcriptRef` sync `useEffect` — add `stillListeningRef` to it |
| `app/screens/LoopScreen.tsx` | 181–187 | Unmount cleanup — add timer teardown |
| `app/screens/LoopScreen.tsx` | 194–211 | Interruption handler — add timer teardown + reset |
| `app/screens/LoopScreen.tsx` | 213–247 | `handleStart` — start the gated interval instead of relying on transcript |
| `app/screens/LoopScreen.tsx` | 249–255 | `handleCancel` — add timer teardown + reset |
| `app/screens/LoopScreen.tsx` | 257–271 | `handleSend` — add timer teardown (no reset — Processing freezes the count) |
| `app/screens/LoopScreen.tsx` | 297–301 | `waveformBars` derivation — becomes a direct state read |
| `app/screens/LoopScreen.module.css` | 163–169 | `.waveform` — add the 28px inset |
| `app/screens/LoopScreen.module.css` | 195–202 | `@keyframes waveform-bar-in` — vertical grow becomes horizontal slide |

### Current code

```tsx
/* app/screens/LoopScreen.tsx:46 */
/** The waveform row's bar heights (px), left to right, transcribed from
 * Figma's own full-width waveform (nodes 13698:7196 and 13696:7029 —
 * 08Talking-finished and Processing draw the identical 38-bar row) — literal
 * decorative geometry, not tokens, same exemption component-gaps.md already
 * gives the hint arrow and the summary stat chip. */
const WAVEFORM_BAR_HEIGHTS = [
  25, 30, 23, 23, 23, 21, 19, 16, 14, 16, 10, 10, 10, 16, 10, 10, 23, 21, 19, 16, 23, 23, 23, 23, 23, 23, 23, 23, 23,
  23, 23, 21, 19, 16, 23, 21, 19, 16,
];

/** How many bars reveal per recognized word (06Talking → 07KeepTalking →
 * 08Talking-finished, Figma's own three-frame progression of 0 → 16 → 38
 * bars): neither `webkitSpeechRecognition` nor the scripted stand-in exposes
 * live audio amplitude, so word count is the closest available proxy for
 * "as voice comes into the mic" — tuned so a typical sample answer (10-15
 * words) fills the row. */
const BARS_PER_WORD = 3;

function revealedBarCount(transcript: string): number {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(WAVEFORM_BAR_HEIGHTS.length, words * BARS_PER_WORD);
}
```

```tsx
/* app/screens/LoopScreen.tsx:143 */
const [phase, setPhase] = useState<Phase>('idle');
const [startingMic, setStartingMic] = useState(false);
const [transcript, setTranscript] = useState('');
const [idleNotice, setIdleNotice] = useState<'empty' | 'silence'>('empty');
const [stillListening, setStillListening] = useState(false);
const [processingPhrase, setProcessingPhrase] = useState<ProcessingPhrase>('think');

const speechRef = useRef<{ stop: () => void } | null>(null);
const recordingStartedAt = useRef(0);
const processingStartedAt = useRef(0);
const planRef = useRef<ProcessingPlan | null>(null);
const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const phaseRef = useRef<Phase>('idle');
const transcriptRef = useRef('');
useEffect(() => {
  phaseRef.current = phase;
  transcriptRef.current = transcript;
});
```

```tsx
/* app/screens/LoopScreen.tsx:181 */
// Cleanup on unmount (the caller swaps screens once an outcome fires, but
// Storybook/tests may unmount mid-take).
useEffect(() => () => {
  speechRef.current?.stop();
  clearTimers();
  clearSilenceTimer();
}, []);
```

```tsx
/* app/screens/LoopScreen.tsx:194 */
useEffect(() => {
  function handleInterruption() {
    if (phaseRef.current !== 'recording') return;
    speechRef.current?.stop();
    clearSilenceTimer();
    onInterrupted?.(transcriptRef.current);
    setPhase('idle');
    setIdleNotice('silence');
    setTranscript('');
    setStillListening(false);
  }
  document.addEventListener('visibilitychange', handleInterruption);
  window.addEventListener('pagehide', handleInterruption);
  return () => {
    document.removeEventListener('visibilitychange', handleInterruption);
    window.removeEventListener('pagehide', handleInterruption);
  };
}, [onInterrupted]);
```

```tsx
/* app/screens/LoopScreen.tsx:213 */
async function handleStart() {
  if (startingMic || phase !== 'idle') return;
  setStartingMic(true);
  const ok = await Promise.resolve(onStart ? onStart() : true);
  setStartingMic(false);
  if (!ok) return; // The caller shows the mic-off sheet instead.

  setIdleNotice('empty');
  setTranscript('');
  setStillListening(false);
  recordingStartedAt.current = Date.now();
  setPhase('recording');
  armSilenceTimer();

  const handleInterim = (textSoFar: string) => {
    setStillListening(false);
    armSilenceTimer();
    setTranscript(textSoFar);
  };

  if (scriptedAnswer === 'live' && isWebSpeechSupported()) {
    speechRef.current = startWebSpeech({ onInterim: handleInterim });
  } else {
    const text = scriptedTextFor(scriptedAnswer, question);
    speechRef.current = startScriptedSpeech(text, {
      onInterim: handleInterim,
      onFinal: () => {
        // Streaming finished, but push-to-talk means recording keeps going
        // (no auto-endpointing, CLAUDE.md) until the student taps Send —
        // and no further interim ever arrives, so the silence timer above
        // will fire "Still listening…" on its own if Send isn't tapped.
      },
    });
  }
}
```

```tsx
/* app/screens/LoopScreen.tsx:249 */
function handleCancel() {
  speechRef.current?.stop();
  clearSilenceTimer();
  setStillListening(false);
  setPhase('idle');
  setTranscript('');
}

function handleSend() {
  if (phase !== 'recording') return;
  const elapsedMs = Date.now() - recordingStartedAt.current;
  speechRef.current?.stop();
  clearSilenceTimer();
  setStillListening(false);
  const finalTranscript = transcript;
```

```tsx
/* app/screens/LoopScreen.tsx:297 */
const bubbleText = phase === 'processing' ? PROCESSING_COPY[processingPhrase] : question.prompt;
// Processing renders whatever count Recording last revealed, frozen (no
// more transcript updates land once processing starts) — the bars "stay,"
// they don't jump to a full row (your instruction, 2026-09-16).
const waveformBars = phase === 'idle' ? 0 : revealedBarCount(transcript);
```

```css
/* app/screens/LoopScreen.module.css:158 */
/* The Recording/Processing waveform row (component-gaps.md): bar width
   (space.150, 6px) and gap (space.100, 4px) match Figma's own 10px pitch
   exactly; bar heights themselves are literal, transcribed geometry (see
   LoopScreen.tsx's WAVEFORM_BAR_HEIGHTS comment). Fixed to the tallest bar's
   height so bars can grow without shifting the row. */
.waveform {
  display: flex;
  align-items: flex-end;
  gap: var(--size-space-100);
  height: 30px;
  overflow: hidden;
}
```

```css
/* app/screens/LoopScreen.module.css:195 */
@keyframes waveform-bar-in {
  from {
    transform: scaleY(0);
  }
  to {
    transform: scaleY(1);
  }
}
```

## Target

### `LoopScreen.tsx`

Remove `BARS_PER_WORD` and `revealedBarCount()` entirely. Add a reveal-cadence constant next to the existing `SILENCE_TIMEOUT_MS`:

```tsx
/** Waveform bars reveal one at a time on this clock while there's been
 * recent speech (2026-09-16, your call — replaces the earlier word-count
 * proxy). Gated by `stillListening` below: the clock only advances between
 * "a sound has been heard" and "3s of silence" — the same two states that
 * already drive the "Still listening…" cue, so the two read as
 * complementary rather than two separate signals. No live amplitude signal
 * exists (`webkitSpeechRecognition` doesn't expose one), so "a sound has
 * been heard" means "at least one interim result has arrived," not a real
 * volume threshold. */
const WAVEFORM_REVEAL_INTERVAL_MS = 200;
```

Add state and refs alongside the existing ones:

```tsx
const [waveformBars, setWaveformBars] = useState(0);
```

```tsx
const waveformTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
const stillListeningRef = useRef(false);
const hasHeardSpeechRef = useRef(false);
```

Extend the existing sync effect to also mirror `stillListening` (same pattern already used for `phaseRef`/`transcriptRef`, needed here because the interval's tick callback closes over stale state otherwise):

```tsx
useEffect(() => {
  phaseRef.current = phase;
  transcriptRef.current = transcript;
  stillListeningRef.current = stillListening;
});
```

Add a teardown helper next to `clearSilenceTimer`:

```tsx
function clearWaveformTimer() {
  if (waveformTimerRef.current) clearInterval(waveformTimerRef.current);
  waveformTimerRef.current = null;
}
```

Unmount cleanup — add `clearWaveformTimer()`:

```tsx
useEffect(() => () => {
  speechRef.current?.stop();
  clearTimers();
  clearSilenceTimer();
  clearWaveformTimer();
}, []);
```

Interruption handler — add `clearWaveformTimer()` and reset both the count and `hasHeardSpeechRef`:

```tsx
function handleInterruption() {
  if (phaseRef.current !== 'recording') return;
  speechRef.current?.stop();
  clearSilenceTimer();
  clearWaveformTimer();
  onInterrupted?.(transcriptRef.current);
  setPhase('idle');
  setIdleNotice('silence');
  setTranscript('');
  setStillListening(false);
  setWaveformBars(0);
  hasHeardSpeechRef.current = false;
}
```

`handleStart` — reset the new refs/state, and start an interval whose tick checks both gates before incrementing. `handleInterim` gains one line (`hasHeardSpeechRef.current = true`) — this is the only change to it:

```tsx
setIdleNotice('empty');
setTranscript('');
setStillListening(false);
setWaveformBars(0);
recordingStartedAt.current = Date.now();
setPhase('recording');
armSilenceTimer();

hasHeardSpeechRef.current = false;
clearWaveformTimer();
waveformTimerRef.current = setInterval(() => {
  if (!hasHeardSpeechRef.current || stillListeningRef.current) return;
  setWaveformBars((n) => Math.min(WAVEFORM_BAR_HEIGHTS.length, n + 1));
}, WAVEFORM_REVEAL_INTERVAL_MS);

const handleInterim = (textSoFar: string) => {
  hasHeardSpeechRef.current = true;
  setStillListening(false);
  armSilenceTimer();
  setTranscript(textSoFar);
};
```

(The `if (scriptedAnswer === 'live' ...) { ... } else { ... }` block below this is unchanged.)

`handleCancel` — add teardown and reset:

```tsx
function handleCancel() {
  speechRef.current?.stop();
  clearSilenceTimer();
  clearWaveformTimer();
  setStillListening(false);
  setPhase('idle');
  setTranscript('');
  setWaveformBars(0);
  hasHeardSpeechRef.current = false;
}
```

`handleSend` — add teardown only, **no reset** (Processing must keep showing whatever count Recording reached):

```tsx
function handleSend() {
  if (phase !== 'recording') return;
  const elapsedMs = Date.now() - recordingStartedAt.current;
  speechRef.current?.stop();
  clearSilenceTimer();
  clearWaveformTimer();
  setStillListening(false);
  const finalTranscript = transcript;
```

Bar count derivation — delete the line entirely; the render already has `waveformBars` in scope from the new `useState`:

```tsx
const bubbleText = phase === 'processing' ? PROCESSING_COPY[processingPhrase] : question.prompt;
```

(Delete the `// Processing renders whatever count...` comment and the `const waveformBars = ...` line below it.)

### `LoopScreen.module.css`

Add the 28px inset to `.waveform`. `Screen`'s own `.bottomContent` (`app/components/Screen.module.css:126`) already applies `padding: var(--size-space-400)` (16px) around everything in this slot, including the button row below the waveform — that 16px stays as-is for the button row (out of scope here, see below). This plan only widens the waveform row's own inset by the remaining 12px (`--size-space-300`) so its total distance from the screen edge reaches Figma's 28px (`--size-space-700`, confirmed against node `13696:7029`): `16px (Screen's own padding) + 12px (this addition) = 28px`.

```css
.waveform {
  display: flex;
  align-items: flex-end;
  gap: var(--size-space-100);
  height: 30px;
  padding-inline: var(--size-space-300);
  overflow: hidden;
  box-sizing: border-box;
}
```

Replace the vertical grow-in with a horizontal slide-in from the right, and fold in a real cubic-bezier while this line is being touched anyway (this is the fix `plans/002-weak-built-in-easings.md` deliberately excluded, since it knew this rewrite was coming):

```css
@keyframes waveform-bar-in {
  from {
    transform: translateX(16px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

```css
.waveformBar {
  animation: waveform-bar-in 150ms cubic-bezier(0.19, 1, 0.22, 1);
}
```

**Why these values:**
- `200ms` interval: close to the existing `WORD_INTERVAL_MS` (220ms) reading-pace constant already established in `lib/recall/scriptedTranscript.ts`, for a comparable "steady reveal" feel elsewhere in this same feature.
- Gating on `hasHeardSpeechRef` + `!stillListeningRef.current`: reuses the screen's own existing silence detector instead of adding a second one — the two cues (bars advancing, "Still listening…" showing) become mechanically complementary rather than independently tuned.
- `padding-inline: var(--size-space-300)` (12px) on top of `Screen`'s existing 16px: reaches Figma's cited 28px total using two real tokens rather than one new hardcoded value.
- `translateX(16px)`: matches the `--size-space-400` token (16px) already used throughout this file for spacing — a small, deliberate "just arrived from the right" distance, not a large distracting slide. (This is independent of the 28px container inset above — it's the distance an individual bar travels while mounting, not the row's position.)
- `150ms cubic-bezier(0.19, 1, 0.22, 1)`: `--ease-out-expo`, the course's curve for a strong, responsive entrance — appropriate since this is an element entering the screen. Duration unchanged from today (150ms), already within the sub-300ms budget for a small UI entrance.

## Conventions to follow

- `lib/recall/scriptedTranscript.ts`'s `startScriptedSpeech` (its `tick()` function, driven by `WORD_INTERVAL_MS`) is the exemplar for "reveal something on a steady JS-timer clock" already in this codebase.
- `armSilenceTimer` / `clearSilenceTimer` and the `phaseRef`/`transcriptRef` sync effect (already in `LoopScreen.tsx`) are the exemplars for this plan's `clearWaveformTimer` and `stillListeningRef` — same ref-mirroring shape, same set of call sites (unmount, interruption, cancel, send).
- Keep `WAVEFORM_BAR_HEIGHTS` exactly as-is — this plan changes *when* a bar reveals, not what height it reveals at.
- Don't touch `Screen.module.css`'s `.bottomContent` padding (16px) — it's shared by every screen in the app, not just this one. This plan's 12px addition is scoped to `.waveform` alone.

## Steps

1. In `app/screens/LoopScreen.tsx`, delete the `BARS_PER_WORD` constant and its doc comment, and delete the `revealedBarCount()` function.
2. Add the `WAVEFORM_REVEAL_INTERVAL_MS` constant (with its doc comment) near `SILENCE_TIMEOUT_MS`.
3. Add `const [waveformBars, setWaveformBars] = useState(0);` alongside the other `useState` calls.
4. Add `waveformTimerRef`, `stillListeningRef`, and `hasHeardSpeechRef` alongside the other refs.
5. Extend the `phaseRef`/`transcriptRef` sync `useEffect` to also set `stillListeningRef.current = stillListening;`.
6. Add the `clearWaveformTimer()` helper function next to `clearSilenceTimer()`.
7. Update the unmount cleanup `useEffect` to also call `clearWaveformTimer()`.
8. Update `handleInterruption` to call `clearWaveformTimer()`, reset `setWaveformBars(0)`, and reset `hasHeardSpeechRef.current = false`.
9. Update `handleStart`: reset `waveformBars`/`hasHeardSpeechRef`, add the `clearWaveformTimer()` + gated `setInterval(...)` block, and add the one-line change to `handleInterim` (`hasHeardSpeechRef.current = true`).
10. Update `handleCancel` to call `clearWaveformTimer()`, reset `setWaveformBars(0)`, and reset `hasHeardSpeechRef.current = false`.
11. Update `handleSend` to call `clearWaveformTimer()` (no reset of bars or `hasHeardSpeechRef`).
12. Delete the `const waveformBars = phase === 'idle' ? 0 : revealedBarCount(transcript);` line and its comment near `bubbleText`.
13. In `app/screens/LoopScreen.module.css`, add `padding-inline: var(--size-space-300);` and `box-sizing: border-box;` to `.waveform`.
14. Replace the `@keyframes waveform-bar-in` block with the `translateX`/`opacity` version above, and change `.waveformBar`'s `animation` declaration's easing from `ease-out` to `cubic-bezier(0.19, 1, 0.22, 1)`.

## Out of scope

- `waveform-pulse` (Processing's loop) — untouched by this plan; see `plans/001-waveform-pulse-restart-glitch.md` and `plans/003-processing-motion-cohesion.md` for its fixes.
- Adding real microphone amplitude analysis (`getUserMedia` + `AnalyserNode`) — "sound coming in" here still means "an interim result arrived," not a measured volume level. A real amplitude-reactive waveform is a larger, previously-flagged follow-up (`sprint-context.md`, 2026-09-16), not this plan's job.
- `Screen.module.css`'s shared `.bottomContent` padding, and the button row's own horizontal position — both stay at the existing 16px inset.
- The `--waveform-bar-delay` stagger pattern used during Processing (a separate, unselected audit finding).
- Do not introduce a new animation library — this stays plain CSS `@keyframes` plus a `setInterval`, matching the rest of the codebase.

## Steps for the docs (not code, but don't skip)

`component-gaps.md`, `sprint-context.md`, and `SPEC.md` all currently describe the waveform reveal as word-count-driven. Once this plan lands, those descriptions go stale — they should be updated to describe the sound-gated interval reveal instead, following this repo's existing convention of appending a dated decision entry to `sprint-context.md`. This isn't part of the animation fix itself, but leaving the docs describing the old mechanism would misdirect the next person who reads them.

## Verification

**Build**
- [ ] Type-check and lint pass.
- [ ] `LoopScreen.stories.tsx`'s `Recording` story currently asserts bars appear as the scripted answer streams in (`data-bar-count` becomes visible and > 0). That assertion should still pass as written, since `scriptedAnswer: 'pass'` streams real interim text, which now sets `hasHeardSpeechRef.current = true` and lets the gated interval advance — but confirm it, since the timing mechanism underneath changed.
- [ ] `LoopScreen.stories.tsx`'s `StillListeningCue` story (`scriptedAnswer: 'blank'`) should still pass unmodified: `blank` never fires `onInterim`, so `hasHeardSpeechRef.current` stays `false` and the waveform never advances at all while "Still listening…" shows — this is a good manual check that the two cues are correctly mutually exclusive.
- [ ] `LoopScreen.stories.tsx`'s `Processing` story asserts the bar count carries over unchanged from Recording into Processing — should still pass, since freezing happens via `clearWaveformTimer()` same as before.

**Behavior**
- [ ] Start Recording and stay silent: no bars ever appear (unlike the previous version of this plan, which would have ticked regardless of silence). Once `SILENCE_TIMEOUT_MS` (3s) elapses, "Still listening…" shows — this now happens with zero bars visible, whereas before it could show mid-way through a partially-filled row on a genuinely silent take.
- [ ] Start Recording, speak, then go silent for 3+ seconds: bars stop advancing at the exact moment "Still listening…" appears, and resume advancing the moment speech resumes (do not expect them to "catch up" — they simply continue from wherever they'd reached).
- [ ] Continuous speech with no pauses: bars trickle in steadily at the 200ms clock, sliding in from the right rather than growing vertically.
- [ ] The waveform row sits 28px in from both screen edges — narrower than the button row below it, which stays at 16px. Confirm this visually against Figma node `13696:7029`.
- [ ] Cancel mid-recording: the waveform disappears immediately (count resets to 0) along with the transcript.
- [ ] Send: the waveform freezes at its current count and carries into Processing unchanged.
- [ ] With `prefers-reduced-motion: reduce` emulated, bars still appear/pause on the same sound-gated logic (that's data, not decoration) but each one appears instantly at its final position and opacity, with no slide/fade.

**Feel**
- [ ] Record a full Recording take that includes at least one deliberate pause long enough to trigger "Still listening…", and scrub frame by frame — the handoff between "bars advancing" and "Still listening… showing, no bars" should feel like one continuous idea (sound in → bars; sound stops → text), not two things that happen to both be true at once.
- [ ] Look at it again with fresh eyes before calling it done — 200ms and the 3s silence threshold were both existing/carried-over values, not re-derived for this specific combination; if the combined effect reads oddly (e.g. bars feel like they lag behind actually-audible speech), that's worth a tuning pass, not a reason to abandon the approach.

## Notes

- **"Sound" here means "an interim result arrived," not a measured volume.** Both `webkitSpeechRecognition` and the scripted stand-in only expose discrete text-so-far callbacks, never amplitude — so a brief "hmm" that the recognizer doesn't transcribe as a word won't count as sound for this purpose, same limitation the original word-count proxy had. This plan doesn't change that ceiling, it just changes how the existing signal is used.
- **28px was read directly off Figma node `13696:7029`** (the Processing frame's own bottomContent, where the waveform sits at the same x-inset the button row also uses in that file) — cross-checked against `--size-space-700` (28px), a real existing token, so no new value needed introducing. If you want the button row to also move to 28px to match Figma exactly (currently it's at 16px via `Screen`'s shared padding, which is *not* Figma's own per-pixel value either), that's a separate, larger change affecting every screen that uses `Screen`, not scoped to this plan.
