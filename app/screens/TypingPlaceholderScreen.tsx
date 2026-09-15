'use client';

import { Button } from '@/app/components/Button';
import { Screen, type ScreenProps } from '@/app/components/Screen';
import { TextBlock } from '@/app/components/TextBlock';
import styles from './TypingPlaceholderScreen.module.css';

export interface TypingPlaceholderScreenProps {
  /** Figma parity in Storybook; the app passes false on the test iPhone. */
  showStatusBar?: ScreenProps['showStatusBar'];
  /** Leaves the session for the exam plan (01Exam), by your 2026-09-15
   * review call — not idle for the same question, since typing has nothing
   * to come back to. */
  onBackToVoice?: () => void;
}

/**
 * SPEC.md screen 4: the typing turn is out of scope this sprint, so "Try
 * typing instead" (Silence sheet) and "Type instead" (mic-off sheet) both
 * land here instead of a real text input. No Figma frame; layout and copy
 * are marked Open in SPEC.md, built as this session's best guess.
 *
 * No Skip button, by your 2026-09-15 review call: Back to voice is the
 * screen's only action, and it already leaves the session, so nothing
 * traps the student without it.
 */
export function TypingPlaceholderScreen({ showStatusBar = true, onBackToVoice }: TypingPlaceholderScreenProps) {
  return (
    <Screen
      showStatusBar={showStatusBar}
      middleContent={
        <div className={styles.content}>
          <TextBlock
            className={styles.textBlock}
            variant="L"
            title="Typing isn't part of this prototype"
            caption="This build is voice only. Go back to the exam plan to try again by voice."
          />
        </div>
      }
      bottomContent={
        <Button variant="Primary" size="L" onClick={onBackToVoice}>
          Back to voice
        </Button>
      }
    />
  );
}
