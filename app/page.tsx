import { ExamPlanFlow } from '@/app/screens/ExamPlanScreen';

// The prototype starts on 00Homescreen (sprint-context.md, 2026-09-14).
// Node taps and the facilitator's log entry aren't wired yet: the gate
// (SPEC.md screen 6) and /log (screen 2) aren't built.
export default function Home() {
  return (
    <main>
      <ExamPlanFlow />
    </main>
  );
}
