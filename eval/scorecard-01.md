# Scorecard 01 — voice recall prototype

Graded against `eval/rubric.md`. Scope: all built screens except `LogScreen` (excluded per instruction) — `ExamPlanScreen`, `GateScreen`, `MicOffScreen`, `TypingPlaceholderScreen`, `VerdictScreen`, `WhyScreen`, `SummaryScreen`, `LoopScreen`.

**Method:** every state of every in-scope screen (37 stories total, including every documented failure/recovery path) was rendered at 390×844, dark mode, via a headless Playwright script against the running Storybook, and pixel-diffed pairwise within each screen. Four critic subagents then graded independently and blind — each given only the screen list, `eval/rubric.md`, its own two dimensions (or, for `critic-ambition`, its own non-adversarial ambition axis), and the rendered screenshots — with no visibility into each other's scores or this reconciliation. `critic-craft`, `critic-ux`, and `critic-ambition` each required one relaunch after their first attempt stalled on a live-Storybook-tool hang; the relaunches steered them toward the static screenshots and source instead, which is reflected in their blind spots below.

Dimension weights use the rubric's own stated importance (High / Medium / Low), converted to numeric weights 3 / 2 / 1 for the total. `critic-ambition`'s score is informational only and is **not** included anywhere in this weighting.

**Revision note (2026-09-16, post-reconciliation):** after the critics reported, three of their findings turned out to be already-decided, out-of-scope items rather than open gaps — see "Findings resolved as out of scope" below for the detail on each. `sprint-context.md` and `design-system.md` were updated the same session to make that scope explicit (they weren't before, for two of the three). The scores below reflect that — this is a manual reconciliation of the original critic reports against newly-confirmed scope, **not a re-grade by the critics themselves**. Original scores (System fidelity 7, Coherence 6, Accessibility 5, total 6.8) are kept in git history via this file's prior version.

## Total: 7.1 / 10

| Dimension | Importance | Weight | Score | Weighted |
|---|---|---|---|---|
| System fidelity | High | 3 | 7 | 21 |
| Coherence | High | 3 | 7 | 21 |
| Craft | High | 3 | 7 | 21 |
| UX judgment | High | 3 | 8 | 24 |
| Accessibility | Medium | 2 | 6 | 12 |
| Structure | Low | 1 | 8 | 8 |
| **Total** | | **15** | | **107 → 107/15 = 7.1** |

All three adversarial critics capped their scores at ≤8: none independently drove a live browser to measure computed styles or watch motion play out in real time (all graded from the pre-rendered screenshots plus source/doc reading), which the rubric caps at 7 for that reason alone — the two dimensions above 7 (UX judgment 8, Structure 8) reflect critics who judged the remaining gap to the anchor above 7 as smaller than a full point, not a claim of live verification.

---

## Hard gates

| Gate | Status | Evidence |
|---|---|---|
| Contrast ≥ 4.5:1 for body text | **Pass (thin margin)** | `critic-ux` hand-computed real alpha compositing: `TranscriptDisplay`'s `text/tertiary` on `background/page` (Empty/Silence copy on LoopScreen Idle and MicOffScreen) ≈ **4.62:1** — clears the gate by only 0.12, undisclosed anywhere as a close call. `text/disabled` on `background/surface` ≈ 3.69:1 is the rubric's own cited, explicitly-exempt inactive-control case, not a gate failure. |
| Touch targets ≥ 44pt | **Pass (documented exception)** | `critic-ux` found `app/components/ResultBtm.module.css:138-149` (`.thumbButton`, the Verdict sheet's thumbs up/down) at `width`/`height: var(--size-icon-300)` = **24px**, well under the floor. **Resolved as out of scope, not a defect:** `sprint-context.md:142` already logged "Thumbs up/down on the verdict sheet is out of scope this sprint... isn't designed further or wired to anything" before this eval ran; a new 2026-09-16 entry now makes explicit that this covers the control's size, not just its missing toggle state, closing the ambiguity that let the critic read it as undisclosed. |
| No raw hex in component source (`check:tokens` clean on `app/`, `stories/`) | **Pass for the 8 graded screens; pre-existing, quarantined exception elsewhere** | `critic-system` ran it directly: exit code 1, on `app/components/Keyboard.module.css:23-27` (raw hex custom properties) and a hex string inside a doc comment in `app/components/BottomSheetAppBar.stories.tsx:21`. Neither file is imported by any in-scope screen; `design-system.md:91-93` already documented `Keyboard`'s palette as Apple's own, deliberately quarantined, and never to be promoted into `tokens.json`, *before* this eval ran — this was already a disclosed, intentional exception, not a silent gap. |
| No two states that should differ render identically | **Pass** | One byte-identical pair found by the pixel-diff pass (LoopScreen `mic-unavailable` == `accidental-tap`, 0.000% diff) — traced to source and confirmed intentional: both are designed to silently stay on Idle ("Still idle: Start didn't turn into Send" / "drops silently back to Idle"). `critic-craft` independently re-confirmed this from source. No other pair, and no component-level state pair, came back suspiciously identical. |

---

## Per-dimension findings

### System fidelity — 7/10 (`critic-system`)

Anchor: originally scored between the 6- and 9-anchors on two findings that have both since been resolved (below). `critic-system` capped its own score at 7 regardless of findings, per the rubric's own rule that a dimension can't score 8+ without live-browser measurement — that cap is unchanged, so the score stays 7 even with zero open findings against the graded screens.

**Findings resolved as out of scope or fixed (2026-09-16, after this eval ran):**

1. ~~SummaryScreen's "Score" stat chip is hardcoded to the pass/success color regardless of actual outcome.~~ **Resolved as out of scope.** `app/screens/SummaryScreen.module.css:97-99,141-143` does bind `.chip[data-tone='score']` to `--color-feedback-success-bold` statically, confirmed in `eval/screenshots/SummaryScreen/screens-summaryscreen--none-pass.png` (a 0/4 result still shows solid green). But this is the same "fabricated stat" treatment already accepted for the XP chip beside it (both are static decorative numbers this sprint, not real session data — `sprint-context.md`'s 2026-09-15 Summary-rebuild entry already calls this pattern out for XP). Now explicitly logged as intentional at `sprint-context.md` (new 2026-09-16 entry): the Score chip stays outcome-independent, on purpose, matching XP.

2. ~~`ButtonVoice`'s documented Loading state is never invoked where `design-system.md` says it exists.~~ **Fixed as a documentation correction, no behavior change.** The actual shipped behavior (Processing freezes `state="Recording"`, disabled, rather than switching to Loading's spinner) was already correct and already decided on 2026-09-15/16 — only the *documentation* was stale in two places: `design-system.md:35` has been corrected to state plainly that Loading only fires for the pre-Recording mic-recheck, and Processing never uses it; and the original 2026-09-14 `sprint-context.md:272` entry ("buttonVoice hidden on Thinking and Loading/AnimateHowie08") now carries an inline note marking it superseded by the later un-hide decision, instead of sitting uncontradicted.

3. **Hard gate: `check:tokens`** — see Hard gates table above; resolved as a pre-existing, already-documented, out-of-scope exception (`Keyboard.module.css`), not attributable to the graded screens.

With all three resolved, there are no remaining open System fidelity findings against the 8 graded screens — the score holds at 7 only because of the rubric's live-verification cap, not because of any known gap.

### Coherence — 7/10 (`critic-system`, revised)

Originally scored 6 (the 6-anchor: "a set of well-made screens rather than one system... a handful of one-off exceptions without a logged reason"), citing the two System fidelity findings above as the uncontained divergences. With both resolved — the chip's color is now an explicitly logged, deliberate exception, and the ButtonVoice documentation contradiction is fixed — the remaining rationale for holding this at 6 no longer applies. Revised to 7, matching System fidelity's own cap (no live-browser rhythm/timing verification was done, so this isn't raised to 8-9 despite the resolved findings).

### Craft — 7/10 (`critic-craft`, one finding resolved)

Anchor: close to the 6-anchor ("closer inspection finds untuned edges") but with better-than-6-anchor a11y-label specificity, originally offset by two concrete untuned/contradictory edges (one below now resolved). Capped at 7 regardless (no live measurement against real Figma frames this pass, which the rubric requires literally for 8+), so the score is unchanged by the resolution.

Verified strong: real `:active` Pressed states and a real spinner replacing the label on Loading (`app/components/Button.tsx:13,53,88`); control-specific aria-labels, not boilerplate (`app/screens/LoopScreen.tsx:436`, `app/screens/MicOffScreen.tsx:120`); waveform-glide and mascot-thinking-bob motion both gated behind `prefers-reduced-motion` with documented non-default reasoning (`app/screens/LoopScreen.module.css:48,138,215-231,249,283` — e.g. `linear` chosen over `ease-out-expo` specifically because the glide is continuous, not one-shot).

1. ~~WhyScreen bolds a concept as "missing" on a Pass verdict, contradicting its own documented contract.~~ **Resolved as intentional, docs corrected to match (2026-09-16).** `app/screens/WhyScreen.tsx:29-32` said "Success has nothing missing, so nothing's bold," but `app/_prototype/PrototypeFlow.tsx:371` computes `missing` as every unhit concept regardless of verdict, so a real Pass (2-of-3 concepts, per `SPEC.md`'s judge rules) still bolds the unhit one — confirmed visually in `eval/screenshots/WhyScreen/screens-whyscreen--after-pass.png`. This critic flagged it as an unresolved contradiction between code and doc, with either "strip the bold" or "fix the doc" as valid fixes. Your call: the behavior was right, the doc was stale — a Pass only guarantees 2 of 3, so bolding the miss is a deliberate chance to double-check, not an error signal. Fixed in `WhyScreen.tsx:29-32`, `SPEC.md` screen 7's "States" line and its walkthrough step 4, and `WhyScreen.stories.tsx`'s `AfterPass` comment — no behavior change, no code touched.

2. **Two motion transitions default to unconsidered CSS `ease` next to rigorously-reasoned motion in the same file.** `app/screens/LoopScreen.module.css:141` (`.stillListening` fade) and `:285` (`.iconSwap` crossfade) both use the bare `ease` keyword with no justifying comment, a few lines from `waveformGroup`'s transition (`:217-231`) and `waveform-pulse`/`thinking-bob` (`:50,251`), which both carry multi-line reasoning for a specific non-default curve. Matches the rubric's Craft 6-anchor example verbatim.
   **Fix:** document why `ease` fits these two fades, or replace with one of the file's own already-justified curves for consistency.

3. **Structure evidence gap (not a defect):** no screenshot exercises `BottomSheet`'s `max-height`/`overflow-y:auto` scroll-cap (`app/components/BottomSheet.module.css` `.sheet[data-height]`/`.middleSection`) — `WhyScreen` never passes a `height` prop (defaults to `'S'`/40dvh) and no story's explanation text is long enough to approach the cap.
   **Fix (verification, not code):** add a `WhyScreen` story with Q8's long explanation (already flagged loose/long in `SPEC.md` Open #13) to actually exercise the scroll-and-clip path.

### Structure — 8/10 (`critic-craft`)

Anchor: near the 9-anchor — all 8 in-scope screens' documented states render cleanly at 390×844 with no overflow/clipping/stray boxes, and edge-case content was stress-tested directly (VerdictScreen's long-answer/silence-long-answer stories correctly hit the Overflow fade; SummaryScreen's longer copy reflows cleanly; GateScreen's recheck notice doesn't disturb layout). Held short of 9 solely because the one edge case the 9-anchor names by name — "a sheet tall enough to hit its height cap" — is never exercised by any screenshot (see Craft finding 3 above, same root cause).

### UX judgment — 8/10 (`critic-ux`)

Anchor: the 9-anchor met on every checkable point (idle one-tap way-out correctly shown/hidden by phase; Cancel restores Idle in one tap; Processing is genuinely alive — phase-matched mascot/waveform pulse + cycling copy, `app/screens/LoopScreen.tsx:31-35`, `LoopScreen.module.css:44-62,243-264`; verdict is legibly three-way via distinct color/icon/copy, not binary-plus-label, `app/components/ResultBtm.tsx:77-99,142-147`; transcript always shown; no tutor/chat branch found anywhere in `app/`, `lib`; mic-off's "Type instead" is a real Primary button, not demoted, `app/screens/MicOffScreen.tsx:139-141`; Gate always keeps "Can't talk right now" reachable even after denial, `app/screens/GateScreen.tsx:80-92`) — held to 8, not 9, for one real caveat:

1. **The text fallback is a functional dead end.** `app/screens/TypingPlaceholderScreen.tsx:36` tells the student "Typing isn't part of this prototype," and its only action, "Back to voice," routes to the exam plan, not back into the question. This is a declared, in-scope-boundary limitation (CLAUDE.md: "the typing turn is out of scope this sprint") and never traps the student (there's always a one-tap way out) — but it means Voice-ux principle 5's "text is always reachable" is reachable in name only, not in function.
   **Fix:** none required this sprint per the declared scope boundary — flagging so it isn't mistaken for a full pass on principle 5 once the typing turn is in scope.

### Accessibility — 6/10 (`critic-ux`, revised)

Originally scored 5, capped below the 8+ band (despite genuinely-verified contrast work — hand-computed alpha compositing against real `build/css/tokens.css` values, not just an axe pass) because of what was read as a concrete, undisclosed hard-gate failure:

1. ~~Undersized, undisclosed touch target — hard-gate failure.~~ **Resolved: disclosed, out of scope, not a defect.** `app/components/ResultBtm.module.css:138-149` (`.thumbButton`, the Verdict sheet's thumbs up/down) is indeed `width`/`height: var(--size-icon-300)` = 24px, no min-width/min-height. But `sprint-context.md:142` already logged the whole control as out of scope this sprint before this eval ran ("isn't designed further or wired to anything"); the critic's grep for "thumb" found that line but read it as covering only the missing toggle-state gap (finding 2 below), not sizing. A new 2026-09-16 entry closes that ambiguity explicitly. Revising the score up rather than leaving finding 1 in place as a phantom gate failure.

With that resolved, the score moves from 5 to 6 — matching the rubric's 6-anchor almost exactly on the two remaining findings, which are real, disclosed, and still unfixed:

2. **Two already-disclosed gaps, confirmed still real and unfixed** (matches rubric's own 6-anchor examples, so they cap the dimension at 6 rather than drag it lower): thumbs up/down have no toggled/active state (`ResultBtm.module.css:138-159`, logged `sprint-context.md:39`); the exam-tab "new" badge carries meaning by color+position alone, `aria-hidden="true"`, no VoiceOver label (`app/screens/ExamPlanScreen.tsx:99-106`, logged `sprint-context.md:143,502-508`).

3. **Borderline, undisclosed contrast on load-bearing status copy.** `app/components/TranscriptDisplay.module.css:20-22`: `text/tertiary` (`rgba(245,243,255,0.4784)`) on `background/page` (`#090c18`) — the Empty/Silence status copy ("I'm listening…" / "Sorry, I didn't catch that…") — hand-computed with real alpha compositing to **≈4.62:1**. Clears the 4.5:1 gate but by only 0.12, and nowhere disclosed as a close call.
   **Fix:** either accept and log the margin explicitly, or move to a token with more headroom given this copy's load-bearing role (Voice-ux principle 1).

4. **`text/disabled` on `background/surface` ≈ 3.69:1** (`app/components/ButtonIcon.module.css:79-84,98-99`, the Discard icon during Processing) — this is the rubric's own cited, explicitly-exempt inactive-control example, confirmed present, not a new problem.

What passed cleanly: every `Button`/`ButtonIcon`/`ButtonVoice` instance across these 8 screens resolves to a fixed ≥48px tap target via the shared base class (checked as literal px, not content-dependent); ExamPlanScreen's image tap zones are all real `<button>`s ≥44×44 with aria-labels, not bare hotspots; verdict states pair color with distinct icon shape, not color alone; all three verdict sheet titles compute well above 4.5:1 (≈5.6–6.7:1); no `:hover`-dependent state exists anywhere (grep clean), consistent with the no-hover mobile constraint.

---

## critic-ambition's read (informational — excluded from the total above)

**Ambition score: 7/10** — "at least one moment clearly reaches past the safe option and lands it within the existing system," but the reach doesn't hold at the verdict itself, the sprint's central moment, so it falls short of the 9–10 band.

Real reaches already present: the Processing phase's phrase-rotating bubble + `thinking` mascot + paused waveform (`LoopScreen.tsx:340-360,393-399`); the animated hint-arrow and pulsing badge overlays (`ExamPlanScreen.tsx:49-106`); WhyScreen's bold-highlighting of missing concepts (mechanism aside — see Craft finding 1 above for the bug in *which* concepts get bolded); SummaryScreen's outcome-dependent mascot at the extremes.

**Where the work is settling:**
1. `VerdictScreen.tsx:115` and `WhyScreen.tsx:105` hard-code `expression="standby"` regardless of `outcome` — confirmed visually, Pass/Partial/Fail all render the identical mascot art, even though the same file tree already proves outcome-driven expression works (`LoopScreen.tsx:397`, `SummaryScreen.tsx:38-44`).
2. `SummaryScreen.tsx:36-45`'s expression axis only distinguishes two cases (perfect vs. everything else) though the copy distinguishes three narrative arcs — confirmed visually, a 1-of-4 finish renders the identical happy mascot as a 4-of-4 finish.
3. `GateScreen.tsx:70-72`'s "still off after rechecking" recovery notice is a hand-drawn paragraph in `text/error`, easy to skim past, where `Snackbar` already exists in Storybook for exactly this and has never had a real first instance built.

**Stronger patterns proposed** (each built only from existing components/variants, staying inside every hard rule):
1. SummaryScreen's partial-pass band → `MascotSlot`'s existing `standby` expression instead of reusing `approving`, making the axis three-tier to match the copy.
2. VerdictScreen's Pass state → `MascotSlot`'s existing `excited` expression (`components-mascotslot--excited`), Partial/Fail staying `standby` — keeps Fail non-punitive per Voice-ux, doesn't touch `ResultBtm`'s actual verdict language/color.
3. GateScreen's recheck notice → the real `Snackbar` component (`variant="Error"`, with its required `action` prop wired to the screen's existing `onIveTurnedOnMic` callback) in place of the hand-drawn `<p>`.

---

## Blind spots, by critic

- **critic-system:** Graded from screenshots (390×844, mostly single static frames) + source/doc reading, not a live interactive Storybook session driven in real time — anything visible only in motion (waveform group-glide easing, icon crossfade timing, mascot thinking-bob loop, hint-arrow draw-on) was read from CSS/timing values and reasoned about, not watched frame-by-frame. A rhythm mismatch only visible mid-animation could be invisible to this pass.
- **critic-craft:** Did not drive a live Storybook this session (avoided `stories-preview`/`test-run` after a prior hang) — never measured actual computed spacing/gaps against Figma frames, never watched any animation actually play. Also could not personally verify the `WhyScreen` sheet's scroll-cap behavior (Craft finding 3) — inferred from CSS, not from a render that triggers it.
- **critic-ux:** All contrast/touch-target numbers are hand-computed from literal hex/rgba and fixed CSS px values, not measured from a live browser's computed styles with real subpixel rendering. The 24×24px thumbs-button margin is large enough this doesn't matter; the 4.62:1 borderline contrast case could in principle land a few hundredths either side of 4.5:1 in a real browser. Also did not personally drive the Storybook `play()` interactions (Start → Send → Cancel, the `visibilitychange` interruption, waiting out the silence timer) — read the assertions and cross-checked against static screenshots rather than executing them.
- **critic-ambition:** Graded from static per-state screenshots, never watched the loop run end-to-end in real time. Two things could look different in practice: motion-dependent reaches (waveform glide, hint-arrow draw, badge ping) may land better or worse live than a single frame suggests; and a beat that reads fine in isolation (mascot resetting to `standby` after every verdict) could feel flatter repeated across a full 8-question run than any single screenshot shows.

---

## Rendering audit (this session, not a critic)

37 states rendered at 390×844, dark mode, Playwright against live Storybook, covering every documented state including failure paths (Silence ×3 variants, MicUnavailable, AccidentalTap, InterruptedMidRecording, GateScreen's two denial states, MicOffScreen). Pixel-diffed every same-screen pair.

**One byte-identical pair found:** LoopScreen `mic-unavailable` vs `accidental-tap` (0.000% diff). Traced to source and confirmed intentional, not broken: both scenarios are designed to silently return to Idle ("Still idle: Start didn't turn into Send" / "drops silently back to Idle, nothing logged"). Independently re-confirmed by `critic-craft`. No other pair, in any screen, came back suspiciously close or identical.

Two LoopScreen states (`Recording`, `StillListeningCue`) could not be captured from their own named Storybook story, because both stories' `play()` functions end by clicking "Discard and start over" — which reverts the screen to Idle before a plain post-load screenshot could ever catch the intended state. Both were instead captured by manually driving the `Idle` story's shell (clicking Start, then stopping at the target moment) — flagged here since it's a methodology note, not a product defect.
