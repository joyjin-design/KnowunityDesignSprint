---
name: build-screen
description: Use when building or editing any screen in the Knowunity voice recall prototype. That means the verdict sheet, turn log, homescreen/exam plan images, typing placeholder, mic-off sheet, gate, Why? sheet, summary sheet, the voice recall loop, or any new state of one of them. Covers finding out whether the screen has a Figma frame, composing only from Storybook components, logging component gaps, token-only styling, and the end-of-build report.
---

# Build a screen

A screen here is a composition of existing Storybook components inside `Screen`. It is not a new component. Follow the steps in order. Don't skip the Figma check or the Storybook queries, even when the answer seems obvious.

## 1. Read the spec for this screen

- Find the screen's section in `SPEC.md` ("Screens, in build order"). Note every state in its table or list, the components and props it names, and what each action leads to.
- Read `sprint-context.md`. **If it disagrees with `SPEC.md`, the log wins.** Build to the log and mention the mismatch in your report.
- If the screen shows questions, transcripts or verdicts, read `content/voice-recall-questions.md`. Never make up question copy.
- Check "Out of scope" and "Open" in `SPEC.md`. Don't build an out-of-scope state. If an Open item affects this screen, build the option the spec leans toward and include it in your report.
- If `SPEC.md` marks the screen as blocked (screen 10 is blocked on Verification step 0, the spike), check `sprint-context.md` for the spike results. If they aren't logged, stop and say so.
- Props marked **(change approved)** in `SPEC.md` are the only changes you may make to an existing component's props.

## 2. Check whether the screen has a Figma frame

This decides how you work and what you report at the end.

- Figma file: Yummy-Knowie Design System, `VF5OpIZyDTe8ML0YITnjPe`. Page "Design the core flow", section "Design for voice recall first run experience".
- Start with the `Figma:` node IDs in the screen's `SPEC.md` section. As of 2026-09-14:
  - **Has frames:** 1 Verdict sheet, 3 Homescreen/exam plan (exported images with tap zones, not composed), 6 Gate, and 10 Voice recall loop (one frame per state).
  - **No frame:** 2 Turn log, 4 Typing placeholder, 5 Mic-off sheet, 7 Why? sheet, 8 Summary sheet.
  - 9 appBar is already built as `AppBar`.
- Don't trust that list alone. Check Figma through the `figma-console` MCP. Run `figma_get_status` first, since it needs Figma desktop open with the Desktop Bridge plugin. Then open the node IDs. For a "no frame" screen, look through the section in case a frame has been added since.
- A frame can cover only some states. The loop has frames for Starting, Talking, Talking-finished and Thinking, but none for Interrupted, Accidental tap or Still listening. Treat each state on its own: states with a frame follow the frame path, the rest follow the no-frame path.
- Some frame details were deliberately overruled in `SPEC.md`: "Send" vs "Stop", the gate's dropped permission sheet, and the Figma follow-ups list. The spec wins. Still list each one as a difference.
- **If the screen has a frame but Figma isn't reachable, stop and say so.** You can't match a frame you can't see.

**With a frame:** screenshot each frame (`figma_capture_screenshot`) and read its structure, including which components and variants it uses, spacing, and which variables are bound. Keep those notes for the final comparison.

**Without a frame:** before designing any behaviour, read `Design Brief.md` (especially "Hard constraints" and "Your mandate") and `Voice-ux.md` (the six principles and "States to design"). Use `reference/` screenshots for what the shipped app looks like today. `SPEC.md` names a specific reference for some screens, such as `reference/TapWhy?.PNG` for the Why? sheet. When nothing covers a case, the default from `Voice-ux.md` applies: don't trap the student; offer Skip or a way back. **Keep a running list of every decision you make that isn't written down anywhere.**

## 3. Query Storybook for every component you'll use

The Storybook MCP needs Storybook running on `localhost:6006` (`npm run storybook`).

- Call `docs-list` once. Then call `docs-show` for **every** component you'll use, including ones `SPEC.md` names and ones you think you already know.
- Call `get-storybook-story-instructions` before writing any story.
- Use only props that are documented or shown in a story. `SPEC.md` naming a prop isn't enough, so confirm it in the docs.
- **A prop you need is missing on a component that exists:** stop and ask (CLAUDE.md), unless `SPEC.md` marks that change **(change approved)**. This is different from a component that's missing entirely, which step 5 handles without asking.

## 4. Compose from what's in Storybook

- Storybook (`Components/*`, source in `app/components/`) is the **only** place to look for something to reuse. Most of the Figma library was never built in code. A component that exists in Figma but not in Storybook counts as missing (step 5). Don't recreate it from Figma just because it's there.
- Compose inside `Screen`: top nav in `topNavigation`, content in `middleContent`, persistent actions in `bottomContent`, and sheets in `bottomSheetOnly` with `showBottomSheetBackground`.
- Follow `design-system.md` for which component to use and how: the `ButtonGroup` two-slot cap, `MascotSlot` sizes (XL only in the loop), `ResultBtm` variants, `BottomSheetAppBar` `Default`, `AiDisclaimer` wherever AI-judged content appears, sentence case everywhere, and so on.
- Where screen code lives: follow wherever earlier screens were put. If this is the first screen, use `app/screens/<ScreenName>.tsx` and include that location in your report as a decision. Give every screen a `<ScreenName>.stories.tsx` titled `Screens/<ScreenName>`, with one story per state, so each state can be previewed, tested, and compared with Figma.

## 5. When something isn't in Storybook

First open `component-gaps.md` at the repo root (create it if it doesn't exist; format below) and look for the same thing listed under another screen.

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
- Unitless `0`, `100%`, `dvh` sheet caps and `env(safe-area-inset-*)` are allowed. Existing components already use them for layout.
- If no token exists for a value, use the nearest semantic token and record the substitution: in the differences list if there's a frame, or in the decisions list if not. Don't edit `tokens/tokens.json` during a screen build, and never edit `build/css/tokens.css` by hand.
- Check before finishing: grep your new and changed files for `#[0-9a-fA-F]{3,8}` and `[0-9]px`, and make sure every `var(--…)` you used exists in `build/css/tokens.css`.

## 7. Mobile only: 390px, dark mode

- iOS only, 390px wide (`Screen`'s `iPhone 13` size), dark mode only.
- No breakpoints, no `prefers-color-scheme` or light theme, no tablet or desktop layout, no hover-only interactions.
- Tap targets and the safe area follow what `Screen` and the existing components already do.

## 8. Build every state, including the failure ones

- Build every row of the screen's state table in `SPEC.md`, plus any state added in `sprint-context.md`. That includes the failure and recovery states, not only the happy path. Examples:
  - Silence (empty transcript, recognizer error, question-shaped answer, the 15s timeout)
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

- `stories-preview` for every screen story and every component you created or changed. Keep the URLs.
- `test-run` (the Storybook MCP, never a package.json script): focused while iterating, then a full run. Don't report done while tests fail.
- `npm run lint` and `npx tsc --noEmit`.
- With a frame: compare each state's story with its Figma screenshot side by side before writing the report.

## Report back

Always include:
- The states built, one per line, with their story names.
- Gap lines added to `component-gaps.md`, and any components promoted.
- Token substitutions.
- Mismatches between `SPEC.md` and `sprint-context.md`.
- Preview URLs and test/lint results.

**If the screen (or state) has a Figma frame:** list **every** difference between the build and the frame, grouped by state. Cover layout, spacing, sizes, copy, icons, component or variant choices, token substitutions, and elements added or left out. Note which differences the spec intended (for example "Send" vs "Stop") and which aren't yet explained. Don't summarise ("minor spacing tweaks"); name each one.

**If it doesn't:** list every decision you made that isn't written in `SPEC.md`, `sprint-context.md`, `Design Brief.md`, `Voice-ux.md` or `design-system.md`. Examples: layout, copy, spacing choices, which component or variant, where an action goes, what a state shows. For each one, say what you chose and why. Don't append these to `sprint-context.md` yet. They become decisions once confirmed, and then they go in the log.
