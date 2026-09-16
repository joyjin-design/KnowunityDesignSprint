# 006 — Fade in the button-row icons that swap when Recording starts

- **Commit:** 0b0ada8
- **Severity:** MEDIUM
- **Category:** Cohesion, hierarchy & spatial consistency
- **Estimated scope:** 2 files, ~30 lines

## Problem

Tapping Start swaps `ButtonIcon`'s glyph (`SkipIcon` → `ArrowCounterClockwise`) and `ButtonVoice`'s `leftIcon` (`Microphone` → `WaveformIcon`) in the same instant, as a hard React remount with zero transition — the old icon vanishes, the new one appears, no crossfade. This is a deliberate, occasional action (~8 times a session, once per question), which the course's frequency rule says deserves *standard* motion, not none — and it currently sits right next to the waveform row, which already gets a crafted `translateX` + opacity entrance (`app/screens/LoopScreen.module.css:238-247`) at that exact same moment. The screen reads as half-animated, half-snapped at the one moment it changes the most.

## Where

| File | Lines | What's there |
| --- | --- | --- |
| `app/screens/LoopScreen.tsx` | 399–406 | `ButtonIcon`'s `icon` prop, swapped by ternary |
| `app/screens/LoopScreen.tsx` | 407–419 | `ButtonVoice`'s `leftIcon` prop, swapped by ternary |
| `app/screens/LoopScreen.module.css` | — | No rule for this yet; a new one is added |

### Current code

```tsx
/* app/screens/LoopScreen.tsx:399 */
            <ButtonIcon
              variant="Secondary"
              size="L"
              icon={phase !== 'idle' ? <ArrowCounterClockwise size="100%" aria-hidden="true" /> : <SkipIcon />}
              aria-label={phase !== 'idle' ? 'Discard and start over' : 'Skip'}
              disabled={phase === 'processing'}
              onClick={phase === 'recording' ? handleCancel : phase === 'idle' ? onSkipIdle : undefined}
            />
            <ButtonVoice
              state={startingMic ? 'Loading' : phase !== 'idle' ? 'Recording' : 'Default'}
              ctaText={phase !== 'idle' ? 'Send' : 'Start'}
              disabled={phase === 'processing'}
              leftIcon={
                phase !== 'idle' ? (
                  <WaveformIcon size="100%" aria-hidden="true" />
                ) : (
                  <Microphone size="100%" aria-hidden="true" />
                )
              }
              onClick={phase === 'recording' ? handleSend : phase === 'idle' ? handleStart : undefined}
            />
```

## Target

Wrap each swapped icon in a small `<span>` keyed on which icon it is, so switching options is a genuine remount (triggering a mount-based `animation`, the same mechanism `waveform-bar-in` already uses for the same reason — see Conventions below) rather than React patching an existing node's children in place. The wrapper needs an explicit `width: 100%; height: 100%;` because these icons size themselves via `size="100%"` against their immediate parent, and `Button`/`ButtonIcon`'s own `.icon` span is the one with the real pixel dimensions (`app/components/Button.module.css:135-138`) — an unsized `display: inline-flex` wrapper in between would break that percentage chain.

```tsx
/* app/screens/LoopScreen.tsx:399 */
            <ButtonIcon
              variant="Secondary"
              size="L"
              icon={
                phase !== 'idle' ? (
                  <span key="discard" className={styles.iconSwap}>
                    <ArrowCounterClockwise size="100%" aria-hidden="true" />
                  </span>
                ) : (
                  <span key="skip" className={styles.iconSwap}>
                    <SkipIcon />
                  </span>
                )
              }
              aria-label={phase !== 'idle' ? 'Discard and start over' : 'Skip'}
              disabled={phase === 'processing'}
              onClick={phase === 'recording' ? handleCancel : phase === 'idle' ? onSkipIdle : undefined}
            />
            <ButtonVoice
              state={startingMic ? 'Loading' : phase !== 'idle' ? 'Recording' : 'Default'}
              ctaText={phase !== 'idle' ? 'Send' : 'Start'}
              disabled={phase === 'processing'}
              leftIcon={
                phase !== 'idle' ? (
                  <span key="waveform" className={styles.iconSwap}>
                    <WaveformIcon size="100%" aria-hidden="true" />
                  </span>
                ) : (
                  <span key="mic" className={styles.iconSwap}>
                    <Microphone size="100%" aria-hidden="true" />
                  </span>
                )
              }
              onClick={phase === 'recording' ? handleSend : phase === 'idle' ? handleStart : undefined}
            />
```

```css
/* app/screens/LoopScreen.module.css — new rule, near the other keyframes */
.iconSwap {
  display: inline-flex;
  width: 100%;
  height: 100%;
}

@media (prefers-reduced-motion: no-preference) {
  .iconSwap {
    animation: icon-fade-in 150ms ease;
  }
}

@keyframes icon-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

**Why these values:** 150ms is the shortest step on this file's own duration scale (`waveform-bar-in` used 150ms before plans/004 lengthened it to 220ms for a *travelling* entrance — a same-spot opacity fade needs less time than a translating one, so the original 150ms fits here). `ease` (not a custom cubic-bezier) matches the course's own guidance that hover/color-style fades use plain `ease`, reserving custom curves for entrances/exits with actual movement — this fade has no transform, only opacity. `icon-fade-in` is a fade-*in* only, no fade-out: the old icon is removed the instant React swaps it (unmounting doesn't support a CSS exit without extra state machinery), and per the course's own asymmetric-timing rule, exits are allowed to be shorter/simpler than entries — an instant removal paired with a quick fade-in is the honest version of that, not a corner cut silently.

## Conventions to follow

- `waveform-bar-in` (`app/screens/LoopScreen.module.css:238-247`) is the exemplar for "a mount-triggered `animation`, not a `transition`, because the element is genuinely swapped (different content), not toggled via an attribute on a stable node." Same reasoning applies here: `ButtonIcon`'s `icon` prop and `ButtonVoice`'s `leftIcon` prop each receive a *different element* on swap, so only a mount-based `animation` fires correctly — a `transition` would need the same DOM node to persist across the change, which it doesn't.
- Keep the new CSS local to `LoopScreen.module.css`, not `Button.module.css` or `ButtonIcon.module.css` — those two are shared by every button in the app (Idle, Verdict, Why?, Mic-off, Gate, Summary all use them), and this fix is specific to these two call sites' icon-swapping behavior. Don't add motion to the shared primitives themselves.

## Steps

1. In `app/screens/LoopScreen.tsx`, wrap each of the four icon options (`ArrowCounterClockwise`, `SkipIcon`, `WaveformIcon`, `Microphone`) in a `<span key="..." className={styles.iconSwap}>` as shown in Target, using the exact key strings given (`"discard"`, `"skip"`, `"waveform"`, `"mic"`).
2. In `app/screens/LoopScreen.module.css`, add the `.iconSwap` rule, the `prefers-reduced-motion: no-preference` media block wrapping its `animation` declaration, and the `@keyframes icon-fade-in` block, exactly as shown in Target. Place it near the file's other small decorative keyframes (e.g. after `waveform-pulse`) for locality.

## Out of scope

- **`ButtonVoice`'s text label swap** ("Start" ↔ "Send") and **`ButtonIcon`'s `aria-label` swap** ("Skip" ↔ "Discard and start over") are not touched. `ButtonVoiceProps.ctaText` is currently typed as a plain `string` (`app/components/ButtonVoice.tsx:38-53`), not `ReactNode`, so wrapping it the same way this plan wraps icons would require widening that prop's type — a small but real API change to a shared component, out of scope for this plan. If wanted later, it's the same `key`-based mount-fade pattern applied to the text span instead of the icon span.
- **"Can't talk right now" disappearing** (`app/screens/LoopScreen.tsx:421-425`) is not touched. It's conditionally rendered only at `phase === 'idle'`, so like the icons it's a hard unmount with no exit — but unlike the icons, there's no "new element fading in" to pair it with; animating its *removal* would mean keeping it mounted longer (mirroring `.stillListening`'s always-mounted-plus-opacity-toggle approach earlier in this file) which permanently reserves its ~48px+gap height during Recording, shrinking the transcript area's available room for the whole take. That's a real trade-off, not a free fix — left for a human decision, not assumed here. See Notes.
- Don't touch `Button.module.css` or `ButtonIcon.module.css` (shared primitives — see Conventions).
- Don't add a fade-*out* for the removed icon — see "Why these values" above for why an instant removal is the deliberate choice here, not an oversight.
- Don't change `waveform-bar-in`, `waveform-pulse`, `thinking-bob`, or `.stillListening` — all unrelated to this fix.

## Verification

**Build**
- [ ] Type-check and lint pass.
- [ ] `npx vitest run --project=storybook`: `Idle`, `Recording`, `MicUnavailable`, `AccidentalTap`, and `Processing` stories in `LoopScreen.stories.tsx` all still pass unmodified — none of them assert on the icon's own DOM structure, only on the button's accessible name/role, which is unaffected by wrapping the icon in a span.

**Behavior**
- [ ] Tap Start: the discard icon and the waveform-icon-in-the-Send-button each fade in over ~150ms rather than snapping into place; the outgoing Skip/mic icons disappear instantly (no fade-out — see Problem/Target).
- [ ] Tap "Discard and start over" (Cancel): the reverse swap (back to Skip/mic) also fades in, since the `key` changes back the other way.
- [ ] With `prefers-reduced-motion: reduce` emulated in DevTools, both icons swap instantly with no fade — the media query excludes the `animation` declaration entirely, so nothing plays.
- [ ] Tap Start then immediately Cancel, repeatedly and quickly: each swap still fades in correctly (a fresh mount-triggered `animation` every time), with no icon getting stuck mid-fade or disappearing early — this is a genuine remount each time, not a shared retargeting state, so rapid toggling can't leave it in a broken halfway frame.

**Feel**
- [ ] Record the Start tap and scrub frame by frame: the icon fade and the waveform row's own entrance (once `plans/005` is also applied) should read as part of the same coordinated moment, not two unrelated things that happen to overlap.
- [ ] Look at it again with fresh eyes before calling it done — 150ms `ease` is a reasonable default for a same-spot fade, but if it reads as too quick or too slow next to the waveform's own 220ms entrance once both are in place, that's a tuning call, not a reason to abandon the approach.

## Notes

- **"Can't talk right now"'s removal is a genuine open decision, not solved here** (see Out of scope). Reserving its space during Recording would cost real transcript room; leaving it a hard cut keeps that room but keeps the one remaining unanimated piece of this transition. Worth a follow-up plan only after seeing how the icon fades (this plan) plus the waveform's now-earlier reservation (`plans/005`) feel together — it may turn out the combined effect already reads as coordinated enough that this one hard cut doesn't stand out.
- **Text-label crossfading** (Start/Send, Skip/Discard) is the more complete version of this fix but needs the `ButtonVoice` prop-type change noted above — flagged as a natural next step, not assumed to be wanted.
- Whether 150ms is the right length next to the waveform's 220ms is a feel judgment best made once both plans are applied together, not from code alone.
