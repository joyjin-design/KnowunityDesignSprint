import { PrototypeFlow } from '@/app/_prototype/PrototypeFlow';
import { reviewScreen } from '@/app/_prototype/reviewScreens';
import styles from '@/app/_prototype/DeviceFrame.module.css';

// The prototype starts on 00Homescreen (sprint-context.md, 2026-09-14), or on
// one screen via a `?screen=` review link (app/_prototype/reviewScreens.ts).
// With a mouse or trackpad it's shown inside a 390×844 phone frame with a
// mock status bar; on a phone the wrapper does nothing (DeviceFrame.module.css).
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const start = reviewScreen((await searchParams).screen);
  return (
    <div className={styles.stage}>
      <main className={styles.device}>
        {/* Mock device chrome, not content — hidden from assistive tech, the
            same way Screen's own mock status bar is. */}
        <div className={styles.statusBar} aria-hidden="true">
          <div className={styles.statusBarRow}>
            <span className={styles.time}>09:41</span>
          </div>
        </div>
        <PrototypeFlow
          initialView={start.view}
          initialMic={start.mic}
          initialSession={start.session}
          initialLastTurn={start.lastTurn}
        />
      </main>
    </div>
  );
}
