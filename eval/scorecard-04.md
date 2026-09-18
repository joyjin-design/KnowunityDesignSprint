# Scorecard 04 — voice recall prototype (full critic panel)

Graded against `eval/rubric.md`, including this session's own uncommitted edit adding UX judgment's session-end anchor language and the new "Out of scope, but needs attention" section. Scope: the same 8 in-scope screens as `scorecard-02.md` and `scorecard-03.md` — `ExamPlanScreen`, `GateScreen`, `LoopScreen`, `MicOffScreen`, `SummaryScreen`, `TypingPlaceholderScreen`, `VerdictScreen`, `WhyScreen`. `LogScreen` stays excluded (facilitator-only debug tool, not part of the student-facing product).

**Method:** every story on the 8 in-scope screens (45 stories via `.claude/skills/detect-identical-screens/render-and-diff.mjs`) was rendered fresh this session at exactly 390×844, dark mode, against a live Storybook dev server, then pairwise pixel-hash-diffed. Four critic subagents (`critic-system`, `critic-craft`, `critic-ux`, `critic-ambition`) then graded independently and blind, each in its own isolated context with only `eval/rubric.md` (plus `Voice-ux.md`/`design-system.md`/`CLAUDE.md` as their own instructions require), the screen list, the fresh screenshots, and its own dimensions — no critic saw another critic's output or any prior scorecard. `mcp__storybook__*` tools were reachable against the live server this session (unlike scorecard-02's panel, where the connection was refused), and all four critics used them plus their own live Playwright verification for specific claims.

Dimension weights use the rubric's own stated importance (High / Medium / Low → 3 / 2 / 1). `critic-ambition`'s score is informational only and is **not** included in the weighting.

## Total: 6.7 / 10 (101 / 15) — but see hard gates below: this does not mean the work is done

| Dimension | Importance | Weight | Score | Weighted | Critic |
|---|---|---|---|---|---|
| System fidelity | High | 3 | 7 | 21 | `critic-system` |
| Coherence | High | 3 | 7 | 21 | `critic-system` |
| Craft | High | 3 | 7 | 21 | `critic-craft` |
| UX judgment | High | 3 | 6 | 18 | `critic-ux` |
| Accessibility | Medium | 2 | 6 | 12 | `critic-ux`, adjusted — see note below |
| Structure | Low | 1 | 8 | 8 | `critic-craft` |
| **Total** | | **15** | | **101 → 101/15 = 6.7** | |

`critic-ambition` (informational, excluded from the total): **6/10** — top of the "clean, correct, unremarkable" band, see its own section below.

**Note on the Accessibility score:** `critic-ux` scored this dimension 5/10, reading the `WhyScreen` "Got it" touch-target gap (below) as an undisclosed regression. I checked `sprint-context.md:436` directly after grading closed and found the gap **is** disclosed, in detail, at build time — matched against the real Figma master (`4871:29852`, size=S, a fixed 32px pill) and explicitly flagged as a known tension with the shared `Button` component's 48px floor ("flagged rather than touched"). That's the same "known, disclosed, not-yet-fixed gap" bucket the rubric's own 6-anchor names by example (`text/disabled` contrast, the thumbs control's missing toggle state) — not the 4-anchor's "obviously undersized... unflagged" case. I've raised the score to 6 to reflect that correction. This does **not** change the hard-gate call below: a hard gate is pass/fail on the actual rendered size, and disclosure doesn't clear it — only fixing it does.

---

## Hard gates

| Gate | Status | Evidence |
|---|---|---|
| **Contrast ≥ 4.5:1 for body text** | **Passes** | `critic-ux`, computed by hand against `build/css/tokens.css` with real alpha compositing: `text-tertiary` (the token that previously failed on `MicOffScreen`) now clears at **4.624:1** — the same thin-margin number `sprint-context.md`'s 2026-09-17 fix predicted, not a comfortable pass but a real one. `text-secondary` clears comfortably (7.2–8.4:1 across the surfaces checked). Flagged for a live devtools/axe re-check given the margin's thinness, but no computed failure this pass. |
| **Touch targets ≥ 44pt** | **FAILS — new finding, not in any prior scorecard** | `critic-ux`: `app/screens/WhyScreen.module.css:186-188` — `button.gotIt { min-height: var(--size-space-800); }` (32px) overrides `Button`'s shared 48px floor (`Button.module.css:9`) via a same-specificity-beating element selector. Confirmed against `eval/screenshots/Screens-WhyScreen/screens-whyscreen--after-pass.png`: "Got it" visibly shorter than every other button in the system. Per `sprint-context.md:185`, **Got it is the sheet's only way out, always available, not dismissible by drag or scrim** — unlike `ResultBtm`'s thumbs (an unwired, decorative, explicitly-out-of-scope-this-sprint control, still the one carried-forward documented exception below), this is a required, unavoidable action sitting below the floor. Disclosed at build time (`sprint-context.md:436`, matched to the real Figma master and flagged as an open tension) but never resolved — a hard gate fails on the measurement, not the disclosure. **Fix:** give "Got it" the same invisible-hit-area technique `Snackbar.module.css:57-69`'s `.actionHitArea::before` already uses for its own 32px chip, extending the tap target to 48px without changing the visible 32px pill Figma specifies. |
| **No raw hex in component source** | Pass for the 8 graded screens | `critic-system`: `npm run check:tokens` passes clean on all 8 in-scope screens; the only repo-level hit remains the already-quarantined `Keyboard.module.css`, confirmed unused by any in-scope screen. |
| **No two states that should differ render identically** | Pass, with one carried-forward disclosed exception | The fresh render pass found one collision: `LoopScreen`'s `Mic Unavailable` / `Accidental Tap` stories, the same pair `scorecard-01.md` and `scorecard-02.md` already confirmed intentional (both silently drop back to Idle). Logged as a standing exception in the new `eval/screenshot-exceptions.json` so future runs stop re-flagging it. See Render-and-compare pass below for a separate, real screenshot-pipeline issue this is **not** the same thing as. |

---

## Render-and-compare pass (before the critics ran)

- Rendered all 45 stories across the 8 in-scope screens fresh, 390×844, dark mode, via `.claude/skills/detect-identical-screens/render-and-diff.mjs` against a live Storybook. Full report: `eval/screenshots/identical-screens-report.json`.
- One pixel-identical pair found (`LoopScreen`'s `mic-unavailable`/`accidental-tap`) — pre-adjudicated, now recorded in `eval/screenshot-exceptions.json`.
- `LoopScreen`'s `Processing` story never stabilized within the script's 8-second cap — it's a continuous waveform animation, so its capture is a snapshot of whatever frame it landed on, not "the" state. All three critics were told this and verified Processing live instead of trusting that PNG (`critic-craft` confirmed via a live `getComputedStyle` check that Processing's disabled Send button genuinely differs from Recording's enabled one — a real distinct state, not a screenshot artifact).
- **A real, recurring pipeline issue, independently caught by three of the four critics without seeing each other's work:** several `LoopScreen` stories' own `play()` functions run interactions *past* the state their name promises before the render script's "settled" check ever fires, so the delivered PNG depicts the post-interaction end state, not the named one.
  - `screens-loopscreen--recording.png` — `critic-system` and `critic-craft` both independently traced this to `LoopScreen.stories.tsx`'s `Recording` story, whose `play()` ends by clicking "Discard and start over" — the PNG shows the post-discard **Idle** screen, not Recording. Both confirmed (via `test-run` assertions and a live re-render) that the component itself renders Recording correctly; this is a capture artifact, not a product defect.
  - `screens-loopscreen--idle-mic-snackbar.png` — `critic-ux` found the same story's `play()` ends by clicking Start, so the PNG shows mid-**Recording**, not the Snackbar-over-Idle state its name implies.
  - `screens-loopscreen--still-listening-cue.png` — `critic-ux` flagged this as the same class of issue, consistent with `scorecard-02`'s own unresolved note that this exact cue resisted capture after many attempts.
  - **This is a story/render-script mismatch, not something I fixed in this pass** — per the `detect-identical-screens` skill's own guidance, the fix is a different story/args combination that reaches the named state without a further self-advancing interaction, not a longer wait. Flagging for a future pass rather than editing story `play()` functions unilaterally under a "run eval" request.

---

## System fidelity — 7/10 (`critic-system`)

Verified via `check:tokens`, source greps for raw hex/px and undefined `var()` names, and live `mcp__storybook` docs queries (not inferred from file listings) confirming component identity (`ButtonVoice`, `MascotSlot`).

**Findings:**
1. **`component-gaps.md`'s own promotion rule was violated by the very next screen it named.** The hand-drawn `SkipIcon` SVG is duplicated in `ResultBtm.tsx:104-112`, `MicOffScreen.tsx:38-50`, and `LoopScreen.tsx:569-581`. `component-gaps.md:18` already states this is "past the 'second occurrence' promotion trigger... the next screen that needs it should promote it to a real shared component instead of a fourth copy" — `LoopScreen` added the fourth copy instead. Fix: extract one `SkipIcon` component, or log why promotion is still deliberately deferred.
2. **The XP chip pattern ("⚡2") is hand-rolled independently in four places** (`VerdictScreen.tsx:143-151`, `MicOffScreen.tsx:52-61`, `WhyScreen.tsx:163-172`, `LoopScreen.tsx:583-593`), each logged in `component-gaps.md:6` as a fresh occurrence — but unlike the adjacent speech-bubble gap (which cites a specific `SPEC.md` carve-out at every occurrence), no such exemption is ever cited for the chip. Fix: extract a shared `XpChip`, or add the missing carve-out citation.
3. **`SummaryScreen.tsx:42`'s `expression: 'determined'`** for the "None Pass" case uses an expression `MascotSlot`'s own Storybook docs call "unproven... don't assume validated for a specific screen just because the file exists," explained only in a `.stories.tsx` code comment, not in `sprint-context.md`/`component-gaps.md` at the rigor this project otherwise holds itself to.

Capped at 7 (not the 6-anchor's "looks clean, audit finds undisclosed gaps," nor the 9-anchor's "every gap logged where it happens") because the logging discipline is real and unusually good in most places, but these three specific gaps are un-promoted or under-logged against the project's own stated rules.

## Coherence — 7/10 (`critic-system`)

**Positives, confirmed rather than assumed:** the mascot-expression-to-emotional-beat mapping holds without exception across every in-scope screen; the situation-wording/action-wording split ("Can't talk right now" vs. "Try typing instead" vs. "Type instead") is held exactly as `sprint-context.md` prescribes, not reinvented; the verdict icon/color/title logic reads identically everywhere it appears.

**Finding:** the System fidelity gaps above are also a coherence risk, not just a fidelity one — because `SkipIcon` and the XP chip exist as independent copies rather than one shared component, today's visual match across screens is coincidental (copy-paste), not structural. A future edit to one copy has no mechanism to propagate to the other three, which is the literal risk the rubric's 9-anchor names ("a component means the same thing wherever it's placed").

Capped at 7 (not 9) because computed spacing/radius/motion-timing across screens wasn't measured live in a browser this pass — only reasoned from source and screenshots, per the rubric's own inference cap.

---

## Craft — 7/10 (`critic-craft`)

Verified live: a genuine spinner-based `Loading` state, real `:active` Pressed (measured `getComputedStyle` before/after a real `mousedown`), deliberately-reasoned and `prefers-reduced-motion`-gated timing, and `mcp__storybook__test-run` green across 28+ stories.

**Findings:**
1. **`LoopScreen.module.css:172`'s `.bottomStack` gap** carries its own comment admitting it: "No Figma spacing check against 05Starting/06Talking this session (no live Figma access) — space.300 (12px) borrows the gate's own hand-adjusted button gap... as the closest precedent, flagged for a real measurement pass." This is the rubric's 6-anchor case ("a gap that's close-but-not-exact to Figma") in its most literal, self-disclosed form — not even confirmed close, an admitted borrow from an unrelated screen.
2. **The waveform's group-glide constants are hardcoded numeric literals**, not runtime token reads. `LoopScreen.tsx:74-83`'s `WAVEFORM_BAR_WIDTH_PX`/`WAVEFORM_BAR_GAP_PX`/`WAVEFORM_VIEWPORT_WIDTH_PX` match `space.150`/`space.100`/`space.400`/`space.300` today only because a comment says so — `check:tokens` only greps for raw hex, never px, so this duplication is invisible to the one tool this project trusts to catch drift. If the underlying tokens ever change, this file silently goes stale.
3. **Confirmed not a defect:** `LoopScreen`'s Processing Send button is genuinely distinct from Recording's (measured live: `opacity: 0.4` + `disabled: true` fire correctly) — a suspicion from the static, unsettled screenshot that a live check ruled out.

Not 8/9: real, self-disclosed untuned edges exist (finding 1), and one drift risk that no existing tool would catch (finding 2) — clears the "verified by rendering/testing" floor (this wasn't inference), but the rubric's 9-anchor's literal Figma-measurement bar wasn't independently re-verified this pass (no Figma tool reachable this session).

## Structure — 8/10 (`critic-craft`)

Confirmed rendering at exactly 390×844, dark, in a real browser (fresh screenshots plus supplemental live Playwright captures); held together under real content variance (long-transcript Overflow on `VerdictScreen`/`WhyScreen`, empty Silence transcript painting nothing); no stray boxes.

Not 9: the automated capture pipeline needed manual intervention to trust two results (Processing's non-settle, the pre-existing collision), and `BottomSheet`'s own height-cap/internal-scroll behavior wasn't independently stress-tested screen-by-screen this pass — relying on the component-level fix already logged in `sprint-context.md` rather than a fresh test of it.

---

## UX judgment — 6/10 (`critic-ux`)

Matches the rubric's 6-anchor closely, including its new session-end clause. Verified via rendering and `test-run`: idle one-tap escape hatches present and correctly hidden in Recording; cancel-to-idle is one tap; Processing is genuinely alive (mascot, phrase ladder, pulsing waveform — confirmed passing); verdict is legibly 3-way distinct; transcript always shown; `grep` across `app/`, `lib/`, `content/` for tutoring/chat branches returned nothing.

**What holds it at 6, not 9 (the rubric's new session-end clause, hit directly):** `SummaryScreen.tsx` shows only `Score: N/4` on a non-clean run, with no indication of which questions weren't a full Pass and no link back to them — confirmed against `SPEC.md`'s own record that the per-question row list was deliberately dropped from an earlier build. This is exactly the gap the rubric's new anchor names.

**Secondary finding:** `ResultBtm.module.css:12-15, 91-94, 118-121` — `Error` (a real Fail) and `Silence` (an explicitly-not-a-failure recovery state) share the identical error-red icon color, `CloseIcon` glyph, and sheet fill (confirmed visually: `verdictscreen--fail.png` vs. `--silence-nothing-heard.png`). This undercuts `Voice-ux.md` principle 4's "separate misheard from didn't know it" — both currently read as the same "you got it wrong" signal.

**Fix:** on `SummaryScreen`, surface which questions weren't Pass, even as a compact list, so "what do I still need to work on" has an answer. On `ResultBtm`, give Silence a distinct icon or non-error color.

## Accessibility — 6/10 (`critic-ux`, adjusted — see note under Total)

**Verified positives:** every icon-only control carries a real accessible name (`ButtonIcon`'s TypeScript interface makes `aria-label` required, not optional); contrast computed with real alpha compositing against `build/css/tokens.css` clears the floor everywhere checked, including the known-risk `text-tertiary` token at 4.624:1.

**Two real touch-target findings, both below the 44pt floor:**
1. **`WhyScreen.module.css:186-188`'s "Got it" button, 32px** — see Hard gates above. Disclosed at build time and matched deliberately to Figma's real master, but never resolved, and it's the sheet's sole, unavoidable exit.
2. **`ResultBtm.module.css:138-149`'s thumbs, 24px, no `min-height`/`min-width` floor** — the same carried-forward, explicitly out-of-scope-this-sprint exception every prior scorecard has noted (`sprint-context.md:603`, "unwired, undeveloped control by decision, sizing included"). Notable: the codebase already has the correct fix pattern for exactly this shape of problem (`Snackbar.module.css:57-69`'s `.actionHitArea::before`), just never applied here or to Got it.

Landing at 6 (the rubric's own "known, disclosed gaps left unflagged-for-now" band, the same band the thumbs control alone already put this project in) rather than lower, since both findings are disclosed somewhere in the project's own audit trail, even though neither is fixed — and rather than higher, since the Got it finding is a genuinely more consequential instance of that same band (a required control, not a decorative one).

---

## `critic-ambition` — 6/10 (informational only, excluded from the total)

Top of the "clean, correct, unremarkable" band — real craft-as-ambition exists (the waveform's token-computed group-glide, the accidental-tap send-guard, Processing's phrase progression instead of a spinner), but the one asset built specifically for emotional range — `MascotSlot`'s expression axis — is used at its plainest, most repeated setting at exactly the moments (verdict, permission recovery) the brief's own language is asking for a distinct emotional read.

**Where the work is settling:**
1. `VerdictScreen.tsx:115` renders `expression="standby"` identically across all four `outcome` branches — confirmed via screenshots (`pass`/`partial`/`fail`/`silence` all show the same mascot pose). `MascotSlot`'s documented range (confirmed via `docs-show`) goes entirely unused at the one screen whose job is to deliver a pass/partial/fail emotional beat.
2. `GateScreen.tsx:77` hardcodes `expression="approving"` regardless of `state`, so `afterDenial` (recovery, "go fix this in Settings") shows the identical warm mascot as `firstTime`.
3. `WhyScreen.tsx:49-52`'s `GOT_IT_COLOR` is one static coral for Pass, Partial, and Fail alike, even though `ResultBtm.tsx:40-44` one screen upstream already defines a per-verdict `ACTION_COLOR` map for exactly this role.

**Stronger patterns proposed (all built from existing, `docs-show`-confirmed components):**
1. `VerdictScreen`: key `expression` off `outcome` — `Pass → "excited"`, `Partial → "questioning"`, `Fail → "determined"`, `Silence → "standby"` (unchanged). `"questioning"` for Partial directly matches `SPEC.md`'s own stated intent ("a chance to double-check, not an error signal").
2. `GateScreen`'s `afterDenial`: swap to `expression="determined"` — vocabulary this system already uses for "we didn't get there, let's go again" (`SummaryScreen`'s none-pass case), not a new expressive risk.
3. `WhyScreen`'s Got it button: reuse `ResultBtm.ACTION_COLOR`'s per-outcome mapping, keyed by the `outcome` prop `WhyScreen` already receives — makes the sheet read as a continuation of the verdict just tapped from, rather than resetting to a fourth, unrelated accent color.

**Blind spot:** graded as isolated stories, not a full 4-question session played start to finish — a mascot-expression change that reads well in isolation could feel repetitive by the third or fourth time it fires in one real run.

---

## Critic blind spots

- **`critic-system`:** didn't measure computed spacing/radius/motion timing live in a browser — only source, comments, and screenshots, so a rhythm divergence only visible in real computed pixels or animation timing could be invisible to it. Also surfaced, as a methodology note rather than a product finding: `LoopScreen`'s `Recording` story's `play()` ends by clicking Discard, so its own screenshot silently depicts Idle.
- **`critic-craft`:** had no Figma tool reachable this session, so anywhere the codebase claims "measured against the real Figma frame" (the Silence sheet gap fix, the `button` L-height fix), it could confirm the process happened and the numbers are self-consistent, but not independently re-derive them against the actual Figma nodes.
- **`critic-ux`:** had no live-browser measurement tool this session — contrast and touch-target numbers are computed by hand from declared CSS/token values, not read via `getBoundingClientRect()`/`getComputedStyle()` on a real rendered DOM. The margins on both touch-target findings (24px/32px vs. a 44px floor) are wide enough that a small discrepancy wouldn't flip the verdict, but flagging it per its own discipline. Also independently found two more instances of the `play()`-runs-past-the-named-state issue (`idle-mic-snackbar`, `still-listening-cue`) beyond the one `critic-system`/`critic-craft` also caught.
- **`critic-ambition`:** see its own section above.

---

## Confidence caveats

- **No critic had a live Figma or live-DOM measurement tool this session** (`mcp__storybook__*` worked; a general browser/Playwright driver and Figma MCP did not reach the critics directly, though `critic-craft` and `critic-ux` each drove their own throwaway Playwright scripts against the live Storybook server for specific claims worth verifying live). Every score capped at 8 in this scorecard reflects that limitation explicitly, per the rubric's own rule, rather than guessing higher on inference.
- **Three of the four critics, working blind and independently, converged on the same underlying pipeline issue** (stories whose `play()` functions advance past their own named state before capture) — a real, if narrow, weakness in how this project's screenshots should be read going forward, not a coincidence. See Render-and-compare pass above. Not fixed in this pass; flagged for a future decision on whether to restructure the affected stories' `play()` functions or add args-only variants that reach the same states without a self-advancing interaction.
- **The `WhyScreen` touch-target hard-gate failure is new in this scorecard** — not present in `scorecard-01.md`, `scorecard-02.md`, or `scorecard-03.md` (checked directly, no mention in any). It was disclosed at build time in `sprint-context.md:436` but never previously surfaced by an eval pass as the gate-relevant finding it is.
- This scorecard's Accessibility score (6, not `critic-ux`'s original 5) is the one dimension in this pass where I adjudicated directly rather than reporting the critic's number as-is — see the note under Total for the exact reasoning and citation. Every other dimension is reported exactly as its critic scored it.
