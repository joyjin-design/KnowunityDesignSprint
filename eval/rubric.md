# Grading rubric — voice recall prototype

For grading the built prototype (screens in `app/`, components in `app/components/`, stories in `stories/`) against `design-system.md`, `Voice-ux.md`, and the Design Brief's hard constraints.

## Scale and scoring rules

Score each dimension 1–10.

- **"Looks good" is a 6, not a 9.** A 6 means nothing is obviously broken. A 9 means it would survive a senior critique untouched — no "well, actually" caveats, no squinting.
- **A dimension scores 8 or above only if it was verified by rendering, measuring, or testing.** Opening the component in Storybook, screenshotting it, measuring computed styles (Playwright or devtools), running `npm run check:tokens`, or running the a11y test addon all count. Reading the source and reasoning about what it should do does not — this project's own history is the reason: the a11y suite reads green while `text/disabled`, `text/secondary`, and `text/tertiary` are all alpha tokens that axe can't evaluate (it reports `incomplete`, not pass), so a clean test run alone was not proof of contrast until someone computed it by hand against `build/css/tokens.css`. Assume code can lie the same way until you've watched the actual pixels.

If a dimension can't be verified this way (no running Storybook, no browser), cap it at 7 and say so in the writeup, rather than guessing higher.

## Dimensions

### 1. System fidelity — High

**What it's scoring:** does every color, size, weight, and line height trace back to a token in `tokens/tokens.json`, and does every piece of UI trace back to a real component in the Storybook library (per `design-system.md`), rather than something hand-drawn or invented.

- **4 —** Raw hex or pixel values sit in component source. A screen hand-draws something a real component already covers (the original mistake `buttonVoice` exists to correct: hand-drawn frames imitating `button` when a real, token-bound `button` set was sitting unused). Documented states are ignored or partially implemented.
- **6 —** No raw hex (`check:tokens` passes), and most UI is built from real Storybook components. But there are silent substitutions — a token borrowed from the wrong category, or a value approximated — without being flagged anywhere. Looks clean; an audit would still find undisclosed gaps.
- **9 —** Every value traces to a token, and every substitution or gap is explicitly logged where it happens (the `component-gaps.md` / `sprint-context.md` pattern this project already runs: e.g. borrowing `illustration/700` for a text box, or flagging that `bottomSheet` has only one real instance in the file). Storybook docs were actually queried for props before use, not assumed from naming. The same component is reused everywhere its real use applies — `buttonVoice` for voice actions, not a generic `button` standing in for it.

### 2. Coherence — High

**What it's scoring:** does the prototype read as one product end to end, or as screens that were each solved in isolation — different spacing rhythm, different motion character, different verdict language screen to screen.

- **4 —** You can tell which screen was built on which day. Spacing, corner radii, or motion timing diverge between screens with no stated reason. The same concept (e.g. a verdict, a way out, a mascot expression) is represented differently in different places.
- **6 —** Nothing clashes badly, but it's a set of well-made screens rather than one system. A handful of one-off exceptions exist without a logged reason for the divergence.
- **9 —** Shared rhythm holds everywhere without exception, or every exception is deliberate and stated. A component means the same thing wherever it's placed — `transcriptDisplay` always shows a literal transcript, `mascotSlot` expressions map onto the same emotional beats across screens, `buttonVoice`'s Recording state reads the same way in the loop as in the Silence sheet's re-record action. Wording register is resolved once and held — e.g. the "Try typing instead" vs. "Can't talk right now" split (action-wording inside a recovery sheet, situation-wording on the idle screen) applied consistently rather than reinvented per screen.

### 3. Craft — High

**What it's scoring:** spacing, rhythm, states, and the small decisions that don't show up in a spec — the difference between "technically has a hover state" and a hover state that was tuned.

- **4 —** Default/unstyled spacing in places, a documented state (Disabled, Loading, Error) exists in name only and looks identical to Default, animations pop or snap without easing, misalignment visible at a glance.
- **6 —** Clean at first look — spacing is even, all documented states are present and visually distinct. But closer inspection finds untuned edges: a gap that's close-but-not-exact to Figma, a transition using a default duration/curve rather than one considered for the moment, an a11y-required label present but generic.
- **9 —** Matches the level of scrutiny this project's own history shows is possible: spacing verified by measuring computed boxes against the real Figma frame in a browser (not eyeballed), not just claimed — e.g. the Silence sheet's title-to-support-text gap traced to two specific causes and fixed to match exactly. Motion is deliberate and consistent with intent — the waveform's group-glide computed from real token widths rather than DOM-measured or eyeballed, icon crossfades timed and one-directional on purpose, everything gated behind `prefers-reduced-motion`. States are fully distinct from each other, including states that are easy to skip (Pressed as real `:active`, Loading hiding the label and showing a spinner, not just a color swap).

### 4. UX judgment — High

**What it's scoring:** are all the states this project actually requires handled, is the hierarchy of primary vs. secondary action clear, and are the failure/recovery paths designed rather than bolted on. Grade against `Voice-ux.md`'s six principles and the states-to-design checklist, and CLAUDE.md's hard rules — not generic UX heuristics.

- **4 —** A "Must" state from the checklist is missing or unreachable (no Processing state, no cancel-before-send, verdict shown as binary pass/fail). A required action has no way out. The mic permission flow fires cold or dead-ends on denial instead of routing to text. Judging reads as punitive rather than generous.
- **6 —** Every "Must" state exists and is technically reachable, but a recovery path feels like an afterthought — Skip or "Can't talk right now" exists but isn't a one-tap affordance the way idle-turn spec requires, or is visually secondary in a way that undercuts principle 5 (text fallback as accessibility, not a lesser option). Hierarchy is correct on inspection but not obvious at a glance.
- **9 —** Every idle voice turn genuinely offers its one-tap way out (Skip or "Can't talk right now"), hidden correctly while recording, with cancel restoring idle in one tap — exactly the hard rule, not an approximation of it. Processing reads as calm and alive (skeleton/animated, not a dead spinner) rather than broken, covering the real latency gap per principle 6. Permission denial routes cleanly to the text fallback rather than trapping. The transcript is always shown, so a wrong verdict reads as "heard wrong," not "app broken" (principle 4). Verdict is legibly pass/partial/fail, not a binary with a partial label glued on. No recall answer branches into tutoring or open conversation.

### 5. Accessibility — Medium

**What it's scoring:** contrast, touch targets, and whether any meaning — state, mode, urgency — rests on color alone, per platform constraints ("no hover on mobile," "pair state with shape/icon/motion, not just color").

- **4 —** An icon-only control with no accessible name. A badge or state indicator that's color-only with nothing else (shape, icon, position, or a VoiceOver label) carrying the meaning. Obviously undersized tap targets.
- **6 —** Passes an automated a11y run, but with real, known gaps left unflagged: the kind this project has already surfaced and not yet fixed — `text/disabled` on `interactive/disabled` at 3.34:1 (technically exempt as an inactive control, but still the least readable text in the system), the thumbs up/down feedback control with no toggled/active state, the "new" badge's meaning carried by color and position alone with no VoiceOver label wired up yet.
- **9 —** Contrast verified by actual computation against `build/css/tokens.css` with real alpha compositing (not just an axe pass — axe reports alpha-channel text as `incomplete`, not verified, which is a known blind spot here), and confirmed at 4.5:1 for body text specifically, not assumed from a token's usual behavior. Touch targets measured, not eyeballed. Every state or mode that matters is legible with color removed — shape, icon, or motion always present alongside it, per principle 1's "no hover, pair color with shape/icon/motion."

### 6. Structure — Low

**What it's scoring:** does the layout hold together and does the thing actually render, at the one supported size (390px, iOS, dark mode).

- **4 —** Doesn't render, or breaks at 390px — overflow, clipped content with no scroll behavior, a slot painting an empty strip.
- **6 —** Renders correctly at 390px with no broken layout on the happy path, but an edge case (a long transcript, a long answer, an empty slot) isn't handled — content overflows unstyled, or the known-open scroll question is silently unresolved.
- **9 —** Confirmed rendering in an actual browser at exactly 390px, holds together under real content variance (a transcript long enough to hit `transcriptDisplay`'s Overflow case, a sheet tall enough to hit its height cap) without silently breaking, and empty/loading states don't paint stray boxes.

## Hard gates

Separate from the six scored dimensions. These are pass/fail, not a score, and a failure here is a defect to fix regardless of how the six dimensions otherwise score — a screen that scores well everywhere else but fails a gate is not done.

- **Contrast ≥ 4.5:1 for body text.** Measured against real rendered/composited color, not read off a token name — this project's own alpha-token blind spot (axe reports `incomplete`, not pass, on any alpha-channel foreground) means "the a11y suite is green" does not clear this gate on its own.
- **Touch targets ≥ 44pt.** Every tappable control, measured, not inferred from a token's usual size.
- **No raw hex in component source.** `npm run check:tokens` passes clean on `app/` and `stories/`.
- **No two states that should differ render identically.** If a component defines distinct states (Default/Recording, Empty/Filled, Pressed/Default, Success/Partial/Error/Silence), each one must be visually distinguishable from the others when rendered — a state that exists in code but is a no-op visually is a gate failure, not a craft deduction.
