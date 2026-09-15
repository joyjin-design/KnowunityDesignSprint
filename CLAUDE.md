@AGENTS.md

## What this is

A design prototype for a voice-based active-recall step in Knowunity's exam plan.

## Hard rules

- Mobile iOS only, dark mode only, 390px width. No other platform/size.
- Voice in, text out. Knowie never speaks.
- Push-to-talk with explicit send. No auto-endpointing.
- Every required action has a way out (skip, text fallback, or cancel/re-record).
- Every idle voice turn has a one-tap way out: Skip (next question), or "Can't talk right now" (back to the exam plan). While recording those are hidden; cancel returns to idle in one tap. The typing turn is out of scope this sprint.
- Verdict is pass / partial / fail, never binary.
- Transcript is always shown back to the student.
- Judging is mocked (an on-device keyword judge). Transcripts come from the browser's built-in recognizer (`webkitSpeechRecognition`); no custom STT engine.
- Any color, size, weight, or line height comes from `tokens/tokens.json`. Never invent one.
- Component usage, states, and naming follow `design-system.md` exactly.
- Build from the components that already exist, and stop before making a new one. Only add a new component if `design-system.md` has no existing match for the need.
- Append every new decision to `sprint-context.md` as it's made.

## Never

- Never add auto-endpointing or continuous listening.
- Never branch a recall answer into tutoring/open conversation.
- Never build a custom speech-to-text engine or real (model-based) judging. The browser's built-in recognizer is the only STT allowed.
- Never trap the student with no way forward.
- Never touch `AGENTS.md` or remove the block inside it.

## Storybook

When working on UI, use the storybook tools to read the component library before answering or writing anything. Never assume a component prop exists. Query the documentation, and use only props that are documented or shown in a story. If a prop isn't there, stop and ask me.

## File map

- `AGENTS.md` — Next.js version/agent rules.
- `Design Brief.md` — the feature brief: problem, bet, hard constraints, what's open vs. fixed. Read before any product/UX decision.
- `Voice-ux.md` — voice-UX principles and the states-to-design checklist. Read before designing the recall loop or any voice screen.
- `SPEC.md` — build spec for the voice recall prototype: screens in build order, states, components, mock behaviour, verification, open items. Read before building any recall screen.
- `content/voice-recall-questions.md` — the 8 draft biology questions: concepts, synonyms, mis-hearings, explanations and sample answers the mock judge and verification use.
- `sprint-context.md` — committed decisions log for this sprint. Read before changing exam-plan/toggle/node behavior.
- `voice-recall-interview-2026-09-14.csv` — every question, option and answer from the recall-loop design interview, with which answers were later changed. `sprint-context.md` holds the resulting decisions.
- `design-system.md` — component rules: which component to use, its states, and naming conventions. Read before building or editing any UI component.
- `tokens/tokens.json` — all actual color/size/weight/line-height values. Read when a token name is needed.
- `tokens/style-dictionary.config.mjs` — Style Dictionary config; turns `tokens/tokens.json` into `build/css/tokens.css`. Read only when changing how tokens build.
- `build/css/tokens.css` — generated CSS variables, imported by `app/globals.css`. Never edit it by hand; edit `tokens/tokens.json` and run `npm run tokens` instead.
- `reference/` — screenshots of Knowunity's existing shipped beta. Read to see what exists today.
- `app/page.tsx` — main screen entry point.
- `app/layout.tsx` — root layout, fonts, metadata.
- `app/globals.css` — global styles/Tailwind import.
- `public/images/` — mascot expression icons (svg).
- `public/prototypes/show-me-hint/` — standalone HTML preview comparing two "Show me" hint animations (Knowie bounce vs lined arrow), built over exported Figma frames. Not part of the Next app.
- `public/` (other svgs) — create-next-app default assets.
- `package.json` / `tsconfig.json` / `next.config.ts` / `eslint.config.mjs` / `postcss.config.mjs` — standard Next.js/TS/lint/build config, read only when changing tooling.
- `README.md` — project readme.
