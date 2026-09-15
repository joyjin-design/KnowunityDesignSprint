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

The typing turn is out of scope this sprint. Reached from **Try typing instead** (Silence sheet) and **Type instead** (mic-off sheet).

- **Content:** says typing isn't part of this prototype.
- **What the student can do:** **Skip** → next question; **Back to voice** → idle for the same question.
- **Components:** `TextBlock`, `ButtonGroup` (`variant="Horizontal"`, `size="L"`) of a Secondary `ButtonIcon` (Skip) and a `Button` (Back to voice). Final layout and copy are Open.

### 5. Mic-off sheet

Shown when the student taps **Start** but mic permission has since been revoked.

- **Components:** `BottomSheet` (with `aria-label`) + `BottomSheetAppBar` (`variant="Default"`), `TextBlock` with Settings instructions in `middleSection`, and `ButtonGroup` (Horizontal, L) of `ButtonIcon` Skip + `Button` Primary "Type instead" in `bottomSection`.
- **What the student can do:** **Type instead** → typing placeholder; **Skip** → next question. There's no Open Settings button (a web app can't link there).

### 6. Gate (mic primer)

Figma, both in the first-run section: **13575:1934** ("04bfull-screen gate (built)"), the gate on its own, and **13555:8294** ("04afull-screen gate (built)"), the same gate with its "Allow microphone access?" sheet open. The sheet is back in the build (decided 2026-09-15, reversing the earlier drop).

- **Content:** headline "Say it, don't just tap it"; body "Tap Start and explain it out loud, in your own words. Tap Stop when you're done. Knowie's listening for what you know, not perfect grammar."; mascot; two buttons.
- **Components:** `Screen`, `TextBlock`, `MascotSlot` (`size="2XL"` in both states, as both frames now have it), and `ButtonGroup` (`variant="Vertical"`, as in Figma) of `Button` Primary **Turn on microphone** + `Button` Secondary **Can't talk right now**.
- **Permission sheet:** `BottomSheet` in `bottomSheetOnly`, with `BottomSheetAppBar` showing the title "Allow microphone access?" and caption "Knowie needs this to hear you explain answers out loud." (Figma's instance still uses the old `Type=Default` axis; confirm the variant in Storybook when building), and `ButtonGroup` (`variant="Vertical"`, `size="L"`) of `Button` Primary **Allow** + `Button` Secondary **Don't allow**. Known: `Button` Secondary is hard to see on a sheet's `background/surface` (logged 2026-09-11).

| State | What the student can do |
| --- | --- |
| First time (13575:1934) | **Turn on microphone** → the permission sheet. **Can't talk right now** → 01Exam |
| Permission sheet open (13555:8294) | **Allow** → real iOS prompt: Allow → loop, question 1 idle; Don't Allow → 01Exam. **Don't allow** → closes the sheet, back to the gate (nothing is asked of iOS) |
| After an earlier denial | Settings steps replace the body copy. **I've turned on the mic** → checks permission; if granted → loop. **Can't talk right now** → 01Exam |

- The sheet appears only after **Turn on microphone**, so the gate's own buttons, including **Can't talk right now**, stay reachable. Accepted: a student who allows is asked twice in a row, by the sheet and then by iOS.

- The body copy says "Tap Stop"; the recording button now reads "Send". See Open.

### 7. Why? explanation sheet

Modelled on `reference/TapWhy?.PNG`. There's no Figma design yet.

- **Composition:** `BottomSheet` + `BottomSheetAppBar` (`variant="Default"`), with the explanation paragraph in `middleSection`. The peeking `MascotSlot` and a `Button` (`variant="Primary"`, "Got it", default `interactive/primary` fill) are positioned **outside `BottomSheet`**, above its top edge, inside `Screen`'s `bottomSheetOnly` slot. The student's transcript stays visible behind.
- **States:** after Success; after Partial or Fail, where the concepts the judge found missing are bold.
- **What the student can do:** only **Got it** → next question, or the summary. It can't be dragged down or closed from the backdrop.
- **Not carried over:** the shipped quiz's "How can I help?" input.

### 8. Summary sheet

A `BottomSheet` at `height="L"` over the last question's screen, with rows scrolling inside `middleSection`. There's no Figma design yet.

- **Content:**
  - A headline count: questions explained, meaning passes.
  - One row per question: the question, a snippet of **the student's own transcript**, and the verdict (Pass / Partial / Fail / Skipped). Rows are built **inline** in the summary, token-styled, not as a component.
  - The caption "One more try at the N you missed".
- **Actions:** `ButtonGroup` (`variant="Vertical"`, `size="L"`) in `bottomSection`, with `Button` Primary **Continue** and `Button` Secondary **Try again**.

| State | Rows | What the student can do |
| --- | --- | --- |
| After the first session, some non-pass | All 4 | **Continue** → exam plan image. **Try again** → reruns only the non-pass questions |
| After the first session, all pass | All 4 | **Continue** (Try again and caption behaviour: Open) |
| After a Try again run | **Only the rerun questions** | **Continue** only; round 2 is used |

- There is no confidence rating and no review queue.
- With no top-up, progress in a Try again run rounds to the nearest step.

### 9. appBar (component, built before screen 10)

✅ Built 2026-09-14 as `AppBar` (`app/components/AppBar.tsx`, Storybook `Components/AppBar`). In the loop: `variant="leftIconButtonOnly"` with a close icon, and `ProgressIndicator` plus the XP chip passed together in `slot`.

Built from Figma's `appBar` set (9003:8606: variants default / leftIconButtonOnly / leftAndRightIconButton / leftAndRightButton / leftAndTwoRightIconButtons / leftAnd2RightButtons, plus a `Slot`) after this Open list is closed. It goes through the usual process: Storybook, stories and a design-system.md entry.

- **In the loop it holds:** a close icon button, `ProgressIndicator` (`thickness="16"`) in the Slot, and a static XP chip ("⚡2", never counts).

### 10. Voice recall loop (hardest; blocked on Verification step 0)

Figma: 05Starting 13548:6327, 06Talking 13548:6328, 07KeepTalking 13568:5231, 08Talking-finished 13568:5313, Thinking 13642:7889.

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
- A question gets two rounds at most: the original and one Try again.
- Every turn is logged on the device and shown at `/log`.

**Accepted mismatch:** the Silence sheet's "Didn't catch it" copy also covers network errors and questions. When a question or a 15s timeout shows it over a visible transcript, it reads as a sheet that didn't catch words it clearly caught. Kept for this round (2026-09-15); watch for it in the usability sessions.

## Verification

### 0. Spike first (decides whether screen 10 is possible)

On the test iPhone, served over a tunnel or `next dev --experimental-https`, build a throwaway page that uses the mic and `webkitSpeechRecognition`. Try it in a Safari tab and as a home-screen web app. Record which one streams interim results, restarts cleanly after a pause, and keeps mic permission across reloads. Collect real transcripts of the sample answers in `content/voice-recall-questions.md` and replace the guessed mis-hearings. Log the results in `sprint-context.md`.

### 1. Automated checks

- `npx vitest run --project=storybook`: every story passes with a11y failures set to `error`. New and changed states have stories: `ButtonVoice` with icons, `TranscriptDisplay` Overflow anchored to the newest text, and `appBar`.
- `npm run lint` and `npm run build` pass.
- **Judge tests:** a table of transcript → expected verdict, one row per rule in "On Send" above, covering every sample answer in the content file.
- **No invented values:** no raw hex or px in any new `*.module.css` (`Keyboard.module.css` excepted), and every `var(--…)` exists in `build/css/tokens.css`.

### 2. End to end on the test iPhone

Use the setup chosen in the spike: a tunnel or local HTTPS while building, the Vercel URL for sessions. Clear the log first. After each step, check the screen, then check `/log`.

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
7. **Q4:** an off-topic answer → **Fail** → **Continue** → summary sheet (height L): the count reads 1, 4 rows with transcript snippets (Pass / Partial / Partial / Fail), caption "One more try at the 3 you missed".
8. **Try again:** the 3 questions rerun. On the first, tap **Skip**. The summary shows only those 3 rows, with no Try again. **Continue** → 01Exam.
9. **Failure paths** (each from a fresh node open):
   - With `?latency=slow`: "Almost there…" appears at ~5s and holds until the verdict.
   - With `?latency=hang`: the Silence sheet at 15s.
   - Lock the phone mid-recording and unlock → Idle with the Silence copy.
   - Airplane mode, then **Send** → Silence sheet.
   - **Skip** during processing → next question straight away; no verdict sheet appears, and the turn is logged as Skipped.
   - **Close** during processing → 01Exam; reopening starts at Q1.
   - **Can't talk right now** on Q2 → 01Exam; reopening starts at Q1.
10. **Revoke the mic in iOS Settings**, open a node, tap **Start** → mic-off sheet. **Type instead** → placeholder; **Back to voice** → idle. **Skip** → next question.
11. **Open `/log`:** every answered, skipped and Silence turn is there with the right round, transcript, concepts, verdict, latency and flag. Nothing is logged for the cancel or the accidental tap. **Copy as CSV** gives the same rows; **Clear log** asks, then empties it.

**Done** means every step behaves as described and every automated check passes, with nothing skipped.

## Open (not yet decided)

**Blocked on the spike**
1. Home-screen web app or Safari tab.
2. The Settings steps copy for the gate and mic-off sheet.

**Flow**

3. Whether 00Homescreen is a static image like the exam plan (it's mostly hand-drawn frames in Figma).
4. When the gate shows: only the first time a node opens, or every time mic permission isn't granted (and then when the mic-off sheet shows instead).
5. What happens when **I've turned on the mic** finds the mic still off.
6. Whether **Try typing instead** (Silence sheet) and **Type instead** (mic-off sheet) should go back to 01Exam like **Can't talk right now**, instead of the typing placeholder. The placeholder's layout and copy, if kept.
7. The gate's body copy says "Tap Stop when you're done", but the recording button now says "Send".

**Screens**

8. ✅ Resolved: `appBar` is `leftIconButtonOnly`, and the XP chip is built inline as a plain chip, not `Chip` (2026-09-15).
9. Mascot expression while recording (idle is standby, processing is thinking).
10. Summary: headline copy; whether Try again and its caption are hidden when everything passed; whether the summary has a mascot; how long a transcript snippet is before truncating; what a Skipped row shows in place of a snippet.
11. Continue from the summary lands on the exam plan image, which can't show the node as completed.

**Content**

12. Q8's concept B is loosely phrased; check it against spike transcripts. Question order within a node (as written, or random).

**Already flagged elsewhere**

13. `Partial` still uses `accent/blue` as a stand-in colour.
14. The Phosphor icons (already used in code by `Snackbar`) differ from the Figma library's icon family (for Harry).

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
