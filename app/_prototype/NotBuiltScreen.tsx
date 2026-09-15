'use client';

import { Button } from '@/app/components/Button';
import { Screen, type ScreenProps } from '@/app/components/Screen';
import { TextBlock } from '@/app/components/TextBlock';
import styles from './NotBuiltScreen.module.css';

export interface NotBuiltScreenProps {
  /** Names what's missing, e.g. "The voice recall loop isn't in this prototype yet." */
  caption: string;
  showStatusBar?: ScreenProps['showStatusBar'];
  /** Leaves for the exam plan (03VoicerecallON). */
  onBack?: () => void;
}

/**
 * Temporary stop where the flow reaches a screen that isn't built yet (the
 * loop, the Why? sheet). Prototype scaffolding, not a SPEC.md screen: delete
 * each use as its real screen lands. Its one button keeps the student from
 * being trapped.
 */
export function NotBuiltScreen({ caption, showStatusBar = true, onBack }: NotBuiltScreenProps) {
  return (
    <Screen
      showStatusBar={showStatusBar}
      middleContent={
        <div className={styles.content}>
          <TextBlock className={styles.textBlock} variant="L" title="Not built yet" caption={caption} />
        </div>
      }
      bottomContent={
        <Button variant="Primary" size="L" onClick={onBack}>
          Back to exam plan
        </Button>
      }
    />
  );
}
