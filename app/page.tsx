import { PrototypeFlow } from '@/app/_prototype/PrototypeFlow';
import { reviewScreen } from '@/app/_prototype/reviewScreens';

// The prototype starts on 00Homescreen (sprint-context.md, 2026-09-14), or on
// one screen via a `?screen=` review link (app/_prototype/reviewScreens.ts).
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const start = reviewScreen((await searchParams).screen);
  return (
    <main>
      <PrototypeFlow
        initialView={start.view}
        initialMic={start.mic}
        initialSession={start.session}
        initialLastTurn={start.lastTurn}
      />
    </main>
  );
}
