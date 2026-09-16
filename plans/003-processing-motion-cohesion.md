# 003 — Match the mascot bob and waveform pulse periods so Processing reads as one thing

- **Commit:** f7251d2
- **Severity:** MEDIUM
- **Category:** Cohesion, hierarchy & spatial consistency
- **Estimated scope:** 1 file, 1 line

## Problem

During Processing, two looping animations run at once on the same screen: the mascot's `thinking-bob` (`1.6s` period) and the waveform's `waveform-pulse` (`2s` period). Both exist to signal the same thing — "Knowie is thinking about your answer" — but because their periods don't share a common multiple that's short enough to read as intentional, they drift in and out of phase continuously for as long as Processing runs. The two signals never look coordinated; it reads as two separate mechanisms happening to run near each other, not one cohesive "thinking" moment. The course's rule: sub-animations of one component (here, "the thinking state") should share a timing feel, the way the Family Drawer overrides Vaul's 500ms to 200ms so its opening and height-change animations feel unified.

## Where

| File | Lines | What's there |
| --- | --- | --- |
| `app/screens/LoopScreen.module.css` | 50 | `thinking-bob`'s duration (leave unchanged) |
| `app/screens/LoopScreen.module.css` | 190 | `waveform-pulse`'s duration (change this) |

### Current code

Assumes `plans/002-weak-built-in-easings.md` has already been applied (see that plan's Notes on ordering). If it hasn't, the easing keyword will still be `ease-in-out` here instead of the cubic-bezier shown — only the duration number (`2s`) is this plan's concern either way.

```css
/* app/screens/LoopScreen.module.css:48 */
@media (prefers-reduced-motion: no-preference) {
  .mascot[data-thinking] .mascotArt {
    animation: thinking-bob 1.6s cubic-bezier(0.645, 0.045, 0.355, 1) infinite;
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
    animation: waveform-pulse 2s cubic-bezier(0.645, 0.045, 0.355, 1) infinite;
    animation-delay: var(--waveform-bar-delay, 0s);
  }
}
```

## Target

Change only `waveform-pulse`'s duration from `2s` to `1.6s`, matching `thinking-bob` exactly. Leave `thinking-bob` itself untouched — it's the existing, already-shipped value; the waveform is the newer addition and moves to match it.

```css
.waveform[data-animate] .waveformBar {
  animation: waveform-pulse 1.6s cubic-bezier(0.645, 0.045, 0.355, 1) infinite;
  animation-delay: var(--waveform-bar-delay, 0s);
}
```

**Why this value:** `1.6s` is the mascot bob's own existing, already-shipped period — matching it exactly is the cheapest way to make the two loops phase-lock instead of drift. `1.6s` is still clearly slower than a typical equalizer animation (course guidance and the original build note both point at ~0.6–1s as the "usual snappy version"), so this doesn't undo the original "a bit slower" intent behind the waveform pulse — it just lands on a specific slow value that happens to already exist elsewhere in this same screen, instead of an independently-chosen `2s`.

## Conventions to follow

- `app/screens/LoopScreen.module.css:50`'s `thinking-bob` declaration is the exemplar here — match its exact duration, don't introduce a third value.
- Per-bar stagger (`--waveform-bar-delay`) is untouched by this plan — that's a separate, not-yet-selected finding (`#5` in the audit: the stagger pattern repeats every 8 bars and may read mechanical). Don't touch it here.

## Steps

1. In `app/screens/LoopScreen.module.css`, on the `.waveform[data-animate] .waveformBar` rule (around line 190), change the animation duration from `2s` to `1.6s`. Leave the easing value (whatever plan 002 left it as) and `animation-delay` untouched.
2. Do not change `thinking-bob`'s duration on line 50.

## Out of scope

- The stagger pattern / `--waveform-bar-delay` values (a separate, unselected audit finding).
- `thinking-bob`'s own duration or easing.
- `waveform-bar-in` (plan 004).
- Any change to `LoopScreen.tsx`.

## Verification

**Build**
- [ ] Type-check and lint pass.
- [ ] `LoopScreen.stories.tsx`'s `Processing` story still passes (it doesn't assert on timing values, only that the waveform carries over and gets `data-animate` — unaffected by a duration change).

**Behavior**
- [ ] With `prefers-reduced-motion: reduce` emulated, neither loop runs — unaffected by this change.

**Feel**
- [ ] Watch Processing run for at least two full loop cycles (~3.2s at the new shared period). The mascot bob and the waveform pulse should visibly reach their extremes together, rather than sliding past each other.
- [ ] Record it and scrub frame by frame to confirm the two peaks actually align — "close" periods can still look wrong; they need to be identical, which this plan makes them.
- [ ] Look at it again with fresh eyes before calling it done.

## Notes

This is presented as a mechanical fix (match the existing value), but "should these read as one entity" is ultimately a feel judgment — if after matching the periods the mascot and waveform still don't feel coordinated (e.g. because the bob's vertical arc and the waveform's height pulse are visually too different in *character*, not just timing), that's a further design conversation, not something to keep tuning blindly against this plan.
