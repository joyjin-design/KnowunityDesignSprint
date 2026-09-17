# Scorecard 02 — voice recall prototype (delta review)

Graded against `eval/rubric.md`. **Method note (different from scorecard-01):** this is a single-pass review done directly, not the four-critic panel — run this way to stay light on usage. Scope is the delta since `eval/scorecard-01.md`'s commit: the four things shipped this session —

1. WhyScreen's bold-on-Pass behavior locked in as intentional, docs corrected to match (`app/screens/WhyScreen.tsx`, `SPEC.md`, `WhyScreen.stories.tsx`).
2. AccidentalTap's Send button now visibly dims for the ~1s guard window instead of a silent dead click (`LoopScreen.tsx`'s `sendGuarded`, `LoopScreen.module.css:.sendGuard`).
3. A new real feature: `LoopScreen`'s Idle-only mic-unavailable `Snackbar` (Figma 13719:8829/9060), routing "Go to Setting" back to Gate's after-denial state.
4. `Snackbar`'s icon size/centering bug fix (missing `size="100%"`, missing `.icon` centering CSS) — found and fixed this session while double-checking an icon swap.

Everything outside this delta (the other 7 screens, all dimensions' findings not touched by the above) is **carried forward unchanged from scorecard-01** — it was not re-graded, since nothing in it changed. Verification for this pass: `npm run check:tokens`, the full `vitest`/Storybook interaction suite, source reading against `SPEC.md`/`sprint-context.md`/`design-system.md`, and hand-computed contrast/tap-target math against `build/css/tokens.css` — no live-browser/Playwright rendering pass this time, so nothing here moves any dimension's *cap* (the caps below are inherited from scorecard-01 for the same reason it cited: no rendered/measured verification of the changed screens' pixels this round either).

## Total: 7.1 / 10 (unchanged from scorecard-01)

| Dimension | Importance | Weight | Score | Weighted | vs. scorecard-01 |
|---|---|---|---|---|---|
| System fidelity | High | 3 | 7 | 21 | unchanged |
| Coherence | High | 3 | 7 | 21 | unchanged |
| Craft | High | 3 | 7 | 21 | unchanged (cap) |
| UX judgment | High | 3 | 8 | 24 | unchanged |
| Accessibility | Medium | 2 | 6 | 12 | unchanged (see corrected finding below) |
| Structure | Low | 1 | 8 | 8 | unchanged |
| **Total** | | **15** | | **107 → 107/15 = 7.1** | no change |

---

## Hard gates — one finding, corrected after pushback

**Correction:** the first version of this scorecard flagged the Snackbar action's 32px height as a *new, undisclosed defect our own `Chip` integration introduced* — implying the fix was ours to make. That was wrong, and the user caught it by pointing at the real placed Snackbar instance in Figma, not just the isolated docs frame. Checked directly (`figma_execute` against node `13548:6324`, the `01Exam` mockup frame, Desktop Bridge connection): the real, already-shipped `snackbar` instance there (`variant=Default`, main component `9003:8996`) nests a `chips` instance named `chips/S/Info/True` at **85×32px** — the exact same S-size, 32px-tall chip `Snackbar.tsx:83-85` reproduces. This sizing is baked into Figma's own master component, already in real use elsewhere in the file. It is not a consequence of choosing `Chip` to represent the action, and not something this session's integration work could have built differently without deviating from the real design.

| Gate | Status | Evidence |
|---|---|---|
| Touch targets ≥ 44pt | **Now passes — fixed 2026-09-17** | Was: 32px tall (`--size-control-s`), inherited from Figma's real master `snackbar` component (`9003:8996`, confirmed live on `01Exam`), same category as `ResultBtm`'s 24px thumbs — a gap in the source design, not this codebase. Now: an invisible `::before` hit area extends the real `<button>` to 48px (`--size-space-1200`) without changing its visible 32px size, confirmed by a Playwright click test against the live story. See Fix note below and `sprint-context.md`'s 2026-09-17 entries for the full detail. |
| Everything else | Unchanged from scorecard-01 | `check:tokens` still clean for the 8 graded screens (same pre-existing, quarantined `Keyboard.module.css` exception; the files touched this session added zero new raw hex), and no new identical-state pairs were introduced (`IdleMicSnackbar` and `MicUnavailable` are visibly and functionally distinct). |

**Fix, applied 2026-09-17:** your call was to add the hit-area wrapper rather than leave it matching Figma. `Snackbar.tsx`/`Snackbar.module.css` now give the action chip's real `<button>` an invisible `::before` extending its hit box to 48px (`--size-space-1200`, the same floor `Button`/`ButtonIcon` already use) via `translate(-50%, -50%)` centering — the visible chip stays Figma's exact 32px. Confirmed with a Playwright click test against the live `components-snackbar--error` story: clicks 6px beyond the visible box (inside the new 48px area) register, a click 20px beyond doesn't. Gate now **passes** for this control — see `sprint-context.md`'s 2026-09-17 entry for the full detail.

---

## What's new and verified well

- **AccidentalTap's dim cue is honestly scoped.** The story's own comment (`LoopScreen.stories.tsx:165-170`) states plainly that the visual opacity dim isn't asserted by the test, because it's CSS-only and doesn't block the click — matching this project's own System fidelity 9-anchor pattern (log the gap where it happens) rather than silently claiming full coverage.
- **The guard is implemented the safe way.** `disabled` on `ButtonVoice` stayed scoped to `phase === 'processing'` only; the dim is a separate `style` override, so the button never stops dispatching `click` — avoiding a real bug (native `disabled` blocks clicks entirely) that a flat-`disabled` version of this guard would have hit.
- **The Snackbar feature has real interaction coverage**, not just a static story: `IdleMicSnackbar`'s `play()` (`LoopScreen.stories.tsx:109-124`) clicks the chip and asserts `onGoToSettings` fires, and separately clicks Start and asserts the Snackbar disappears — the Idle-only scope claim is actually exercised, not just asserted in prose.
- **The icon bug fix was thorough, not spot-only.** The user flagged one variant (Error, after a Figma edit); the fix correctly generalized to all three variants (`Snackbar.tsx:38-46`) once measurement (`getBoundingClientRect()`) showed the same missing `size` prop affected Default/Success too — this is the kind of measured-not-eyeballed check the rubric's Craft/Structure 9-anchors ask for, though it doesn't raise those dimensions' *scores* since this pass didn't re-render the other 7 screens to check for similar misses elsewhere.
- **Full test suite: 236/237 passing.** The one failure (`LoopScreen.stories.tsx > Processing`, a `barsBeforeSend` off-by-one) is the same intermittent timing race `sprint-context.md` already documents from a prior session (a fixed 1200ms wait racing the 200ms reveal interval) — unrelated to anything touched this session.
- **Scope discipline held.** `SPEC.md`'s "In-loop snackbars" exclusion was narrowed with an explicit carve-out (line 189) rather than silently overridden, and the Idle-only boundary is stated in both `SPEC.md` (line 154) and the story's own doc comment.

---

## Unchanged from scorecard-01 (not re-graded this pass)

- System fidelity 7, Coherence 7, Craft 7 (both open findings — the two bare-`ease` transitions in `LoopScreen.module.css:141,285`, and the unexercised `BottomSheet` scroll-cap — are still open, untouched this session), Structure 8, UX judgment 8 (text-fallback dead-end finding still stands, unrelated to this session's work).
- Accessibility's two previously-disclosed gaps (thumbs up/down no toggle state, exam-tab badge with no VoiceOver label) and the borderline 4.62:1 `text/tertiary` contrast — all still open, untouched. (A third, Snackbar's action-chip touch target, was found during this delta review and fixed the same session — see Hard gates above, no longer open.)
- `critic-ambition`'s informational 7/10 read and its three proposed reaches — untouched, not re-run.

---

## Confidence caveat

This pass didn't drive a live browser or re-render any screenshots for the carried-forward scorecard-01 findings — same cap the original panel already applied to every dimension for that reason, so nothing here claims 8+ on new grounds for those. The Snackbar touch-target finding is the one exception: both the original 32px measurement and the fix were confirmed directly — the sizing against the real placed Figma instance (Desktop Bridge, node `13548:6324`), and the hit-area fix against a live Storybook click test (Playwright) — not assumed from a token alone, after the first version of this file got the finding's attribution wrong.
