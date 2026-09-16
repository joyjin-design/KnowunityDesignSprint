# Animation improvement plans

Source: `/review-animations` + `/improve-animations` audit of the voice recall loop's motion, 2026-09-16 (commit `f7251d2`). Full audit covered all animated surfaces in the repo (`LoopScreen.module.css`, `ExamPlanScreen.module.css`, `Button.module.css`); these four plans are the ones selected to act on this round. Two additional findings from that audit were **not** turned into plans yet:

- **MEDIUM** — `Button.module.css`'s `:active` press feedback has no `transition` anywhere in the codebase (zero `transition:` declarations exist at all) — high-leverage since it's the shared `Button` component.
- **LOW** — the Processing waveform's `--waveform-bar-delay` stagger cycles through only 8 values, producing a ripple that repeats every 8 bars rather than reading as organic.

Two "missed opportunities" (additive, not corrective) also came out of the audit and are worth a future round: bottom sheets (`VerdictScreen`, `WhyScreen`, `MicOffScreen`, `GateScreen`) have zero enter/exit animation, and "Still listening…" pops in/out with no transition.

## Plans

| # | Title | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Fix the visible snap when Recording hands off to Processing](001-waveform-pulse-restart-glitch.md) | HIGH | Done (2026-09-16) |
| 002 | [Replace weak built-in easing keywords with real cubic-béziers](002-weak-built-in-easings.md) | MEDIUM | Done (2026-09-16) |
| 003 | [Match the mascot bob and waveform pulse periods](003-processing-motion-cohesion.md) | MEDIUM | Done (2026-09-16) |
| 004 | [Waveform bars enter from the right when there's sound, pause during real silence](004-continuous-right-entry-waveform-reveal.md) | MEDIUM (user-directed) | Done (2026-09-16) |

## Recommended execution order

**001 → 002 → 003 → 004**, but the only hard dependency is **002 before 003** (both edit the same two lines of `LoopScreen.module.css`; 002 changes the easing keyword, 003 changes the duration on top of it — see 003's Notes for what happens if the order is reversed, it still works, just wasn't the order they were written against).

001 and 004 are independent of 002/003 and of each other:
- 001 only rewrites `waveform-pulse`'s keyframe values (no easing/duration change).
- 004 only rewrites `waveform-bar-in` (the entrance) and its adjacent `LoopScreen.tsx` reveal logic — it doesn't touch `waveform-pulse` at all. Note: 004 folds in the easing fix that plan 002 would otherwise have made for `waveform-bar-in`'s `ease-out` keyword, since 004 rewrites that keyframe anyway. **Do not apply 002's `waveform-bar-in` fix separately — 002 was written to explicitly exclude that site for this reason.**

All four can be executed in parallel worktrees if preferred, since no two (other than 002/003) touch the same lines.

## After execution

Each plan's own "Notes" section flags anything a plan couldn't settle from code alone (a feel judgment, an interpretation of an ambiguous instruction, or documentation that will go stale). Read those before considering a plan done — passing the plan's own verification checklist doesn't necessarily mean the open question in its Notes has been resolved.

`sprint-context.md`, `component-gaps.md`, and `SPEC.md` should get a dated decision entry once these land, per this repo's existing convention (see any of those files' own history) — plan 004 in particular changes documented behavior (the waveform reveal mechanism), not just polish.
