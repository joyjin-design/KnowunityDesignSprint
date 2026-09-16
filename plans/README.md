# Animation improvement plans

Source: `/review-animations` + `/improve-animations` audit of the voice recall loop's motion, 2026-09-16 (commit `f7251d2`). Full audit covered all animated surfaces in the repo (`LoopScreen.module.css`, `ExamPlanScreen.module.css`, `Button.module.css`); these four plans are the ones selected to act on this round. Four additional findings came out of the same audit and were presented as a numbered list (not written as `plans/00N` files) rather than executed immediately:

- **#5, MEDIUM** — `Button.module.css`'s `:active` press feedback has no `transition` anywhere in the codebase (zero `transition:` declarations exist at all) — high-leverage since it's the shared `Button` component. **Explicitly left out of scope (2026-09-16, your call).** Not planned, not touched.
- **#6, LOW** — the Processing waveform's `--waveform-bar-delay` stagger cycles through only 8 values, producing a ripple that repeats every 8 bars rather than reading as organic. **Explicitly left out of scope (2026-09-16, your call).** Not planned, not touched.
- **#7, missed opportunity** — bottom sheets (`VerdictScreen`, `WhyScreen`, `MicOffScreen`, `GateScreen`) have zero enter/exit animation. **Explicitly left out of scope (2026-09-16, your call).** Not planned, not touched.
- **#8, missed opportunity** — "Still listening…" popped in/out with no transition. **Done (2026-09-16), option A** ("a short opacity fade only, no transform") — implemented directly rather than as a numbered plan file, since it was a single small, fully-specified change: `LoopScreen.tsx`'s cue now stays mounted for all of Recording and toggles a `data-visible` attribute; `LoopScreen.module.css` added a 150ms `ease` opacity transition (plus a `visibility` toggle, delayed on exit, to keep the invisible copy out of the accessibility tree — not part of the visual motion). See `sprint-context.md`'s 2026-09-16 entry for the full writeup.

A follow-up `/improve-animations for the recording phase` pass (2026-09-16, commit `0b0ada8`), scoped to just Recording's own surfaces after the rounds above, surfaced two more findings (#9, #10) and both were selected — written as `plans/005` and `plans/006` below.

## Plans

| # | Title | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Fix the visible snap when Recording hands off to Processing](001-waveform-pulse-restart-glitch.md) | HIGH | Done (2026-09-16) |
| 002 | [Replace weak built-in easing keywords with real cubic-béziers](002-weak-built-in-easings.md) | MEDIUM | Done (2026-09-16) |
| 003 | [Match the mascot bob and waveform pulse periods](003-processing-motion-cohesion.md) | MEDIUM | Done (2026-09-16) |
| 004 | [Waveform bars enter from the right when there's sound, pause during real silence](004-continuous-right-entry-waveform-reveal.md) | MEDIUM (user-directed) | Done (2026-09-16) |
| 005 | [Reserve the waveform row's space for all of Recording, not just once a bar appears](005-reserve-waveform-space-during-recording.md) | MEDIUM | Done (2026-09-16) |
| 006 | [Fade in the button-row icons that swap when Recording starts](006-recording-button-row-icon-crossfade.md) | MEDIUM | Done (2026-09-16) |

## Recommended execution order

**001 → 002 → 003 → 004**, but the only hard dependency is **002 before 003** (both edit the same two lines of `LoopScreen.module.css`; 002 changes the easing keyword, 003 changes the duration on top of it — see 003's Notes for what happens if the order is reversed, it still works, just wasn't the order they were written against).

001 and 004 are independent of 002/003 and of each other:
- 001 only rewrites `waveform-pulse`'s keyframe values (no easing/duration change).
- 004 only rewrites `waveform-bar-in` (the entrance) and its adjacent `LoopScreen.tsx` reveal logic — it doesn't touch `waveform-pulse` at all. Note: 004 folds in the easing fix that plan 002 would otherwise have made for `waveform-bar-in`'s `ease-out` keyword, since 004 rewrites that keyframe anyway. **Do not apply 002's `waveform-bar-in` fix separately — 002 was written to explicitly exclude that site for this reason.**

All four can be executed in parallel worktrees if preferred, since no two (other than 002/003) touch the same lines.

**005 and 006 should be executed together, in either order, before their own feel-checks are trusted** — 005's own Notes section explains why: 005 moves the waveform's ~42px layout reservation to land at the same instant as 006's button-row icon fades (previously two separate unanimated moments, now one). Evaluating either plan's "Feel" checklist against a screen where the other hasn't landed yet will misjudge how the combined Idle→Recording transition actually reads. Both are independent of 001-004 (different lines, different concern — mount timing and icon-swap motion, not the pulse/easing/reveal-cadence fixes those four made).

## After execution

Each plan's own "Notes" section flags anything a plan couldn't settle from code alone (a feel judgment, an interpretation of an ambiguous instruction, or documentation that will go stale). Read those before considering a plan done — passing the plan's own verification checklist doesn't necessarily mean the open question in its Notes has been resolved.

`sprint-context.md`, `component-gaps.md`, and `SPEC.md` should get a dated decision entry once these land, per this repo's existing convention (see any of those files' own history) — plan 004 in particular changes documented behavior (the waveform reveal mechanism), not just polish. Plans 005/006 don't change any documented SPEC.md behavior (same states, same triggers), just how the existing transition feels — a decision-log entry is still worth it for the "why," per this repo's convention, but no SPEC.md table changes are expected.
