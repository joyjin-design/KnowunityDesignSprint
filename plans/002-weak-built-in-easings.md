# 002 — Replace weak built-in easing keywords with real cubic-béziers

- **Commit:** f7251d2
- **Severity:** MEDIUM
- **Category:** Easing & duration
- **Estimated scope:** 1 file, 2 lines

## Problem

`thinking-bob` (the Processing mascot's idle bob) and `waveform-pulse` (the Processing waveform's equalizer loop) both use the bare `ease-in-out` keyword. Built-in named curves are almost never strong enough — their acceleration is too weak, so the motion reads flatter/slower than intended even at the same duration. The fix is the same in both places: swap the keyword for a real cubic-bezier from the course's own curve set.

A third site, `waveform-bar-in`'s `ease-out` keyword, has the identical problem but is intentionally **not** included here — `plans/004-continuous-right-entry-waveform-reveal.md` rewrites that keyframe's entrance mechanism entirely (right-to-left slide instead of a vertical scale), so fixing its easing here would just be overwritten. That plan already specifies a real curve for its replacement.

## Where

| File | Lines | What's there |
| --- | --- | --- |
| `app/screens/LoopScreen.module.css` | 48–52 | `thinking-bob`'s animation declaration |
| `app/screens/LoopScreen.module.css` | 184–193 | `waveform-pulse`'s animation declaration |

### Current code

```css
/* app/screens/LoopScreen.module.css:48 */
@media (prefers-reduced-motion: no-preference) {
  .mascot[data-thinking] .mascotArt {
    animation: thinking-bob 1.6s ease-in-out infinite;
  }
}
```

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
```

## Target

Both `ease-in-out` keywords become `cubic-bezier(0.645, 0.045, 0.355, 1)` — the course's `--ease-in-out-cubic`, described as "on-screen back-and-forth," which is exactly what both of these are (a bob moving up and down, a bar scaling up and down while already on screen). Nothing else on these lines changes — durations, `infinite`, and the delay variable stay as they are.

```css
@media (prefers-reduced-motion: no-preference) {
  .mascot[data-thinking] .mascotArt {
    animation: thinking-bob 1.6s cubic-bezier(0.645, 0.045, 0.355, 1) infinite;
  }
}
```

```css
@media (prefers-reduced-motion: no-preference) {
  .waveformBar {
    animation: waveform-bar-in 150ms ease-out;
  }

  .waveform[data-animate] .waveformBar {
    animation: waveform-pulse 2s cubic-bezier(0.645, 0.045, 0.355, 1) infinite;
    animation-delay: var(--waveform-bar-delay, 0s);
  }
}
```

**Why this value:** `cubic-bezier(0.645, 0.045, 0.355, 1)` is the *Animations on the Web* course's cited replacement for `ease-in-out` specifically for "moving/morphing while already on screen" — both the bob and the pulse are on-screen back-and-forth motion, not an entrance or a hover, so this is the correct category, not just a stronger version of the same keyword.

## Conventions to follow

- Leave `waveform-bar-in`'s `ease-out` keyword on line 186 untouched — see Problem above.
- No shared easing tokens exist yet in `tokens/tokens.json` or `build/css/tokens.css` (confirmed: motion has no token entries, only color/size/typography do). Don't introduce a `--ease-*` CSS custom property for this fix — write the cubic-bezier inline, matching how `ExamPlanScreen.module.css:91` and `:98` and `:178` already do it (e.g. `animation-timing-function: cubic-bezier(0.645, 0.045, 0.355, 1);` on the hint-arrow draw, and `cubic-bezier(0.19, 1, 0.22, 1)` on the badge ping) — inline cubic-beziers are this repo's existing convention, not a gap to fix in this plan.

## Steps

1. In `app/screens/LoopScreen.module.css` line 50, replace `ease-in-out` with `cubic-bezier(0.645, 0.045, 0.355, 1)` in the `thinking-bob` animation declaration.
2. In the same file, line 190, replace `ease-in-out` with `cubic-bezier(0.645, 0.045, 0.355, 1)` in the `waveform-pulse` animation declaration.
3. Do not touch line 186 (`waveform-bar-in`'s `ease-out`).

## Out of scope

- `waveform-bar-in`'s easing (plan 004).
- Any duration change — that's `plans/003-processing-motion-cohesion.md`, which touches these same two lines next. Apply this plan before that one (see `plans/README.md` for order).
- `ExamPlanScreen.module.css` and `Button.module.css` — already audited, no changes needed there.

## Verification

**Build**
- [ ] Type-check and lint pass.
- [ ] No story exercises exact easing values, so no story assertions should break; run the full `LoopScreen` story suite anyway to confirm nothing else regressed.

**Behavior**
- [ ] With `prefers-reduced-motion: reduce` emulated, neither animation runs (unaffected by this change, just confirm the edit stayed inside the existing `@media` blocks).

**Feel**
- [ ] Record the Processing state (mascot bob + waveform pulse together) and scrub frame by frame. Both should now feel like they accelerate into and decelerate out of each extreme more distinctly than before — if it looks the same as before the edit, double check the cubic-bezier landed on the right line.
- [ ] Look at it again with fresh eyes before calling it done.

## Notes

This plan and `plans/003-processing-motion-cohesion.md` both edit lines 50 and 190 of the same file. Apply this one (002) first — it changes only the easing keyword and leaves durations at `1.6s`/`2s`. Plan 003 then changes only the duration (`2s` → `1.6s`) on top of whatever easing is already there. Applying them in the other order works too, mechanically, but 002-then-003 is the order both plans were written against.
