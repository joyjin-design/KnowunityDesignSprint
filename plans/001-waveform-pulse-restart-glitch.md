# 001 — Fix the visible snap when Recording hands off to Processing

- **Commit:** f7251d2
- **Severity:** HIGH
- **Category:** Interruptibility & springs
- **Estimated scope:** 1 file, ~6 lines

## Problem

`.waveformBar` runs one `animation` at a time via the CSS shorthand: `waveform-bar-in` while a bar is mounting, then `waveform-pulse` once `.waveform` gets `data-animate` (Processing). Switching the `animation` property always restarts the new keyframe from its own `0%`. `waveform-pulse`'s `0%` is `scaleY(0.4)`, but every bar is actually sitting at `scaleY(1)` (its settled, fully-mounted height) the instant Send is tapped. The result: every visible bar visibly snaps down to 40% height, then eases back up — a glitch, not an equalizer starting up — at the exact moment the student is watching most closely (right after they tap Send). This is the same class of bug as the Sonner "toast jump": `@keyframes` restart from zero instead of retargeting from the current value.

## Where

| File | Lines | What's there |
| --- | --- | --- |
| `app/screens/LoopScreen.module.css` | 184–212 | The bar's mount animation, the Processing pulse, and both keyframe blocks |

### Current code

```css
/* app/screens/LoopScreen.module.css:184 */
@media (prefers-reduced-motion: no-preference) {
  .waveformBar {
    animation: waveform-bar-in 150ms ease-out;
  }

  .waveform[data-animate] .waveformBar {
    animation: waveform-pulse 2s ease-in-out infinite;
    animation-delay: var(--waveform-bar-delay, 0s);
  }
}

@keyframes waveform-bar-in {
  from {
    transform: scaleY(0);
  }
  to {
    transform: scaleY(1);
  }
}

@keyframes waveform-pulse {
  0%,
  100% {
    transform: scaleY(0.4);
  }
  50% {
    transform: scaleY(1);
  }
}
```

## Target

Only `waveform-pulse`'s keyframe values change — `0%`/`100%` become the bar's resting height (`scaleY(1)`, matching what `waveform-bar-in` already ends on), and the dip moves to `50%`. Nothing else in this file changes.

```css
@keyframes waveform-pulse {
  0%,
  100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.4);
  }
}
```

**Why this value:** when the `animation` shorthand swaps from `waveform-bar-in` to `waveform-pulse`, the browser always starts the new keyframe at its own `0%`. Making that `0%` match the bar's actual resting state (`scaleY(1)`) means the swap is visually silent — the loop then dips to 40% and back as its own animation, instead of the dip happening as an unintended restart artifact.

## Conventions to follow

- Don't touch `waveform-bar-in`'s keyframes or the `150ms ease-out` timing on `.waveformBar` — that site is being redesigned in `plans/004-continuous-right-entry-waveform-reveal.md`. If plan 004 hasn't landed yet, leave `waveform-bar-in` exactly as-is here.
- Don't touch the `ease-in-out` keyword on `waveform-pulse`'s usage (line 190) or `thinking-bob`'s easing/duration (line 50) — those are `plans/002-weak-built-in-easings.md` and `plans/003-processing-motion-cohesion.md`. This plan is scoped to the keyframe values only.

## Steps

1. In `app/screens/LoopScreen.module.css`, edit the `@keyframes waveform-pulse` block (around line 204): swap `0%, 100%` to `transform: scaleY(1);` and `50%` to `transform: scaleY(0.4);`.
2. Leave every other line in this file untouched.

## Out of scope

- `waveform-bar-in`'s keyframes, easing, or duration.
- `waveform-pulse`'s easing keyword, duration, or the `--waveform-bar-delay` stagger.
- The mascot `thinking-bob` animation.
- Any change to `LoopScreen.tsx`.

## Verification

**Build**
- [ ] Type-check and lint pass (no TS/CSS syntax errors from the edit).
- [ ] `app/screens/LoopScreen.stories.tsx`'s `Processing` story still passes — it already asserts the waveform carries the same `data-bar-count` across the Send transition; this change doesn't affect that count, only the transform values.

**Behavior**
- [ ] In the app (or the `Processing` Storybook story), start Recording, let a few bars reveal, tap Send. The bars should NOT visibly jump/snap at the moment Send is tapped — they should smoothly begin pulsing from their current height.
- [ ] With `prefers-reduced-motion: reduce` emulated in DevTools, no pulse animation runs at all (already correctly gated by the surrounding `@media` block — just confirm the edit didn't move code outside it).

**Feel**
- [ ] Record the Send transition and scrub frame by frame in DevTools' animation inspector — the bar's `scaleY` value at the frame before and the frame after the `animation` property swaps should be identical (both `1`).
- [ ] Look at it again with fresh eyes before calling it done — this bug is easy to miss at full speed and obvious once you know to look for it.

## Notes

None — this is a narrow, mechanical fix with no open design questions.
