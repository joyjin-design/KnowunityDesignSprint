# 005 — Reserve the waveform row's space for all of Recording, not just once a bar appears

- **Commit:** 0b0ada8
- **Severity:** MEDIUM
- **Category:** Physicality & origin
- **Estimated scope:** 2 files, ~10 lines

## Problem

`VoiceWaveform` only mounts once `waveformBars > 0` — the moment the recognizer transcribes the first word of a take. At that instant, `.bottomStack` (a `flex-direction: column` stack) gains a brand-new 30px-tall child plus its 12px `gap`, so the button row beneath it — and the transcript area above it, which shares the same `flex: 1 1 auto` budget — shifts by roughly 42px with no transition at all. This happens once per take that ever hears speech, i.e. up to 8 times a session. Per the course's physicality rule, an element shouldn't just appear and shove its neighbors — either it animates in on its own layer (transform/opacity), or its space is reserved up front so nothing else has to move when it shows up. Here it's neither: the *container* itself pops into existence and the reflow it causes is instant.

## Where

| File | Lines | What's there |
| --- | --- | --- |
| `app/screens/LoopScreen.tsx` | 391–397 | The conditional mount gating `VoiceWaveform` on `waveformBars > 0` |
| `app/screens/LoopScreen.stories.tsx` | 122–123 | A test asserting the waveform container is *absent* from the DOM before any bars appear — this assertion's premise changes under this fix |

### Current code

```tsx
/* app/screens/LoopScreen.tsx:391 */
          {waveformBars > 0 && (
            <VoiceWaveform
              heights={WAVEFORM_BAR_HEIGHTS.slice(WAVEFORM_BAR_HEIGHTS.length - waveformBars)}
              animate={phase === 'processing'}
            />
          )}
```

```tsx
/* app/screens/LoopScreen.stories.tsx:122 */
    // Nothing recognized yet: no waveform bars (Figma's 06Talking).
    await expect(canvasElement.querySelector('[data-bar-count]')).not.toBeInTheDocument();
```

## Target

Mount the container for the whole of Recording and Processing (i.e. whenever `phase !== 'idle'`), not just once bars exist. With `waveformBars === 0`, `WAVEFORM_BAR_HEIGHTS.slice(38 - 0)` (`.slice(38)`) already evaluates to `[]`, so `VoiceWaveform` renders correctly as an empty row — no change needed inside `VoiceWaveform` itself. `.waveform`'s own CSS already declares a fixed `height: 30px` regardless of content (`app/screens/LoopScreen.module.css:189-203`, unchanged by this plan), so an empty row still reserves its full footprint.

```tsx
/* app/screens/LoopScreen.tsx:391 */
          {phase !== 'idle' && (
            <VoiceWaveform
              heights={WAVEFORM_BAR_HEIGHTS.slice(WAVEFORM_BAR_HEIGHTS.length - waveformBars)}
              animate={phase === 'processing'}
            />
          )}
```

```tsx
/* app/screens/LoopScreen.stories.tsx:122 */
    // Nothing recognized yet: the row is reserved but empty (Figma's
    // 06Talking never shows a waveform pre-recording, but this container
    // exists throughout Recording/Processing now — plans/005 — to reserve
    // its own space and avoid a layout jump when the first bar appears).
    await expect(canvasElement.querySelector('[data-bar-count]')).toHaveAttribute('data-bar-count', '0');
```

**Why this approach:** no new CSS, no new animation — the fix is purely about *when* the already-fixed-height container mounts. This mirrors the exact pattern already used for `.stillListening` in the same file (`app/screens/LoopScreen.module.css:119-150`, `app/screens/LoopScreen.tsx:383-387`): a cue that used to hard-pop via conditional rendering now stays mounted for all of Recording and toggles its own visibility instead of its DOM presence. Here the container doesn't even need a visibility toggle — it's `aria-hidden="true"` decoration with a fixed height regardless of child count, so simply mounting it earlier is sufficient.

## Conventions to follow

- `app/screens/LoopScreen.tsx`'s `.stillListening` cue (rendered at `phase === 'recording'` now, not gated on the value it's showing) is the exemplar for "mount for the whole phase, don't gate on the transient value" — same principle applied here one level up (gate on `phase`, not on `waveformBars`).
- Don't touch `VoiceWaveform`'s own implementation (`app/screens/LoopScreen.tsx:453-474`) — it already handles an empty `heights` array correctly (renders zero `<span>` children, `data-bar-count="0"`).
- Don't touch `.waveform`'s CSS (`app/screens/LoopScreen.module.css:189-203`) — its fixed `height: 30px` is exactly what makes this fix work; no new rule is needed.

## Steps

1. In `app/screens/LoopScreen.tsx`, change the waveform's mount condition from `{waveformBars > 0 && (...)}` to `{phase !== 'idle' && (...)}` (around line 391).
2. In `app/screens/LoopScreen.stories.tsx`, update the `Recording` story's "Nothing recognized yet" assertion (around line 123) from `.not.toBeInTheDocument()` to `.toHaveAttribute('data-bar-count', '0')`, per the Target section above. Leave the rest of that story (the `waitFor` blocks checking bars appear) unchanged — they already query the same element and will still pass.
3. Re-check the `Processing` story (`app/screens/LoopScreen.stories.tsx:165-207`): it queries `[data-bar-count]` after Recording has already run for 1.2s (line 169's `setTimeout`), by which point real bars exist regardless of this change — no edit needed there, but confirm it still passes after step 1.

## Out of scope

- The Idle→Recording transition itself (Can't talk right now disappearing, the button icons/labels swapping) — that's `plans/006`. Note: because this plan makes the waveform container mount at the *start* of Recording instead of mid-recording, its ~42px reservation now happens at the same instant as `plans/006`'s button-row changes, consolidating what used to be two separate unanimated shifts into one. That's a side effect of this fix, not something to design around; see Notes.
- `.waveform`'s CSS, `VoiceWaveform`'s own rendering logic, and the bar-reveal timer (`WAVEFORM_REVEAL_INTERVAL_MS`, `hasHeardSpeechRef`) — all unchanged.
- Do not add any new animation, transition, or `visibility` toggle to the waveform container itself — this plan is purely about the mount condition.

## Verification

**Build**
- [ ] Type-check and lint pass.
- [ ] `npx vitest run --project=storybook`: the `Recording`, `Processing`, `MicUnavailable`, and `AccidentalTap` stories in `LoopScreen.stories.tsx` all still pass after the assertion update in Step 2.

**Behavior**
- [ ] Start a Recording take (real or scripted): the waveform row's space (30px + the 12px `--size-space-300` gap above the button row) is present immediately when Recording begins, before any word is recognized — an empty reserved strip, not absent space.
- [ ] Once the first word arrives, the first bar appears inside that already-reserved space — no shift in the button row or transcript area's height at that moment.
- [ ] Cancel mid-recording: the row (and its reserved space) disappears along with everything else, back to Idle's layout.
- [ ] Send: the row's space and bar count carry into Processing unchanged (already covered by the existing `Processing` story).

**Feel**
- [ ] Watch the Idle→Recording transition and the first-word moment separately (e.g. pause a beat between tapping Start and speaking). Confirm the layout no longer visibly "jumps" when the first bar shows up — the remaining jump (if any) is now entirely part of the Idle→Recording moment itself (`plans/006`'s territory), not a second, later surprise.
- [ ] Look at it again with fresh eyes before calling it done.

## Notes

Making the waveform container mount at Recording's start (not mid-recording) means its 30px+gap reservation now lands at the *same instant* as `plans/006`'s button-row changes (icon swaps, "Can't talk right now" disappearing) — previously these were two separate, independently-timed layout shifts; after this plan they're one. This plan doesn't attempt to animate that consolidated shift itself (it only removes the *second*, later one) — whether the combined Idle→Recording moment needs its own coordinated transition is exactly what `plans/006` addresses. Execute `plans/006` in the same pass as this plan, or immediately after, so the two don't get evaluated on separate feel-checks against a half-fixed screen.
