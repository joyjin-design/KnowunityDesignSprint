import { LogPage } from '@/app/screens/LogScreen';

// SPEC.md screen 2: hidden facilitator route, never linked from the student
// flow. Reached by triple-tapping 00Homescreen's top-left corner
// (app/_prototype/frames.ts, "facilitator-log" zone) — wired in app/page.tsx.
export default function Log() {
  return <LogPage />;
}
