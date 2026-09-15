'use client';

import { useRouter } from 'next/navigation';
import { ExamPlanFlow } from '@/app/screens/ExamPlanScreen';

// The prototype starts on 00Homescreen (sprint-context.md, 2026-09-14).
// Node taps aren't wired yet: the gate (SPEC.md screen 6) isn't built.
export default function Home() {
  const router = useRouter();
  return (
    <main>
      <ExamPlanFlow onOpenLog={() => router.push('/log')} />
    </main>
  );
}
