# Voice recall prototype spec

Source: the 2026-09-14 design interview and the Open-list pass after it. Every question and answer is in `voice-recall-interview-2026-09-14.csv`; the decisions are logged in `sprint-context.md`. If this file and the log disagree, the log wins; fix this file.

Figma references are nodes in the Yummy-Knowie Design System file (`VF5OpIZyDTe8ML0YITnjPe`), page "Design the core flow", section "Design for voice recall first run experience".

## What we're building

An iOS voice active-recall step inside Knowunity's exam plan. The student answers 4 biology questions out loud, sees a live transcript, and gets a pass/partial/fail verdict in text.
Transcripts come from the browser's own speech recognizer, judging is a mocked keyword judge, and every screen has a way out. Built for moderated usability tests with English-speaking students.

## Screens, in build order (easiest first)

Component names are Storybook titles under `Components/` (source in `app/components/`). Props named here exist in the source today, unless marked **(change approved)**.

Every screen is composed inside `Screen` (`app/components/Screen.tsx`), 390px, dark mode. Sheets go in its `bottomSheetOnly` slot with `showBottomSheetBackground`, except the verdict sheet (screen 1), which has no dim. Questions and their content come from `content/voice-recall-questions.md`.

### 1. Verdict sheet

✅ Built 2026-09-15 as `VerdictScreen` (`app/screens/VerdictScreen.tsx`, Storybook `Screens/VerdictScreen`). Figma: 10End 13568:5533 (Success), Partial 13568:5615, Incorrect 13568:5747 (Error), Silence 13659:3542 (replaces Silence03). It sits over the loop screen, with the transcript visible behind it.

- **No dim behind the sheet**, so the transcript reads clearly. Close stays in reach and leaves the session for 03VoicerecallON.
- **Behind the sheet:** the transcript sits below the disclaimer. Short answers are `TranscriptDisplay` Filled; past its 320px window, Overflow keeps the newest words visible and fades the oldest off the top. With nothing heard, nothing shows there (the Silence frame's "I'm listening…" would contradict "Didn't catch it"). Silence with words heard still shows them.
- **Progress moves when the verdict appears**, counting the question just answered. Silence doesn't move it.
- **Home indicator:** the sheet's bottom padding is the larger of `space.700` and the safe-area inset, so on the phone the buttons end 34pt above the edge with the home bar inside that space, as in the shipped app (`reference/Errorwithhomebar.PNG`).

| State | When | What the student can do |
| --- | --- | --- |
| `variant="Success"` | Pass | **Why?** (`onWhy`) → Why? sheet. **Continue** (`onContinue`) → next question, or the summary after the last one |
| `variant="Partial"` | Partial | Same as Success |
| `variant="Error"` | Fail (title "Incorrect") | Same as Success |
| `variant="Silence"` | Empty transcript, noise with no words, recognizer or network error, no result by 15s, **or the answer opened with a question** | **Re-record** (`onReRecord`) → recording. **Try typing instead** (`onTypeInstead`) → typing placeholder (screen 4). **Skip** (`onSkip`) → next question. No attempt used |

- One attempt per question; no Try again on any verdict.
- Silence can repeat any number of times.
- The thumbs up/down that `ResultBtm` renders stay unwired.

### 2. Turn log (`/log`, facilitator only)

A hidden route, never linked from the student flow.

- **States:** no turns yet; turns listed; the Clear log confirm.
- **Components:** `Button` (`variant="Primary"`) for **Copy as CSV**, `Button` (`variant="Secondary"`) for **Clear log**. The rows use tokens only.
- **Fields per turn:** session, round (original or Try again), question, transcript, concepts hit, verdict, latency, latency flag, timestamp.
- **Clear log** asks for confirmation, then empties storage on the device. Use it between participants, after copying the CSV.

### 3. Homescreen and exam plan (static images)

✅ Built 2026-09-15 as `ExamPlanScreen` and `ExamPlanFlow` (`app/screens/ExamPlanScreen.tsx`, Storybook `Screens/ExamPlanScreen`), with the frames in `public/frames/` (3× exports) and the tap zones in `app/_prototype/`. `app/page.tsx` starts on 00Homescreen. Node taps don't lead anywhere until the gate (screen 6) is built.

The exam plan is out of scope as components. These screens are exported Figma frames with tap zones:

| Image | Figma | Tap zone → goes to |
| --- | --- | --- |
| 00Homescreen | 13619:3109 | Exam tab (with badge) → 01Exam |
| 01Exam | 13548:6324 | Show me (banner) → 02Hint-animate |
| 02Hint-animate | 13547:5824 | Voice recall toggle → 03VoicerecallON |
| 03VoicerecallON | 13548:6325 | Organelle Identification node → gate (or the loop, see Open) · Comparing Cell Types node → same, for node 2 |

- **What the student can do:** only the tap zones above.
- The only snackbar in the whole flow is 01Exam's readiness banner. It's part of the image, not a `Snackbar` instance.
- **Show me hint animation: not decided.** Two options are prototyped for the moment after **Show me** (02Hint-animate). See **Options under consideration**.

### 4. Typing placeholder

✅ Built 2026-09-15 as `TypingPlaceholderScreen` (`app/screens/TypingPlaceholderScreen.tsx`, Storybook `Screens/TypingPlaceholderScreen`). No Figma frame. The typing turn is out of scope this sprint. Reached from **Try typing instead** (Silence sheet) and **Type instead** (mic-off sheet).

- **Content:** title "Typing isn't part of this prototype", caption "This build is voice only. Go back to the exam plan to try again by voice." (`TextBlock`, `variant="L"`).
- **What the student can do:** **Back to voice** → leaves the session for the exam plan (01Exam). This resolves Open #6 for this screen's own button: no Skip (removed 2026-09-15), so Back to voice is the only, and therefore sole, way out.
- **Components:** `Screen`, `TextBlock` (`variant="L"`), `Button` (`variant="Primary"`, `size="L"`) alone in `bottomContent` — no `ButtonGroup`, since there's only one action.
- **Spacing/type (2026-09-15 review):** `size.space.300` (12px) between title and caption, overriding `textBlock`'s own 4px gap at `variant="L"` (local override, `TextBlock` isn't next to a mascot here). Caption line height is 150% (`line-height: 1.5`), a literal ratio, not a token — no line-height token equals 150% of Headline XS Regular's 18px.

### 5. Mic-off sheet

✅ Built 2026-09-15 as `MicOffScreen` (`app/screens/MicOffScreen.tsx`, Storybook `Screens/MicOffScreen`). No Figma frame at build time; a reference mockup was added afterward ("Permission ask (invented — no system equivalent)", Figma 13666:3837) and the build was revised to match it. Shown when the student taps **Start** but mic permission has since been revoked.

- **Behind the sheet:** the loop's Idle look (mascot, question bubble, disclaimer, `TranscriptDisplay` Empty), reconstructed inline since screen 10 isn't built yet — the tap never reaches Recording. Dimmed (`showBottomSheetBackground`), per the general sheet rule; the verdict sheet (screen 1) is the one documented exception, not this one.
- **Components:** `BottomSheet` (with `aria-label`) + `BottomSheetAppBar` (`variant="withTitle"`, title "Your mic is off", caption "Open Settings, find Voice recall, then turn on Microphone.") — not a separate `TextBlock` in `middleSection`, which is unused. `ButtonGroup` (Horizontal, L) of `ButtonIcon` Skip + `Button` Primary "Type instead" in `bottomSection`.
- **Settings copy is still a placeholder**, pending Open #2 (blocked on the Verification-step-0 spike).
- **What the student can do:** **Type instead** → typing placeholder; **Skip** → next question. There's no Open Settings button (a web app can't link there).
- **Component fixes made building this screen (apply to every `BottomSheet`/`BottomSheetAppBar` usage):**
  - `ButtonIcon` Secondary's real fill (`background/surface`) matched the sheet's own background, making the Skip button invisible — fixed with the same local `.skipButton` override `ResultBtm` already uses (`interactive/secondary` + `interactive/onSecondary`), applied per-screen, not to `ButtonIcon` itself.
  - `BottomSheetAppBar`'s `withTitle` inline padding: `space.600` (24px), not the real master's own bound 16px.
  - `BottomSheet`'s `bottomSection` padding: `space.700` (28px) on every side, not the real master's own bound 16px — reconciles it with `ResultBtm`'s own `.bottomCta`, which already used this padding.
  - `BottomSheetAppBar`'s title/caption are left-aligned, not centered, confirmed against the reference mockup — applies to every variant that shows text.

### 6. Gate (mic primer)

✅ Built 2026-09-15 as `GateScreen` (`app/screens/GateScreen.tsx`, Storybook `Screens/GateScreen`). Figma, both in the first-run section: **13575:1934** ("04bfull-screen gate (built)"), the gate on its own, and **13555:8294** ("04afull-screen gate (built)"), the same gate with its "Allow microphone access?" sheet open. The sheet is back in the build (decided 2026-09-15, reversing the earlier drop). The third state, after an earlier denial, has no frame.

- **Content:** headline "Say it, don't just tap it"; body "Tap Start and explain it out loud, in your own words. Tap Stop when you're done. Knowie's listening for what you know, not perfect grammar."; mascot; two buttons.
- **Components:** `Screen`, `TextBlock` (`variant="L"`; title/caption fonts, their gap, and centering are all local overrides — see below), `MascotSlot` (`size="2XL"`, `expression="approving"` in both states), and `ButtonGroup` (`variant="Vertical"`, `size="L"`) of `Button` Primary **Turn on microphone** + `Button` Secondary **Can't talk right now**.
- **Permission sheet:** `BottomSheet` in `bottomSheetOnly`, with `BottomSheetAppBar` (`variant="withTitle"`) showing the title "Allow microphone access?" and caption "Knowie needs this to hear you explain answers out loud.", and `ButtonGroup` (`variant="Vertical"`, `size="L"`) of `Button` Primary **Allow** + `Button` Secondary **Don't allow**.
- **Dimmed** (`showBottomSheetBackground`) while the sheet is open — the general sheet rule; the verdict sheet (screen 1) is the one documented exception, not this one. Figma's own "sheet open" frame has the dim off and its scrim hidden, possibly an authoring gap rather than a deliberate choice — flagged, not resolved.
- **After an earlier denial:** the body copy swaps to Settings steps (reusing the mic-off sheet's own placeholder copy, "Open Settings, find Voice recall, then turn on Microphone." — pending Open #2), and the primary button becomes **I've turned on the mic**.

| State | What the student can do |
| --- | --- |
| First time (13575:1934) | **Turn on microphone** → the permission sheet. **Can't talk right now** → 01Exam |
| Permission sheet open (13555:8294) | **Allow** → real iOS prompt: Allow → loop, question 1 idle; Don't Allow → 01Exam. **Don't allow** → closes the sheet, back to the gate (nothing is asked of iOS) |
| After an earlier denial | Settings steps replace the body copy. **I've turned on the mic** → checks permission; if granted → loop; if still off, an inline notice ("Still off — check Settings and try again.") appears under the caption and the state stays put. **Can't talk right now** → 01Exam |

- The sheet appears only after **Turn on microphone**, so the gate's own buttons, including **Can't talk right now**, stay reachable. Accepted: a student who allows is asked twice in a row, by the sheet and then by iOS.
- ✅ Resolved (Open #5, 2026-09-15): a recheck that's still off shows the inline notice above, `color/text-error`, cleared whenever the gate is reopened so it can't reappear stale.
- The mic's `unavailable` result (no HTTPS, or no mic hardware) is routed exactly like a real denial, on your call (2026-09-15) — it only shows up testing over plain HTTP, so it doesn't get its own path.
- **Component fixes made building and reviewing this screen:**
  - `Button` Secondary/L's own master is now bound to `interactive/secondary`, not `background/surface` — fixed at the source in Figma (2026-09-15), so `Button.module.css` now defaults Secondary+L to it too. Size S/M's masters are untouched, still `background/surface`.
  - Title font: 44px Bold/44 (`textBlock`'s own default) → 33px Bold/36 → **28px Bold/28** (`font-greed-headline-m`, final). Caption: 18px Regular/24 → 15px Regular/20 (`font-greed-body-s-regular`, an exact token match).
  - Both button groups' own gaps are hand-adjusted per placed instance, not their master's real 8px default: the gate's own is 12px, the sheet's is 16px.
  - The sheet's buttons now fill its width (a scoping wrapper was shrinking instead of stretching) and the title is centered, not flush-left (`textBlock`'s own `align-items: flex-start` left-aligns short, non-wrapping text even under an ancestor's `text-align: center`).
- The body copy says "Tap Stop"; the recording button now reads "Send". See Open #7 (unresolved).

### 7. Why? explanation sheet

✅ Built 2026-09-15 as `WhyScreen` (`app/screens/WhyScreen.tsx`, Storybook `Screens/WhyScreen`). No Figma frame for the screen itself. First modelled on `reference/TapWhy?.PNG`, then rebuilt against `reference/Quiz-Why-explanation.png` on review (a better layout reference added the same day); individual components inside it (Got it) were separately checked against their own real Figma masters.

- **Composition:** `BottomSheet` (`middleSection` holds the explanation paragraph; no `bottomSection`) over the same behind-the-sheet reconstruction `VerdictScreen` (screen 1) uses — mascot, question bubble, `AiDisclaimer`, transcript — since screen 10, the loop, isn't built yet. **Got it** `Button` sits outside `BottomSheet`, above its top edge, in `Screen`'s own `bottomSheetOnly` slot, floating clear of the sheet with a `space.100` (4px) gap rather than overlapping it (`reference/Quiz-Why-explanation.png` doesn't overlap it either, unlike the gate's own peeking mascot).
- **The sheet's own header:** a bare grab handle built inline, not `BottomSheetAppBar` — its only no-title variant (`Default`) still reserves a 64px zone sized for its titled variants, and this screen has no title. The inline handle uses the same token values as the real one, in a 16px zone instead; paired with the explanation's own padding, the sheet's total top and bottom padding both land at `space.2000` (40px, measured ~42px in a real browser on each side, the extra couple px from the sheet's own border stroke).
- **Got it:** `accent/coral/bold` fill with `accent/coral/on-bold` text (a local style override, not one of `Button`'s own variants — the same mechanism `ResultBtm`'s own `ACTION_COLOR` uses), `size="S"`. Its real master (Figma 4871:29852) is a fixed 32px pill, shorter than `Button`'s shared 48px tap-target floor (the right floor for `size="L"`, wrong for this master) — fixed with a local `min-height` override scoped to this button, not a `Button.module.css` change, since the app's other two `size="S"` buttons are text-only Tertiary buttons where that floor may be deliberate.
- **Knowie:** hidden for now, on your call (2026-09-15) — normally sits behind the sheet alongside Got it, the same way the gate's own mascot sits behind its buttons (Figma 13555:8294).
- **States:** after Pass, Partial or Fail — only the concepts the (mocked) judge found missing are bold; Success has nothing missing, so nothing's bold. Silence has no Why? button (`ResultBtm` doesn't render one for it).
- **What the student can do:** only **Got it** → next question, or the summary. It can't be dragged down or closed from the backdrop; **Close**, in the top app bar, is still this screen's own way out (the same rule `VerdictScreen` follows), separate from the sheet's own dismissal rules.
- **Not carried over:** the shipped quiz's "How can I help?" input.
- **Wired into `PrototypeFlow`:** reached from the verdict view's own Why? (Pass/Partial/Fail only); Got it goes to the loop's "Not built yet" stop, same as the verdict screen's own Continue. Review links: `?screen=why-pass`, `why-partial`, `why-fail`.

### 8. Summary sheet

✅ Built 2026-09-15 as `SummaryScreen` (`app/screens/SummaryScreen.tsx`, Storybook `Screens/SummaryScreen`), shown after the last question in a run. Modelled on `reference/Finish-quiz.png` and the matching real Figma frame (node `7366:69693`, `scaffold` / `size=iPhone 13`, in the "Design the core flow" page) — your link, 2026-09-15. This replaced an earlier same-day row-by-row build (a `BottomSheet` with per-question rows and a Try again action, the design this section used to describe); that build is fully superseded by what's below.

- **Composition:** a full screen, not an overlay over the loop — `MascotSlot` (`size="3XL"`) above a dynamic headline/subhead pair, then a two-card stat row (`XP`, `Score`), then `ButtonGroup` (`Horizontal`, `L`) of `Button` Secondary **Share** + `Button` Primary **Claim XP** in `bottomContent`.
- **Headline/subhead/mascot expression are dynamic on pass count.** A clean run reuses Figma's own copy and expression verbatim: "Perfect lesson!", "You made 0 mistakes. How?!", `expression="approving"`. Some passed and none passed are authored copy, not in this file, `Voice-ux.md` or the content file: "Lesson complete!" / "You explained N of M out loud." (`approving`), and "Lesson complete" / "Let's go over these again next time." (`determined`).
- **Stat chips:** `XP` is static "2", never counts — same convention as the loop's own XP chip. `Score` reads `passCount/totalCount`. Figma's own third card ("Blazing": a stopwatch icon + elapsed time, e.g. "2:09") is **dropped** — nothing in this mocked session tracks elapsed time, the same fabricated-metric problem already ruled out for XP. Adding a real timer (derived from the turn log's own session-start/turn timestamps) was scoped in full on 2026-09-15; your call was to leave this screen as built rather than add it.
- **Dropped from the same-day earlier build, on your instruction:** the per-question row list (question, transcript snippet, verdict) and the Try again path — a non-pass question gets no further round from this screen. CLAUDE.md's transcript rule stays satisfied earlier in the flow regardless: every `VerdictScreen`/`WhyScreen` already shows the transcript back at the moment of judging.
- **Close (top-left X) is a deliberate addition, not in the Figma frame at all** (its own top nav is empty). Since Share and Claim XP are both decorative this sprint and neither leaves the screen, Close is the only way out — CLAUDE.md's "never trap the student" rule.
- **What the student can do:** **Close** → leaves the session for the exam plan (03VoicerecallON). **Share** and **Claim XP** → nothing; both are present but unwired this sprint, per your instruction.
- **Not yet reachable from the running flow** — only by review link (`?screen=summary-some-non-pass`, `summary-all-pass`, `summary-after-try-again`). Nothing in `PrototypeFlow` tracks which question a session is on yet, so `VerdictScreen`'s and `WhyScreen`'s own Continue/Got it still return to the loop's "Not built yet" stop rather than here.

### 9. appBar (component, built before screen 10)

✅ Built 2026-09-14 as `AppBar` (`app/components/AppBar.tsx`, Storybook `Components/AppBar`). In the loop: `variant="leftIconButtonOnly"` with a close icon, and `ProgressIndicator` plus the XP chip passed together in `slot`.

Built from Figma's `appBar` set (9003:8606: variants default / leftIconButtonOnly / leftAndRightIconButton / leftAndRightButton / leftAndTwoRightIconButtons / leftAnd2RightButtons, plus a `Slot`) after this Open list is closed. It goes through the usual process: Storybook, stories and a design-system.md entry.

- **In the loop it holds:** a close icon button, `ProgressIndicator` (`thickness="16"`) in the Slot, and a static XP chip ("⚡2", never counts).

### 10. Voice recall loop (hardest) ✅ Built 2026-09-15

Figma: 05Starting 13548:6327, 06Talking 13548:6328, 07KeepTalking 13568:5231, 08Talking-finished 13568:5313, Thinking 13642:7889.

**Real STT deferred, built against a scripted stand-in.** Verification step 0's spike (real mic + `webkitSpeechRecognition` on the test iPhone) still hasn't run, so this screen doesn't block on it: `lib/recall/scriptedTranscript.ts` streams one of the question's sample answers word-by-word into `TranscriptDisplay` instead, picked by a facilitator-only "Next answer" control on `/log` (same pattern as the latency switch). It's written to the same shape (`start`/`stop`, interim + final callbacks) a real recognizer wrapper will need, so swapping one in once the spike runs is a small follow-up, not a rebuild. "Still listening…" is triggered by a scripted mid-stream pause for now; the real iOS-restart trigger returns with the real recognizer.

**Try again is out, for real.** SPEC.md's older "two rounds per question" text (Session rules, below) is superseded: `SummaryScreen`'s own 2026-09-15 rebuild (matching `reference/Finish-quiz.png`) already dropped Try again — no button, no rerun rows, no caption — and this build treats that as the decision, not an oversight. A session is one pass through a node's 4 questions, then Summary, then Close; `round` stays `1` in every turn log row (Open item 12, now resolved).

- **Top:** `appBar` (screen 9).
- **Middle:**
  - A question row, built inline in the screen: `MascotSlot` (`size="XL"`), a speech bubble (plain token-styled elements, no component) holding the question, and `AiDisclaimer` underneath.
  - `TranscriptDisplay` below it.
- **Bottom (idle):** `ButtonGroup` (`variant="Horizontal"`, `size="L"`) of `ButtonIcon` (`variant="Secondary"`, Skip) + `ButtonVoice`, then `Button` (`variant="Secondary"`, `size="L"`) **Can't talk right now** (Figma 13561:2721).

**Approved component changes for this screen**
- ✅ (2026-09-15, with screen 1) `ButtonVoice` passes a `leftIcon` through to `Button` (Figma already exposes `showLeftIcon`): Phosphor `Microphone` at idle, Phosphor `Waveform` while recording. Silence's Re-record already uses the mic.
- ✅ (2026-09-15, with screen 1) `TranscriptDisplay` `state="Overflow"` anchors its 320px window to the **newest** text instead of clipping from the top, and fades the oldest lines out over the top `space.1200`. Every state now pads `space.800` on top, matching Figma 13563:1611's padding update.

| State | What's on screen | What the student can do |
| --- | --- | --- |
| Idle | Mascot `expression="standby"`, bubble shows the question, `TranscriptDisplay state="Empty"`, `ButtonVoice state="Default"` with mic icon + "Start", Skip, Can't talk right now | **Start**. **Skip** → next question. **Can't talk right now** → 01Exam (leaves the session). **Close** → 01Exam |
| Recording | `ButtonVoice state="Recording"` with waveform + "Send" (Figma still says "Stop"; deferred); the `ButtonIcon` beside it swaps from Skip to a discard icon (Phosphor `ArrowCounterClockwise`); Can't talk right now hidden. Transcript streams live (`Filled`, then `Overflow` anchored to the newest text) | **Send** → processing. **Cancel** → idle, take thrown away. **Close** → 01Exam |
| Still listening | Recording, plus "Still listening…" in `text/tertiary` under the transcript for ~1.5s when iOS restarts recognition | Same as Recording |
| Processing | `ButtonVoice` hidden. Bubble swaps the question for "Let me think…" (0s) → "Checking your answer…" (~2s) → "Almost there…" (~5s, holds). Mascot `expression="thinking"` with a CSS motion loop (transform only; static under reduced motion). Transcript stays. The Skip `ButtonIcon` stays visible | **Skip** → next question; judging is cancelled, the answer thrown away, logged as Skipped. **Close** → 01Exam, answer thrown away |
| Verdict | Screen 1 over this one | See screen 1 |
| Interrupted | Call, lock or backgrounding mid-recording → Idle with `TranscriptDisplay state="Silence"` ("Sorry, I didn't catch that. Can you repeat?"), no attempt used | Same as Idle |
| Accidental tap | Start then Send under ~1s with nothing heard → Idle silently | Same as Idle |
| Mic off | Screen 5 over this one | See screen 5 |

- **Leaving:** close or **Can't talk right now** ends the session with no confirmation. Opening the node again starts at question 1.

## Out of scope

- Auto-endpointing or continuous listening.
- Answering questions, tutoring or conversation, including the "How can I help?" input.
- A custom speech-to-text engine, or model-based judging.
- Hints, a hint ladder, Say it back, and more than one attempt per question within a session.
- **The typing turn** (buttons lead to the placeholder; `AnswerInput` and `Keyboard` are unused in this flow).
- **Review node and review queue.**
- **Exam plan screens as real components** (static images; no toggle, node or banner components).
- **In-loop snackbars.**
- XP as a mechanic (the chip is static), a confidence rating, resuming mid-session, and a leave confirmation.
- Thumbs up/down feedback (rendered, unwired).
- A distinct noise or "can't answer questions" state; both use the Silence sheet.
- VoiceOver announcements for the live transcript, and reduced-motion handling beyond the mascot loop (known gap).
- Languages other than English, in-app consent, reminder notifications, and a facilitator verdict panel.
- From `Voice-ux.md`: mic busy (on a call), switching language mid-answer, and pausing and resuming one take.
- Any platform other than 390px iOS in dark mode.

## How the mocked recall behaves

**Recording**
- Real mic and the browser's built-in recognizer (`webkitSpeechRecognition`), English, streaming interim results into `TranscriptDisplay`.
- Only Send ends a take. If iOS ends recognition on a pause while still recording, it restarts, keeps adding to the same transcript, and shows "Still listening…".

**On Send, in order**
1. **Under ~1s and nothing heard:** dropped, back to Idle, nothing logged.
2. **Wait for the final result.** If it doesn't arrive in ~2s, use the last live transcript.
3. **Empty transcript** (silence, noise, recognizer or network error): Silence sheet, no attempt used.
4. **Opens with a question** (what, what's, how, why, can you, could you, is it, does it, I don't get, I don't know what, what does, wait) **or ends with "?"**: Silence sheet, no attempt used. Deliberately loose: a real answer starting "What happens is…" is caught too.
5. **Keyword judge** using the question's 3 concepts in `content/voice-recall-questions.md`. A concept counts if any of its phrases, synonyms or listed mis-hearings appear (case-insensitive).
   - 2 or 3 concepts **and a real sentence** → **Pass**. A real sentence is at least 6 words plus at least one linking word: is, are, it, they, has, have, makes, uses, because, so, and, which, that.
   - 2 or 3 concepts without a real sentence → **Partial** (the list cap).
   - 1 concept → **Partial**.
   - 0 concepts → **Fail**.
6. **Fake wait.** The processing state is held for 2–4s. About 1 in 5 turns are slow (7–8s). With no verdict by 15s, the Silence sheet shows.

**URL flags** for testing, set by the facilitator: `?latency=slow` makes every turn 7–8s; `?latency=hang` never returns a verdict, so the 15s Silence path runs.

**Session rules**
- 4 questions per session. Node 1 is Q1–Q4 (Organelle Identification), node 2 is Q5–Q8 (Comparing Cell Types).
- Skip counts as non-pass.
- ~~A question gets two rounds at most: the original and one Try again.~~ Superseded: Try again is out (screen 10, 2026-09-15) — every question gets exactly one round.
- Every turn is logged on the device and shown at `/log`.

**Accepted mismatch:** the Silence sheet's "Didn't catch it" copy also covers network errors and questions. When a question or a 15s timeout shows it over a visible transcript, it reads as a sheet that didn't catch words it clearly caught. Kept for this round (2026-09-15); watch for it in the usability sessions.

## Verification

### 0. Spike (deferred; no longer blocks screen 10)

On the test iPhone, served over a tunnel or `next dev --experimental-https`, build a throwaway page that uses the mic and `webkitSpeechRecognition`. Try it in a Safari tab and as a home-screen web app. Record which one streams interim results, restarts cleanly after a pause, and keeps mic permission across reloads. Collect real transcripts of the sample answers in `content/voice-recall-questions.md` and replace the guessed mis-hearings. Log the results in `sprint-context.md`.

Screen 10 was built ahead of this spike against a scripted transcript stand-in (see screen 10's own notes) rather than waiting on it — this step is still open, but is now a follow-up to wire the real recognizer in, not a blocker.

### 1. Automated checks

- `npx vitest run --project=storybook`: every story passes with a11y failures set to `error`. New and changed states have stories: `ButtonVoice` with icons, `TranscriptDisplay` Overflow anchored to the newest text, and `appBar`.
- `npm run lint` and `npm run build` pass.
- **Judge tests:** a table of transcript → expected verdict, one row per rule in "On Send" above, covering every sample answer in the content file.
- **No invented values:** no raw hex or px in any new `*.module.css` (`Keyboard.module.css` excepted), and every `var(--…)` exists in `build/css/tokens.css`.

### 2. End to end on the test iPhone

Use the setup chosen in the spike: a tunnel or local HTTPS while building, the Vercel URL for sessions. Clear the log first. After each step, check the screen, then check `/log`.

Real STT is deferred (step 0): wherever a step below says "speak" or "say", pick the matching sample on `/log`'s "Next answer" control first (`pass`/`partial`/`fail`/`list`/`question`/`blank`), then tap Start — it streams in on its own.

1. **00Homescreen → exam tab** → 01Exam → **Show me** → 02Hint-animate → **toggle** → 03VoicerecallON → **Organelle Identification** → gate.
2. **Gate:** **Can't talk right now** → 01Exam. Go back to the gate. **Turn on microphone** → the permission sheet → **Don't allow** → back on the gate. **Turn on microphone** → **Allow** → iOS prompt → **Don't Allow** → 01Exam. Open the node again: the gate shows Settings steps. Allow the mic in iOS Settings → **I've turned on the mic** → Q1 idle.
3. **Q1 idle:** question in the bubble, mascot standby, disclaimer, Empty transcript placeholder, mic icon + Start, Skip, Can't talk right now; progress 0; XP chip reads 2.
4. **Start** → waveform + Send, cancel icon instead of Skip, Can't talk right now hidden. Speak a 2-concept sentence with a pause → "Still listening…" appears and nothing is sent. **Send** → button hidden, phrases advance, mascot moves → **Success**. **Why?** → explanation with no bold terms, mascot and Got it above the sheet, can't be dragged down. **Got it** → Q2, progress 25.
5. **Q2:** a 1-concept answer → **Partial**. Why? shows the missed concepts in bold → Got it → Q3.
6. **Q3:**
   - Answer at length: the transcript keeps the newest words visible. **Cancel** → Idle, nothing logged.
   - **Start** then **Send** immediately → Idle silently.
   - **Start**, say nothing, **Send** → Silence sheet. **Re-record** → "What does the cell membrane do?" → Silence sheet again, no attempt logged.
   - **Re-record** → a bare keyword list → **Partial**. **Continue**.
7. **Q4:** an off-topic answer → **Fail** → summary: mascot, headline "Lesson complete!" ("You explained 1 of 4 out loud."), Score chip reads 1/4. Share and Claim XP are present but don't do anything. **Close** → 01Exam (03VoicerecallON).
8. **Failure paths** (each from a fresh node open):
   - With `?latency=slow`: "Almost there…" appears at ~5s and holds until the verdict.
   - With `?latency=hang`: the Silence sheet at 15s.
   - Lock the phone mid-recording and unlock → Idle with the Silence copy.
   - Airplane mode, then **Send** → Silence sheet.
   - **Skip** during processing → next question straight away; no verdict sheet appears, and the turn is logged as Skipped.
   - **Close** during processing → 01Exam; reopening starts at Q1.
   - **Can't talk right now** on Q2 → 01Exam; reopening starts at Q1.
9. **Revoke the mic in iOS Settings**, open a node, tap **Start** → mic-off sheet. **Type instead** → placeholder; **Back to voice** → idle. **Skip** → next question.
10. **Open `/log`:** every answered, skipped and Silence turn is there with the right round, transcript, concepts, verdict, latency and flag. Nothing is logged for the cancel or the accidental tap. **Copy as CSV** gives the same rows; **Clear log** asks, then empties it.

**Done** means every step behaves as described and every automated check passes, with nothing skipped.

## Open (not yet decided)

**Blocked on the spike**
1. Home-screen web app or Safari tab.
2. The Settings steps copy for the gate and mic-off sheet.

**Flow**

3. ✅ Resolved: 00Homescreen is a static image like the rest of the exam plan, with its own tap zones (built 2026-09-15 as part of screen 3; decided in sprint-context.md 2026-09-14).
4. When the gate shows: only the first time a node opens, or every time mic permission isn't granted (and then when the mic-off sheet shows instead).
5. ✅ Resolved: what happens when **I've turned on the mic** finds the mic still off — an inline notice under the caption (2026-09-15, see screen 6).
6. Whether **Try typing instead** (Silence sheet) and **Type instead** (mic-off sheet) should skip straight to 01Exam like **Can't talk right now**, instead of routing through the typing placeholder first. Screen 4's own layout and copy are settled (2026-09-15); this item is now only about whether that screen is reached at all, since its one button already leaves for 01Exam either way.
7. The gate's body copy says "Tap Stop when you're done", but the recording button now says "Send".

**Screens**

8. ✅ Resolved: `appBar` is `leftIconButtonOnly`, and the XP chip is built inline as a plain chip, not `Chip` (2026-09-15).
9. Mascot expression while recording (idle is standby, processing is thinking).
10. ✅ Resolved: Summary rebuilt 2026-09-15 to match `reference/Finish-quiz.png` and its real Figma frame (see screen 8) — mascot present (`3XL`), headline/subhead dynamic per pass count. Dropped the per-question rows and Try again entirely, so the transcript-snippet and Skipped-row questions this item used to ask about no longer apply.
11. Closing the summary lands on the exam plan image, which can't show the node as completed. (Was "Continue"; the summary's own leaving action is now Close — screen 8.)
12. ✅ Resolved: Try again is out, for real (screen 10, 2026-09-15) — the "Session rules" two-rounds text is marked superseded there rather than left aspirational; nothing in the built flow reaches a second round.

**Content**

13. Q8's concept B is loosely phrased; check it against spike transcripts. Question order within a node (as written, or random).

**Already flagged elsewhere**

14. `Partial` still uses `accent/blue` as a stand-in colour.
15. The Phosphor icons (already used in code by `Snackbar`) differ from the Figma library's icon family (for Harry).

## Options under consideration

Prototyped alternatives, not decisions. Nothing here is chosen or built into the app. When one is picked, log the decision in `sprint-context.md` and move it into the screen it belongs to.

### Show me hint animation

What the student sees right after tapping **Show me** on the 01Exam banner: the exam plan dims, and something points them at the **Voice recall** chip.

- **Prototype:** `public/prototypes/show-me-hint/index.html` (local; full-bleed 390px, for the test iPhone).
- **Preview link:** https://claude.ai/artifact/R2DHRWYxYu5Q9D4bM6VHMS (private). It has a fallback font and 16px side gutters, so it isn't exactly 390px wide on a phone.
- **Both options:** play once, over the dimmed exam plan. Tapping the chip goes to 03VoicerecallON. Under reduced motion both simply fade in, with no movement.

| | Option A: Knowie bounce | Option B: Lined arrow |
| --- | --- | --- |
| Figma | 02Hint-animate, 13547:5824 | Hint-animate01, 13651:2244 |
| Knowie | `mascotSlot` 2XL at (129, 95), tucked just under the chip | `mascotSlot` 2XL at (19, 145), off to the left |
| Motion | Knowie rises into place (420ms), two light hops straight up at the chip (8px, then 4px, each landing with a slight squash), then the chip pops (106% → 100% → 102% → 100%) | Knowie slides in from the left (360ms), the hand-drawn looping arrow (`mascot/body`, 6px) draws from Knowie to the chip (720ms), then the arrowhead lines draw in |
| Length | About 2s | About 1.3s |
| What points at the chip | Knowie's direction of movement, then the chip itself | A drawn line that ends at the chip |
| Motion on the button itself | Yes (the pop) | No |

**Still to decide, beyond the pick:**
- Whether option B also gets the chip pop.
- Whether the hint plays again if the student doesn't tap the chip.
- Timing, once both have been seen on the test iPhone.

## Figma follow-ups

- ✅ Loop screens: `mascotSlot` set to XL on 12 screens.
- ✅ Recording frames (06Talking, 07KeepTalking, 08Talking-finished): discard `buttonIcon` shows Phosphor ArrowCounterClockwise.
- ✅ Thinking (13642:7889) and 09Loading/AnimateHowie (13568:5451): `buttonVoice` hidden.
- ✅ `transcriptDisplay` Overflow (13563:1611): anchored to the newest text.
- ✅ `buttonVoice`: Phosphor mic at Default, waveform at Recording.
- ✅ Phosphor icon components added in section "Phosphor icons (voice recall)" (13646:8537).
- 🟡 `bottomCta` (5101:6963): swapped out of all 9 flow screens. Deleting the set is deferred (uses remain on Example Screens, TrashCan, and a loose instance on the components page).
- ⏸ Deferred: "Stop" → "Send" on `buttonVoice` Recording, and setting 06Talking, 07KeepTalking and 08Talking-finished to state=Recording (they show the mic icon until then).

## Hosting

A tunnel (Cloudflare quick tunnel or ngrok) or `next dev --experimental-https` while building and for the spike. Vercel for participant sessions: a stable URL keeps the home-screen install working. Vercel needs a GitHub remote, which the repo doesn't have yet.
