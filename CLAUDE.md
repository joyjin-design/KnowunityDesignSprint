@AGENTS.md

## What this is

A design prototype for a voice-based active-recall step in Knowunity's exam plan.

## Hard rules

- Mobile iOS only, dark mode only, 390px width. No other platform/size.
- Voice in, text out. Knowie never speaks.
- Push-to-talk with explicit send. No auto-endpointing.
- Every required action has a way out (skip, text fallback, or cancel/re-record).
- Text fallback reachable in one tap on every voice turn.
- Verdict is pass / partial / fail, never binary.
- Transcript is always shown back to the student.
- The recall engine (STT + judging) is mocked, not real.
- Any color, size, weight, or line height comes from `tokens/tokens.json`. Never invent one.
- Component usage, states, and naming follow `design-system.md` exactly.
- Build from the components that already exist, and stop before making a new one. Only add a new component if `design-system.md` has no existing match for the need.
- Append every new decision to `sprint-context.md` as it's made.

## Never

- Never add auto-endpointing or continuous listening.
- Never branch a recall answer into tutoring/open conversation.
- Never build real speech-to-text or real judging.
- Never trap the student with no way forward.
- Never touch `AGENTS.md` or remove the block inside it.

## File map

- `AGENTS.md` — Next.js version/agent rules.
- `Design Brief.md` — the feature brief: problem, bet, hard constraints, what's open vs. fixed. Read before any product/UX decision.
- `Voice-ux.md` — voice-UX principles and the states-to-design checklist. Read before designing the recall loop or any voice screen.
- `sprint-context.md` — committed decisions log for this sprint. Read before changing exam-plan/toggle/node behavior.
- `design-system.md` — component rules: which component to use, its states, and naming conventions. Read before building or editing any UI component.
- `tokens/tokens.json` — all actual color/size/weight/line-height values. Read when a token name is needed.
- `tokens/style-dictionary.config.mjs` — Style Dictionary config; turns `tokens/tokens.json` into `build/css/tokens.css`. Read only when changing how tokens build.
- `build/css/tokens.css` — generated CSS variables. Never edit by hand; regenerate with `npm run tokens`.
- `reference/` — screenshots of Knowunity's existing shipped beta. Read to see what exists today.
- `app/page.tsx` — main screen entry point.
- `app/layout.tsx` — root layout, fonts, metadata.
- `app/globals.css` — global styles/Tailwind import.
- `public/images/` — mascot expression icons (svg).
- `public/` (other svgs) — create-next-app default assets.
- `package.json` / `tsconfig.json` / `next.config.ts` / `eslint.config.mjs` / `postcss.config.mjs` — standard Next.js/TS/lint/build config, read only when changing tooling.
- `README.md` — project readme.
