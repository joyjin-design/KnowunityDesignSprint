# Scorecard 03 — voice recall prototype (follow-up to scorecard-02)

**Method note (same convention scorecard-02 originally used before it became the full panel):** a lighter, direct single-pass review, not the four-critic panel — run this way to stay light on usage for a small, targeted follow-up. Scope: the fixes made in response to `eval/scorecard-02.md`'s findings, plus their effect on that scorecard's total. Everything else (all six dimensions' other findings, both critics' blind spots, `critic-ambition`'s read) is carried forward unchanged from `scorecard-02.md` — not re-graded, since nothing in it changed.

## What changed this pass

1. **`MicOffScreen`'s scrim removed — the Accessibility hard-gate finding's primary case, fixed and verified.** `Screen.tsx`'s `.bottomSheetBackground` is a full-screen overlay painted *after* `middleContent`, so it was darkening the transcript placeholder and AI disclaimer text a second time, not just the page behind it — measured at ≈1.9:1 and ≈2.8:1, both failing the 4.5:1 floor. `MicOffScreen.tsx` no longer passes `showBottomSheetBackground`, matching the verdict sheet's existing no-dim exception. **Verified two ways:** recomputed from `build/css/tokens.css` (text-tertiary 4.62:1, text-secondary 8.36:1), then confirmed by pixel-sampling the freshly re-rendered `eval/screenshots/MicOffScreen/screens-micoffscreen--default.png` directly — sampled (121,122,134) and (168,168,180) against predicted (121.9,122.5,134.5) and (169.1,168.7,180.7), matching to within 1 RGB unit. `SPEC.md` and `MicOffScreen.stories.tsx` updated to match (`DimmedBehindTheSheet` → `NoDimBehindTheSheet`, now asserting the scrim's absence). Full detail and the tokens/math: `sprint-context.md`'s 2026-09-17 entry.
2. **Two disclosed-but-untracked System fidelity gaps logged to `component-gaps.md`** (both were already inline-commented in source; the gap was the missing audit-trail entry, not undisclosed intent): the hand-drawn `SkipIcon` SVG (3 verbatim occurrences — `ResultBtm.tsx`, `MicOffScreen.tsx`, `LoopScreen.tsx`) and `ButtonVoice.tsx`'s `opacity: 0.4` inline literal.
3. **Not touched, deliberately:** `GateScreen`'s permission-sheet scrim has the identical root cause (its dimmed caption measured ≈2.82:1 in scorecard-02) — out of scope for this pass (only `MicOffScreen` was asked for) and flagged instead, in `SPEC.md` screen 6's own entry, rather than silently carried or silently fixed. **This means the Accessibility hard gate is narrowed, not cleared** — see below.
4. `ExamPlanScreen`'s 788px-vs-844px frame height (scorecard-02's Coherence finding) — **not a bug**, per your direction: Storybook's viewport is a browser window, and only the 390px width is a real constraint here, not the 844px height. Left as-is, no longer counted against Coherence.

**Verified:** `npx tsc --noEmit` (clean), `npm run lint` (same 2 pre-existing warnings, 0 errors), `npm run check:tokens` (same pre-existing `Keyboard.module.css` exception only, no new raw hex), `npx vitest run --project=storybook` (154/155 — the 1 failure is the pre-existing, already-documented `Processing`/`barsBeforeSend` timing flake, confirmed unrelated by an immediate clean rerun; `MicOffScreen.stories.tsx` itself: 3/3).

---

## Updated hard gates

| Gate | scorecard-02 | Now |
|---|---|---|
| **Contrast ≥ 4.5:1 for body text** | **Fails** — MicOffScreen ≈1.9:1/≈2.8:1, GateScreen ≈2.82:1 | **Still fails, narrower.** MicOffScreen now passes (4.62:1 / 8.36:1 — the former a real but thin margin, the same one this exact token pairing already carries elsewhere in the system). GateScreen's `permissionSheetOpen` state still fails at ≈2.82:1, same root cause, not addressed this pass. **The work is still not done per this gate** — one screen fixed, one open. |
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
| **Accessibility** | **4** | **~5** | One of two live contrast-gate failures fixed and verified; the other (GateScreen) is still open, plus the already-disclosed thumbs-up/down gap. Better than a clean fail, but the gate itself still isn't clear — not moved further than that without a fresh blind pass. |
| Ambition (informational) | 7 | 7 (unchanged, not re-graded) | |

**Total: ~7.2 / 10 (108 / 15)** — up from 7.1, but **still not "done" by the rubric's own framing**: a hard gate remains open (GateScreen's permission-sheet contrast), just narrower than before this pass (one screen, not two).

This is a directional estimate from a single direct pass, not a re-run of the blind four-critic panel — treat the dimension scores other than Accessibility as carried forward, not re-verified, and the Accessibility bump as a reasoned estimate rather than a fresh independent grade. Recommend a full panel re-run once `GateScreen`'s contrast gap is also resolved (or explicitly decided to stay as documented, transient-sheet behavior) — that's the point at which a real re-grade, not an estimate, is warranted.
