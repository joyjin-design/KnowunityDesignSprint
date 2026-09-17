# Scorecard 02 — voice recall prototype (full critic panel)

Graded against `eval/rubric.md`. Scope: all built screens except `LogScreen` (excluded per instruction) — `ExamPlanScreen`, `GateScreen`, `LoopScreen`, `MicOffScreen`, `SummaryScreen`, `TypingPlaceholderScreen`, `VerdictScreen`, `WhyScreen`.

**This replaces the prior version of this file** (a lighter single-pass delta review, kept in git history) with a full four-critic panel run, the same method `scorecard-01.md` used.

**Method:** all 39 stories across the 8 in-scope screens — every documented state, including failure/recovery paths — were rendered fresh this session at exactly 390×844, dark mode, via a headless Playwright script against a live Storybook (`storybook dev -p 6006`), then pixel-hashed and pairwise-diffed within each screen. Four critic subagents (`critic-system`, `critic-craft`, `critic-ux`, `critic-ambition`) then graded independently and blind, each in its own isolated context with only `eval/rubric.md`, the screen list, the rendered screenshots, and its own dimensions — no critic saw another critic's output, this file's prior version, or `scorecard-01.md`. The `mcp__storybook__*` tools were unavailable this session (connection refused), so all four critics fell back to the static screenshots plus source reading, and three of them additionally drove their own throwaway Playwright scripts against the live Storybook server for specific claims worth verifying live (noted per-finding below).

Dimension weights use the rubric's own stated importance (High / Medium / Low → 3 / 2 / 1). `critic-ambition`'s score is informational only and is **not** included in the weighting.

## Total: 7.1 / 10 (106 / 15) — but see hard gates below: this does not mean the work is done

| Dimension | Importance | Weight | Score | Weighted | Critic |
|---|---|---|---|---|---|
| System fidelity | High | 3 | 8 | 24 | `critic-system` |
| Coherence | High | 3 | 7 | 21 | `critic-system` |
| Craft | High | 3 | 8 | 24 | `critic-craft` |
| UX judgment | High | 3 | 7 | 21 | `critic-ux` |
| Accessibility | Medium | 2 | 4 | 8 | `critic-ux` |
| Structure | Low | 1 | 8 | 8 | `critic-craft` |
| **Total** | | **15** | | **106 → 106/15 = 7.1** | |

`critic-ambition` (informational, excluded from the total): **7/10** — see its own section below.

---

## Hard gates

| Gate | Status | Evidence |
|---|---|---|
| **Contrast ≥ 4.5:1 for body text** | **FAILS** | `critic-ux`, verified two ways (pixel-sampled from the rendered screenshots and independently hand-computed from `build/css/tokens.css`, the two methods agreeing within ~1 RGB unit): `MicOffScreen.tsx:85` passes `showBottomSheetBackground` **unconditionally** (its `default` and `dimmed-behind-the-sheet` stories are pixel-identical — the "dimmed" variant never actually differs from default), binding `Screen.module.css:131-135`'s scrim (`--color-background-scrim` = `--color-alpha-dark-50` = `rgba(10,10,10,0.502)`) under the transcript placeholder and AI disclaimer. Measured: `TranscriptDisplay`'s "I'm listening…" placeholder (`text-tertiary`) ≈ **1.88:1**; `AiDisclaimer`'s "Knowie is AI…" (`text-secondary`) ≈ **2.83:1**. Both fail the 4.5:1 floor by more than half. Confirmed as a systemic property of the same scrim, not a one-off: `GateScreen.tsx:57`'s `permissionSheetOpen` state dims its own caption text (`text-secondary`) to ≈ **2.82:1** the same way. `sprint-context.md:89` had already predicted this exact failure mode ("[text/tertiary] would fail the moment that transcript is placed on a sheet") but this specific instance was never logged as having actually happened, so it reads as an unflagged regression against the team's own prediction, not a disclosed, accepted exception like the system's other known contrast gaps. **Fix:** exempt real body text from sitting under the scrim (move the transcript/disclaimer/caption above the scrim layer), or verify a lighter scrim alpha against contrast on every screen that composes `showBottomSheetBackground` over live copy. |
| **Touch targets ≥ 44pt** | Pass (documented exception, unchanged) | `ResultBtm.module.css:138-149`'s thumbs up/down at `--size-icon-300` (24px) remains under the floor, but is an explicitly logged, decided-out-of-scope control (`sprint-context.md:603`: "unwired, undeveloped control by decision") — same status as scorecard-01. The Snackbar action chip's touch-target fix from the prior scorecard-02 (an invisible `::before` extending its hit box to 48px) still holds; not re-broken. |
| **No raw hex in component source** | Pass for the 8 graded screens | `critic-system` confirmed `check:tokens` still fails at the repo level, but only on `app/components/Keyboard.module.css:23-27` — explicitly quarantined, documented as Apple's own stock kit never promoted into `tokens.json` (`design-system.md`), and confirmed unimported by any of the 8 in-scope screens. |
| **No two states that should differ render identically** | Pass, with one carried-forward disclosed exception, plus one screenshot-capture limitation (not a gate failure — see below) | `LoopScreen`'s `mic-unavailable` and `accidental-tap` stories render pixel-identical (confirmed via hash + direct visual read). Same pair scorecard-01 found and traced to intentional design: both are meant to silently drop back to Idle. Re-confirmed independently this pass, not just carried forward on faith. A second identical pair, `still-listening-cue` == `recording`, is **not** a product defect — it's this session's screenshot pipeline failing to catch a transient state; see Confidence caveats. |

---

## Render-and-compare pass (before the critics ran)

- Rendered all 39 stories (8 screens × their documented states, including every failure/recovery path) at 390×844, dark mode, fresh via Playwright.
- Pairwise pixel-hash-diffed every screen's states. Found the `mic-unavailable`/`accidental-tap` identical pair above; confirmed by direct image inspection (not just hash) that both genuinely paint the same pixels — not a render failure.
- **Found and fixed a real pipeline bug, independently also caught by `critic-craft` and `critic-ux`:** the fixed-delay wait in my render script raced two `LoopScreen` stories' own timed `play()` interaction sequences. `screens-loopscreen--processing.png` originally captured mid-Recording (partial transcript, undimmed Send) instead of Processing; `screens-loopscreen--idle-mic-snackbar.png` originally captured after the story's `play()` had already clicked past the Snackbar into Recording. Both are now re-captured correctly: Processing shows the frozen waveform, dimmed/disabled Send, and "Let me think…" bubble; Idle Mic Snackbar shows the Snackbar over Idle before any interaction. `screens-loopscreen--still-listening-cue.png` could **not** be corrected after several targeted attempts (selector-based waits, attribute-presence polling) — see Confidence caveats; it still shows pre-cue Recording, not the cue.
- Independently re-verified `critic-system`'s ExamPlanScreen finding by pixel-sampling the actual PNG: rows 788–843 (56px, exactly the gap between the frame's 788px content height and the 844px canvas) are solid `rgb(227,228,229)` — light gray, not any dark-mode token — across `hint-animate.png`, `flow.png`, and `voicerecall-on.png`. This directly contradicts `critic-craft`'s own retraction of the same suspicion (see Coherence finding below); the measured evidence sides with `critic-system`.

---

## System fidelity — 8/10 (`critic-system`)

Verified by running `check:tokens`, grepping all 8 in-scope screens' source for raw hex/px and undefined `var()` names, and confirming `component-gaps.md`'s tracked entries actually recur where claimed — not inferred from reading alone.

**Findings:**
1. **Untracked recurring gap.** A hand-drawn "skip-forward" SVG (`SkipIcon`) is duplicated verbatim across `app/components/ResultBtm.tsx:104`, `app/screens/MicOffScreen.tsx:38`, `app/screens/LoopScreen.tsx:569`. Each site's comment discloses it inline ("same as the other two, not promoted"), but unlike the bubble/XP-chip pattern, it was never added to `component-gaps.md` — the file CLAUDE.md designates as the audit trail. An auditor trusting that file alone would miss this. Fix: add a `component-gaps.md` entry with its 3 occurrences, or promote it to a shared icon.
2. **Undisclosed magic number.** `app/components/ButtonVoice.tsx:91`: `opacity: 0.4` is a literal number, not a `var()`, despite an adjacent comment saying it's meant to match `--color-alpha-light-40`'s proportion. Fix: source it from a token or CSS custom property instead of a bare literal.
3. `check:tokens` fails project-wide only on the already-quarantined `Keyboard.module.css` (unused by any in-scope screen) — a fact, not a defect in scope.

Capped at 8 (not 9) for the two findings above; the rubric's 9-anchor requires every gap to be logged where it happens, and the `SkipIcon` gap isn't.

## Coherence — 7/10 (`critic-system`)

**Top finding, live-rendered and independently confirmed (see render-and-compare pass above):** `app/_prototype/FrameImage.module.css:8` (`.frame`) renders only 788px tall inside the 844px Storybook canvas — `app/_prototype/frames.ts`'s `FRAME_SIZE` is 390×788, and `.frame`'s `padding-top: env(safe-area-inset-top)` resolves to 0 in a browser with no real safe-area inset, so nothing fills the remaining 56px. Every other in-scope screen is `Screen`-based and verified (`sprint-context.md:75`) to fill the canvas edge-to-edge. This is a real, screen-family-wide rhythm break — `ExamPlanScreen`'s five stories are the only ones in the whole in-scope set that don't hold the same 844px rhythm — and it's not logged anywhere as an accepted Storybook-only divergence. **`critic-craft` initially suspected the same thing and then retracted it after its own pixel sample "showed dark background all the way to the edge" — that retraction is itself wrong**, per this session's direct pixel sample (rows 788–843 measured at solid `rgb(227,228,229)`, not the dark page token). Fix: `min-height: 100dvh` on `.frame` (matching `Keyboard`'s own established pattern), or log the Storybook-only gap explicitly if it's accepted as one.

**Positives, verified rather than assumed:**
- `ResultBtm`'s four verdict variants stay visually and semantically distinct (icon, title, color) everywhere they appear.
- Mascot expression mapping holds a legible, non-reinvented logic across every screen (`standby` on idle/reconstructed-idle screens, `thinking` only in Processing, `approving`/`determined` only on Gate/Summary's own moments) — grepped every call site to confirm.
- `BottomSheetAppBar`'s spacing measured pixel-identical live between `GateScreen`'s and `MicOffScreen`'s sheets (17px sheet-top→title, 0px title→caption both places) — the 2026-09-15 shared-spacing fix genuinely holds across both real placements.
- `SummaryScreen`'s Score chip staying green at 0/4 is an explicitly logged, deliberate exception (`sprint-context.md`, 2026-09-16) matching the already-accepted XP-chip treatment — correctly disclosed per the rubric's own 9-anchor language, though still worth naming as a residual legibility risk for a real student.

---

## Craft — 8/10 (`critic-craft`)

Verified live: `prefers-reduced-motion` genuinely stops the mascot `thinking-bob` and waveform-pulse animations (confirmed via `page.emulateMedia`, not just present-in-CSS); Pressed is a real `:active` state (measured computed `box-shadow` before/after a real `mousedown`); `Button`'s Loading state genuinely swaps the label for a `<Spinner>` plus a visually-hidden label span, not a color tint; `WhyScreen`'s bolded concepts genuinely vary per verdict (confirmed visually across all three outcomes).

**Findings:**
1. **Evidence-reliability finding (not a product defect):** three of the nine delivered `LoopScreen` screenshots didn't depict their claimed state (the same pipeline issue this session's render-and-compare pass found and partly fixed — see above). `critic-craft` independently re-rendered live and confirmed the underlying app is correct on all three; flagging this so it isn't mistaken for a Craft 4-anchor failure ("a state indistinguishable from Default").
2. **Minor, disclosed.** `LoopScreen.module.css:283-313`: the icon crossfade and Send accidental-tap-guard fade use plain CSS `ease` while the waveform's own glide/pulse use bespoke `cubic-bezier(...)`. The adjacent comment defends this choice explicitly ("ease for discrete-state fades, linear for the continuous glide") — logged, not an oversight, but a notch below the file's own bespoke-curve standard elsewhere.
3. **Retraction on the ExamPlanScreen blank-strip suspicion was itself wrong** — see Coherence above. Noted here for completeness since it was `critic-craft`'s own correction that this session's independent pixel sample overturned.

## Structure — 8/10 (`critic-craft`)

Verified: `TranscriptDisplay`'s Overflow state (fixed height, bottom-anchored content, top-masked via `mask-image`) holds together under real long-content variance — confirmed via `eval/screenshots/VerdictScreen/screens-verdictscreen--pass-with-long-answer.png` and `--silence-with-long-answer.png`, both fitting the action row below with no clipping at exactly 390×844. This is a genuinely resolved answer to `SPEC.md`'s open scroll-behavior question, not a silently-unresolved gap, and it's held consistently per `sprint-context.md`'s repeated "no scroll behaviour designed" notes actually being addressed here.

Not a 9: `critic-craft` didn't independently re-render every single screen/state (see its blind spot below), and given it caught 3 stale screenshots in the one screen family it did re-verify hardest, a similar capture-timing miss could exist un-caught elsewhere.

---

## UX judgment — 7/10 (`critic-ux`)

Verified by rendering and one live Storybook reload for the Processing state specifically (the delivered `processing.png` was stale at the time `critic-ux` graded — it re-rendered live itself and confirmed the real behavior independently of this session's later pipeline fix).

**What's genuinely strong (verified):** "Can't talk right now" and Skip render only in Idle, absent in Recording; Cancel returns to Idle in one tap; Processing is calm/alive (bubble swaps to "Let me think…", Send/Discard visibly dimmed+disabled, Close remains the one working way out); Verdict is legibly 4-way distinct (Pass/Partial/Fail/Silence), not binary-plus-label; the transcript is always shown, and `grep -rniE "tutor|chatbot|open-conversation"` across `app/`, `lib/`, `content/` returned nothing — no tutoring branch exists; Gate's permission-denial flow routes to a real recheck-or-Settings path, never a dead end.

**What holds it at 7, not 9:** `app/screens/TypingPlaceholderScreen.tsx:33-38` is the destination for both "Type instead" (`MicOffScreen.tsx:139-141`) and "Try typing instead" (`ResultBtm.tsx:216-218`) — and it isn't a text input, it's a static screen that reads "Typing isn't part of this prototype… Go back to the exam plan," with only a "Back to voice" exit. This is a disclosed, in-scope sprint cut (CLAUDE.md: "The typing turn is out of scope this sprint") and it doesn't literally trap the student — there's always a one-tap exit. But `Voice-ux.md` calls this path "non-negotiable" accessibility for a student who genuinely cannot speak right now; for that student, the one control the product offers routes back into the exact modality they opened it to avoid. The fallback button itself is built well (full-width, one-tap, not glued-on small text) — the gap is that nothing functional sits behind it.

## Accessibility — 4/10 (`critic-ux`)

See the Hard gates section above for the primary, verified finding (MicOffScreen's/GateScreen's scrim crushing body text below 3:1) — this is what pulls the score down from what would otherwise read closer to 6-7, per the rubric's own framing that a hard-gate failure makes a screen "not done" regardless of how the rest scores.

**Second finding, disclosed but still live:** `ResultBtm.tsx:181-188`'s thumbs up/down renders with an `aria-label` but no `aria-pressed` or any toggled visual state, and its 24px target is the same documented out-of-scope exception noted in Hard gates. Honestly logged (matches the rubric's own 6-anchor example almost verbatim), but still a real, shipped gap on every Verdict/Why sheet.

**What keeps this from being lower:** `ButtonIcon.tsx:17` makes `aria-label` a required prop — every icon-only control checked (`LoopScreen` Skip/Discard, `MicOffScreen` Skip, `ResultBtm` Skip, `AppBar` icons) has a real accessible name. `ProgressIndicator.tsx:41-51` ships a correct `role="progressbar"` with real `aria-valuenow/min/max`. Touch targets elsewhere are handled with real rigor, not eyeballed: the Snackbar action chip's 48px hit-area pseudo-element, and `frames.ts`'s exam-plan tap zones explicitly grown to 48pt and confirmed by their actual geometry. The verdict states never rely on color alone — each pairs a distinct icon and copy with its tint.

---

## `critic-ambition` — 7/10 (informational only, excluded from the total)

Anchor: "at least one moment clearly reaches past the safe option and lands it within the existing system" — but not consistently enough for 9-10, because the single highest-stakes moment in the flow (the verdict itself) is also the flattest.

**Where the work is settling:**
1. `app/screens/VerdictScreen.tsx:115` hardcodes `<MascotSlot expression="standby" />` regardless of `outcome` — confirmed visually, Pass/Partial/Fail all show pixel-identical mascot art. `design-system.md:21` anticipated exactly this kind of expression swap at this size, and `LoopScreen.tsx` already proves the swap mechanism works (idle→processing); `VerdictScreen` just never calls it.
2. `app/screens/SummaryScreen.tsx:44`'s "some passed" branch reuses the identical `expression: 'approving'` as the "all passed" branch — a 1-of-4 run and a 4-of-4 run read emotionally identical on the one element built to carry emotion.
3. `WhyScreen.tsx:129-131` explicitly suppresses the mascot (a logged, disclosed 2026-09-15 decision, not a silent gap) — worth naming since it means the one screen built to soften a wrong-answer moment is the one screen where the companion disappears.

**Three stronger patterns, each buildable from existing, confirmed component states:**
1. `VerdictScreen.tsx:115`, Pass: `expression={outcome === 'Pass' ? 'excited' : 'standby'}` — `excited` is a confirmed real `MascotSlot` expression. `ResultBtm`'s icon+title+color stay the primary, non-color-alone carriers of verdict meaning, so this is additive, not load-bearing.
2. `SummaryScreen.tsx:44`, "some passed": `expression: 'excited'` instead of reusing `approving` — leaves `approving` for the clean 0-mistake run and `determined` for zero-pass, so a 1-of-4 run reads as "good effort, keep going" rather than the same celebration a 4-of-4 gets.
3. `GateScreen.tsx:77`, `afterDenial`: `expression={deniedBefore ? 'standby' : 'approving'}` — lets the mascot's tone settle from inviting-anticipation to neutral-patient exactly when the screen's own copy has already shifted to corrective Settings instructions.

**Blind spot:** graded each screen as an isolated Storybook state, not walked end-to-end in one continuous session — a per-screen mascot change that reads well in isolation (e.g. Verdict flashing `excited` on Pass) could feel repetitive if it fires identically across four questions in a real run.

---

## Critic blind spots

- **`critic-system`:** did not independently re-run the `LoopScreen` stories' `play()` functions with an early-exit screenshot of its own — trusted the story's own in-test assertions for the Recording-only state rather than a frame captured at that exact mid-test moment. A real behavioral regression visible only as a one-frame flash (e.g. during the icon crossfade) would be invisible to this review.
- **`critic-craft`:** could not independently re-render every screen/state — did live verification for `LoopScreen`'s hardest timed/motion states, `VerdictScreen`'s overflow case, and `Button`'s pressed/loading/reduced-motion mechanics, but graded `GateScreen`, `SummaryScreen`, `WhyScreen`, `MicOffScreen`, `TypingPlaceholderScreen`, and most of `ExamPlanScreen` from screenshots plus source alone — and its one attempt to independently verify a screenshot (the ExamPlanScreen strip) produced a wrong retraction (see Coherence). All spacing checks were internal (computed values diffed against source constants), not against the real Figma frame side by side.
- **`critic-ux`:** could not reliably catch the "Still listening…" cue in its visible state live, after 40 sampling attempts — the same difficulty this session's own render pass independently hit (see Confidence caveats), now confirmed three separate ways. Contrast numbers came from sampled screenshot pixels and hand alpha-compositing rather than a browser devtools contrast inspector or a live axe run — cross-checked two ways and matched within ~1 RGB unit, but a genuine gamma/color-management difference could still shift a borderline number (e.g. GateScreen's dimmed title at 4.86:1) across the line either way. Flagged that the delivered `processing.png` and `still-listening-cue.png` screenshots were stale at grading time (independently re-rendered live to avoid being misled by them).
- **`critic-ambition`:** see its own section above.

---

## Confidence caveats

- **The screenshot batch this panel graded from was not fully reliable as delivered**, and three independent parties (this session's own render-and-compare pass, `critic-craft`, and `critic-ux`) converged on the same three problem files (`LoopScreen`'s `processing`, `idle-mic-snackbar`, `still-listening-cue`) without seeing each other's work — a real, if narrow, pipeline weakness rather than a coincidence. Two of the three are now fixed in `eval/screenshots/`; the third (`still-listening-cue`) resisted several independent, targeted correction attempts (fixed delays, text-visibility waits, attribute-presence polling) and still shows the pre-cue Recording frame, pixel-identical to the `Recording` story itself. Whether a real user ever sees this cue rendered for more than a one-frame flash — versus it being a state that's only reachable because the test's own `play()` function clicks Discard the instant `waitFor` detects it — is an open question this review could not resolve and flags rather than guesses at.
- No critic drove a live axe/devtools contrast run on an actually-open browser tab; the Accessibility hard-gate finding rests on two independently-converging computed methods (pixel sampling and token-based hand compositing), not a third, tool-verified method. Given how far MicOffScreen's numbers (1.88:1, 2.83:1) sit below the 4.5:1 floor, this wouldn't change the pass/fail call, but it's worth naming since the rubric asks for that discipline explicitly.
- The ExamPlanScreen frame-height gap was verified by this session directly (exact pixel sampling, see render-and-compare pass) after two critics disagreed on it — that's the one factual conflict in this panel that got adjudicated with fresh measurement rather than left standing.
