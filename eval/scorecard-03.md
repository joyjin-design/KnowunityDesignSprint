# Scorecard 03 — voice recall prototype (follow-up to scorecard-02)

**Method note (same convention scorecard-02 originally used before it became the full panel):** a lighter, direct single-pass review, not the four-critic panel — run this way to stay light on usage for a small, targeted follow-up. Scope: the fixes made in response to `eval/scorecard-02.md`'s findings, plus their effect on that scorecard's total. Everything else (all six dimensions' other findings, both critics' blind spots, `critic-ambition`'s read) is carried forward unchanged from `scorecard-02.md` — not re-graded, since nothing in it changed.

## What changed this pass

1. **`MicOffScreen`'s scrim removed — the Accessibility hard-gate finding's primary case, fixed and verified.** `Screen.tsx`'s `.bottomSheetBackground` is a full-screen overlay painted *after* `middleContent`, so it was darkening the transcript placeholder and AI disclaimer text a second time, not just the page behind it — measured at ≈1.9:1 and ≈2.8:1, both failing the 4.5:1 floor. `MicOffScreen.tsx` no longer passes `showBottomSheetBackground`, matching the verdict sheet's existing no-dim exception. **Verified two ways:** recomputed from `build/css/tokens.css` (text-tertiary 4.62:1, text-secondary 8.36:1), then confirmed by pixel-sampling the freshly re-rendered `eval/screenshots/MicOffScreen/screens-micoffscreen--default.png` directly — sampled (121,122,134) and (168,168,180) against predicted (121.9,122.5,134.5) and (169.1,168.7,180.7), matching to within 1 RGB unit. `SPEC.md` and `MicOffScreen.stories.tsx` updated to match (`DimmedBehindTheSheet` → `NoDimBehindTheSheet`, now asserting the scrim's absence). Full detail and the tokens/math: `sprint-context.md`'s 2026-09-17 entry.
2. **Two disclosed-but-untracked System fidelity gaps logged to `component-gaps.md`** (both were already inline-commented in source; the gap was the missing audit-trail entry, not undisclosed intent): the hand-drawn `SkipIcon` SVG (3 verbatim occurrences — `ResultBtm.tsx`, `MicOffScreen.tsx`, `LoopScreen.tsx`) and `ButtonVoice.tsx`'s `opacity: 0.4` inline literal.
3. **`GateScreen`'s matching ~2.82:1 dimmed-caption contrast, resolved as intentional, not a defect — your pushback.** Same root cause as MicOffScreen's (the scrim paints over the text, not just the space behind it), but a different case: MicOffScreen's transcript/disclaimer is content the student still needs mid-task even with the sheet up, which is why its scrim came off; GateScreen's headline/body is read *before* the permission sheet opens, and once it's up, the sheet is what the student is meant to act on, not the backdrop — the same "background recedes, modal has focus" pattern iOS itself uses. Contrast on text that's deliberately not meant to be read in that moment isn't the same gap as contrast on text that is. `SPEC.md` screen 6's entry corrected to state this as decided, no code change. **This means the Accessibility hard gate is now fully cleared**, not just narrowed — see below.
4. `ExamPlanScreen`'s 788px-vs-844px frame height (scorecard-02's Coherence finding) — **not a bug**, per your direction: Storybook's viewport is a browser window, and only the 390px width is a real constraint here, not the 844px height. Left as-is, no longer counted against Coherence.

**Verified:** `npx tsc --noEmit` (clean), `npm run lint` (same 2 pre-existing warnings, 0 errors), `npm run check:tokens` (same pre-existing `Keyboard.module.css` exception only, no new raw hex), `npx vitest run --project=storybook` (154/155 — the 1 failure is the pre-existing, already-documented `Processing`/`barsBeforeSend` timing flake, confirmed unrelated by an immediate clean rerun; `MicOffScreen.stories.tsx` itself: 3/3).

---

## Updated hard gates

| Gate | scorecard-02 | Now |
|---|---|---|
| **Contrast ≥ 4.5:1 for body text** | **Fails** — MicOffScreen ≈1.9:1/≈2.8:1, GateScreen ≈2.82:1 | **Passes.** MicOffScreen now measures 4.62:1 / 8.36:1 (the former a real but thin margin, the same one this exact token pairing already carries elsewhere in the system) — a genuine fix, not a reclassification. GateScreen's ≈2.82:1 dimmed caption is resolved as out of this gate's scope, not fixed: that text is deliberately not meant to be read once the permission sheet has focus (background-recedes-behind-modal is standard, not a defect), so it isn't the same case as MicOffScreen's still-needs-to-be-read transcript. |
| Touch targets ≥ 44pt | Pass (documented exception) | Unchanged. |
| No raw hex in component source | Pass for the 8 graded screens | Unchanged. |
| No two states that should differ render identically | Pass, with the same carried-forward disclosed exception | Unchanged. Spot-checked: `MicOffScreen`'s `Default` and `No dim behind the sheet` stories are no longer distinguished by the scrim (both now show it absent), but they were already pixel-identical to each other *with* the scrim too (scorecard-02's `critic-ux` finding) — this isn't a new collision, and the two stories still serve different purposes (`NoDimBehindTheSheet` explicitly regression-tests the scrim's absence). Confirmed not actually pixel-identical post-fix (differ by post-interaction focus state from `Default`'s own `play()` clicks). |

---

## Updated score

| Dimension | scorecard-02 | Now | Why |
|---|---|---|---|
| System fidelity | 8 | 8 (unchanged, not re-graded) | Both findings that held this at 8 (the `SkipIcon` and `ButtonVoice` opacity gaps) are now logged — worth a re-grade at the next full panel, not claimed unilaterally here without a fresh blind critic. |
| Coherence | 7 | 7 (unchanged, not re-graded) | The one finding was the `ExamPlanScreen` height gap, which your direction reclassifies as a non-issue (browser-window rendering, width is the only real constraint) — but that reclassification wasn't run back through `critic-system` blind, so left as-is rather than self-graded up. |
| Craft | 8 | 8 (unchanged, not re-graded) | |
| Structure | 8 | 8 (unchanged, not re-graded) | |
| UX judgment | 7 | 7 (unchanged, not re-graded) | |
| **Accessibility** | **4** | **~6** | Both live contrast-gate cases resolved — MicOffScreen fixed, GateScreen deemed out of scope for the gate rather than a defect — so the hard gate itself is clear. The one remaining known gap is the already-disclosed thumbs-up/down control with no toggled state, which happens to be the rubric's own cited example of what a 6 looks like ("passes... but with real, known gaps left unflagged: ... the thumbs up/down feedback control with no toggled/active state"). Landing there rather than higher since this is a reasoned estimate, not a fresh blind pass. |
| Ambition (informational) | 7 | 7 (unchanged, not re-graded) | |

**Total: ~7.3 / 10 (110 / 15)** — up from 7.1. **The hard gate that was open is now clear** — the only defect that made the rubric call scorecard-02 "not done" (a real contrast failure) is fixed; GateScreen's matching number was never actually the same kind of defect once the intent behind it is accounted for.

This is a directional estimate from a single direct pass, not a re-run of the blind four-critic panel — treat the dimension scores other than Accessibility as carried forward, not re-verified, and the Accessibility bump as a reasoned estimate rather than a fresh independent grade. A full panel re-run would be the way to turn this estimate into a real re-grade, but there's no longer an open hard gate forcing that before the work can be called done.
