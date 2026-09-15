---
name: build-screen
description: Use when building or editing any screen in the Knowunity voice recall prototype. That means the verdict sheet, turn log, homescreen/exam plan images, typing placeholder, mic-off sheet, gate, Why? sheet, summary sheet, the voice recall loop, or any new state of one of them. Covers finding out whether the screen has a Figma frame, composing only from Storybook components, logging component gaps, token-only styling, and the end-of-build report.
---

# Build a screen

A screen here is a composition of existing Storybook components inside `Screen`. It is not a new component. The exception is the exam plan, which is exported Figma images with tap zones (see "Image screens" below). Follow the steps in order. Don't skip the Figma check or the Storybook queries, even when the answer seems obvious.

**Build one screen, report, and stop.** Don't start the next screen until the user has reviewed this one, even when the build order makes the next one obvious.

## 1. Read the spec for this screen

- Find the screen's section in `SPEC.md` ("Screens, in build order"). Note every state in its table or list, the components and props it names, and what each action leads to.
- Read `sprint-context.md`. **If it disagrees with `SPEC.md`, the log wins.** Build to the log and mention the mismatch in your report.
  - Earlier log entries keep the Figma screen names used at the time. The 2026-09-15 rename entry maps old names to new ones.
- If the screen shows questions, transcripts or verdicts, read `content/voice-recall-questions.md`. Never make up question copy. Figma frames often show placeholder copy ("What is mitochondria?"); use the real copy and list the difference.
- Check "Out of scope" and "Open" in `SPEC.md`. Don't build an out-of-scope state. If an Open item affects this screen, build the option the spec leans toward and include it in your report.
- If `SPEC.md` marks the screen as blocked (screen 10 is blocked on Verification step 0, the spike), check `sprint-context.md` for the spike results. If they aren't logged, stop and say so.
- Props marked **(change approved)** in `SPEC.md` are the only changes you may make to an existing component's props.

## 2. Check whether the screen has a Figma frame

This decides how you work and what you report at the end.

- Figma file: Yummy-Knowie Design System, `VF5OpIZyDTe8ML0YITnjPe`. Page "Design the core flow", section "Design for voice recall first run experience". Screens there are named with a number prefix (00Homescreen, 01Exam, 02Hint-animate, 03VoicerecallON, 04a and 04b full-screen gate, 05Starting … 10End, plus Partial, Incorrect and Silence).
- Start with the `Figma:` node IDs in the screen's `SPEC.md` section. **Names change often, and node IDs almost never do,** so match frames by ID. As of 2026-09-15:
  - **Has frames:** 1 Verdict sheet (10End, Partial, Incorrect, Silence), 3 Homescreen/exam plan (00–03, exported as images), 6 Gate (two frames, one per state: 04b 13575:1934 alone, 04a 13555:8294 with the permission sheet), and 10 Voice recall loop (one frame per state).
  - **No frame:** 2 Turn log, 4 Typing placeholder, 5 Mic-off sheet, 7 Why? sheet, 8 Summary sheet.
  - 9 appBar is already built as `AppBar`.
- Don't trust that list alone. Check Figma through the `figma-console` MCP. Run `figma_get_status` first, since it needs Figma desktop open with the Desktop Bridge plugin. Then open the node IDs. For a "no frame" screen, look through the section in case a frame has been added since.
- A frame can cover only some states. The loop has frames for 05Starting, 06Talking, 07KeepTalking, 08Talking-finished and Thinking, but none for Interrupted, Accidental tap or Still listening. Treat each state on its own: states with a frame follow the frame path, the rest follow the no-frame path.
- Some frame details were deliberately overruled in `SPEC.md` or the log: "Send" vs "Stop", no dim behind the verdict sheet, nothing behind "Didn't catch it" when nothing was heard, Knowie 2XL on both gate states, and the Figma follow-ups list. The spec and log win. Still list each one as a difference.
- **If the screen has a frame but Figma isn't reachable, stop and say so.** You can't match a frame you can't see.

**With a frame:** screenshot each frame (`figma_capture_screenshot`) and read its structure, including which components and variants it uses, spacing, and which variables are bound. Keep those notes for the final comparison.
- Also read the **component sets** the frame uses, not just the frame. The user changes components directly (`transcriptDisplay`'s padding and text style both changed that way). An instance can also override its component (text alignment, sizing), and the build follows the component unless SPEC says otherwise.
- In `figma_execute`, look up variables with `figma.variables.getVariableByIdAsync` (the sync version throws). `findAll` over a whole page can throw on an unknown node type; walk children with `try/catch` instead.

**Without a frame:** before designing any behaviour, read `Design Brief.md` (especially "Hard constraints" and "Your mandate") and `Voice-ux.md` (the six principles and "States to design"). Use `reference/` screenshots for what the shipped app looks like today. `SPEC.md` names a specific reference for some screens, such as `reference/TapWhy?.PNG` for the Why? sheet. When nothing covers a case, the default from `Voice-ux.md` applies: don't trap the student; offer Skip or a way back. **Keep a running list of every decision you make that isn't written down anywhere.**

## 3. Query Storybook for every component you'll use

The Storybook MCP needs Storybook running on `localhost:6006`. If it's down, start it with `npm run storybook -- --no-open` in the background.

- Call `docs-list` once. Then call `docs-show` for **every** component you'll use, including ones `SPEC.md` names and ones you think you already know.
- Call `get-storybook-story-instructions` before writing any story.
- Use only props that are documented or shown in a story. `SPEC.md` naming a prop isn't enough, so confirm it in the docs.
- **A prop you need is missing on a component that exists:** stop and ask (CLAUDE.md), unless `SPEC.md` marks that change **(change approved)**. This is different from a component that's missing entirely, which step 5 handles without asking.

## 4. Compose from what's in Storybook

- Storybook (`Components/*`, source in `app/components/`) is the **only** place to look for something to reuse. Most of the Figma library was never built in code. A component that exists in Figma but not in Storybook counts as missing (step 5). Don't recreate it from Figma just because it's there.
- Compose inside `Screen`: top nav in `topNavigation`, content in `middleContent`, persistent actions in `bottomContent`, and sheets in `bottomSheetOnly`. Sheets get `showBottomSheetBackground`, except the verdict sheet, which has no dim.
- Follow `design-system.md` for which component to use and how: the `ButtonGroup` two-slot cap, `MascotSlot` sizes (XL only in the loop), `ResultBtm` variants, `BottomSheetAppBar` `Default`, `AiDisclaimer` wherever AI-judged content appears, sentence case everywhere, and so on.
- Screens live in `app/screens/<ScreenName>.tsx`, with `<ScreenName>.stories.tsx` titled `Screens/<ScreenName>` and one story per state, so each state can be previewed, tested, and compared with Figma. Prototype scaffolding that isn't a design-system component (frame images, tap zones) lives in `app/_prototype/`.
- `AGENTS.md`: this Next.js version differs from what you know. Before using a Next API, read its page in `node_modules/next/dist/docs/`. For example, `next/image` uses `preload` rather than `priority`, and needs `unoptimized` for exported UI frames, since recompression blurs their text.

### Sheets over content
- **A sheet must never cover text.** Its height changes with the variant (Silence is taller) and with the phone's bottom inset, so don't reserve a fixed space. Measure the sheet with a `ResizeObserver`, pad the content by that height, and keep `space.600` between the content and the sheet. `VerdictScreen` is the pattern.
- **Long transcripts:** Overflow keeps the newest words visible and fades the oldest out. Anchor it to the bottom of the room above the sheet, and let its window shrink when that room is shorter, so the fade stays at the top.
- **Home indicator:** a sheet's bottom padding is `max(space.700, env(safe-area-inset-bottom))`. The shipped app ends its buttons exactly the inset (34pt) above the edge, with the home bar inside that space (`reference/Errorwithhomebar.PNG`). Don't add the inset on top of the padding.

### Image screens (the exam plan)
- Export frames from Figma at 3× (1170×2532) into `public/frames/`, named after the frame (`00-homescreen.png`, `01-exam.png` …).
  - The plugin can `fetch` to `localhost`. Start a small Node receiver on port 9227 in the background that writes the posted bytes, then call `node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 3 } })` in `figma_execute` and POST them.
  - Re-export whenever the user changes a frame; the images don't update themselves.
- Tap zones live in `app/_prototype/frames.ts` as boxes in Figma frame points, read off the frame's own layers. Grow any zone to at least 48pt (`space.1200`). The images render bare, not inside `Screen`, because each export draws its own status bar, tab bar and home indicator.

## 5. When something isn't in Storybook

First open `component-gaps.md` at the repo root and look for the same thing listed under another screen.

**Not on the list yet:** build it inline in this screen, styled only with tokens. Don't make a new component and don't stop to ask. Add one line:

```
- <what it is, in plain words> — for <screen number and name> — inline in <file path>
```

**Already on the list from a different screen:** build it as a real component instead.
- Put it in `app/components/<PascalName>.tsx` with a `.module.css` and a `.stories.tsx` covering every variant/state.
- Follow `get-storybook-story-instructions` and the naming rules in `design-system.md`: camelCase design name, `variant`/`size`/`state` axes, `show`-prefixed booleans.
- Add an entry for it to `design-system.md`.
- Replace the inline version in the earlier screen too, so only one definition exists.
- Update both gap lines to say `→ promoted to <PascalName>`.
- Append the new component to `sprint-context.md`.

Exception: if `SPEC.md` explicitly says to build something inline and not as a component (the loop's speech bubble, the summary rows), log it but don't promote it. If it shows up a second time, mention that in your report.

## 6. Every value comes from the generated tokens

- Colors, spacing, radii, sizes, type styles, line heights and strokes all come from `var(--…)` in `build/css/tokens.css`. Look up names in `tokens/tokens.json`.
- **Semantic tokens only** (`--color-text-primary`, `--color-background-surface`, `--font-greed-…`, `--size-space-…`). Never use a primitive such as `--color-navy-800` or `--color-violet-500`.
- No raw hex, rgb or px. No `var(--token, fallback)`. No Tailwind arbitrary values (`bg-[#…]`, `w-[…px]`).
- These aren't design values, so they're allowed:
  - Unitless `0`, `100%`, `dvh` sheet caps and `env(safe-area-inset-*)`. Existing components already use them for layout.
  - Percentages for shape geometry, such as an ellipse's `border-radius: 50%` or a `clip-path: polygon(...)` triangle.
  - Runtime measurements, such as a measured sheet height set as an inline style.
  - Exported-image geometry: frame points for tap zones, and an image's `width`/`height`.
- If no token exists for a value, use the nearest semantic token and record the substitution: in the differences list if there's a frame, or in the decisions list if not. Don't edit `tokens/tokens.json` during a screen build, and never edit `build/css/tokens.css` by hand.
- When a screen needs to change a component's look locally, use an attribute-qualified selector from the screen's stylesheet (`.area[data-x] > div > p`) so it out-ranks the component's own rule, and say why in a comment. `ResultBtm`'s `.skipButton` and `AppBar` are the precedents.
- Check before finishing: grep your new and changed files for `#[0-9a-fA-F]{3,8}` and `[0-9]px`, and make sure every `var(--…)` you used exists in `build/css/tokens.css`.

## 7. Mobile only: 390px, dark mode

- iOS only, 390px wide (`Screen`'s `iPhone 13` size), dark mode only.
- No breakpoints, no `prefers-color-scheme` or light theme, no tablet or desktop layout, no hover-only interactions.
- Tap targets and the safe area follow what `Screen` and the existing components already do.
- The app runs as a home-screen web app. The mock status bar is Figma parity for Storybook; the app passes `showStatusBar={false}`.

## 8. Build every state, including the failure ones

- Build every row of the screen's state table in `SPEC.md`, plus any state added in `sprint-context.md`. That includes the failure and recovery states, not only the happy path. Examples:
  - Silence (empty transcript, recognizer error, question-shaped answer, the 15s timeout, and a long answer that ends in Silence)
  - Interrupted and accidental tap
  - Mic off, and the gate after an earlier denial
  - `?latency=slow` and `?latency=hang`
  - Skip or close during processing
  - The summary's after-Try-again variant
- Check every state against the hard rules in `CLAUDE.md`:
  - Every idle voice turn has Skip or "Can't talk right now".
  - While recording, one tap on cancel returns to idle.
  - The transcript is shown back.
  - The verdict is pass/partial/fail.
  - No auto-endpointing.
  - The judge stays mocked.
  - No state traps the student.
  - Knowie never speaks.

## Verify

- **Tests:** run the changed story files with `npx vitest run --project=storybook <files>`, then the full suite. The Storybook MCP `test-run` has reported stale passes after CSS and story edits, so it can't be trusted on its own. Don't report done while tests fail.
  - For every new assertion, break the behaviour it checks once, make sure the test fails, then restore it.
  - Tests that click by label don't prove layout. Positions need measured assertions.
- **Measure in a real browser.** Write a small Playwright script in the scratchpad that opens `http://localhost:6006/iframe.html?id=<story-id>&viewMode=story` at 390×844, measures boxes, and takes screenshots. Look at every state's screenshot yourself, in particular:
  - text covered by a sheet
  - clipped fades
  - tap zones off their targets (outline them)
  - images that didn't load (`naturalWidth`)

  Bash's sandbox blocks `localhost`, so these runs need the sandbox disabled.
- **Lint and types:** `npm run lint` (0 errors) and `npx tsc --noEmit`.
  - React's purity rule flags `Date.now()` in functions declared during render. Use the event's `timeStamp`.
  - Story export names can't start with a digit, even when the Figma names do.
- **Previews:** `stories-preview` for every screen story and every component you created or changed. Keep the URLs.
- With a frame: compare each state's screenshot with its Figma screenshot side by side before writing the report.

## Report back

Always include:
- The states built, one per line, with their story names.
- Gap lines added to `component-gaps.md`, and any components promoted.
- Token substitutions.
- Mismatches between `SPEC.md` and `sprint-context.md`.
- Preview URLs and test/lint results.

**If the screen (or state) has a Figma frame:** list **every** difference between the build and the frame, grouped by state. Cover layout, spacing, sizes, copy, icons, component or variant choices, token substitutions, and elements added or left out. Note which differences the spec intended (for example "Send" vs "Stop") and which aren't yet explained. Don't summarise ("minor spacing tweaks"); name each one.

**If it doesn't:** list every decision you made that isn't written in `SPEC.md`, `sprint-context.md`, `Design Brief.md`, `Voice-ux.md` or `design-system.md`. Examples: layout, copy, spacing choices, which component or variant, where an action goes, what a state shows. For each one, say what you chose and why. Don't append these to `sprint-context.md` yet. They become decisions once confirmed, and then they go in the log.

**After the user reviews:** when they answer questions or change Figma, update `SPEC.md` and append the confirmed decisions to `sprint-context.md`. Don't rewrite earlier log entries; add a new one, and note corrections as corrections. Then stop again before the next screen.
