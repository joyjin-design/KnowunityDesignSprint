'use client';

import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { AiDisclaimer } from '@/app/components/AiDisclaimer';
import { AppBar } from '@/app/components/AppBar';
import { BottomSheet } from '@/app/components/BottomSheet';
import { BottomSheetAppBar } from '@/app/components/BottomSheetAppBar';
import { Button } from '@/app/components/Button';
import { ButtonGroup } from '@/app/components/ButtonGroup';
import { ButtonIcon } from '@/app/components/ButtonIcon';
import { MascotSlot } from '@/app/components/MascotSlot';
import { ProgressIndicator } from '@/app/components/ProgressIndicator';
import { Screen, type ScreenProps } from '@/app/components/Screen';
import { TranscriptDisplay } from '@/app/components/TranscriptDisplay';
import styles from './MicOffScreen.module.css';

type Progress = 0 | 25 | 50 | 75 | 100;

export interface MicOffScreenProps {
  /** The question, as written in content/voice-recall-questions.md. Mic off
   * happens right after tapping Start from idle, so the question underneath
   * is whichever one the student was on. */
  question: string;
  progress: Progress;
  /** Figma parity in Storybook; the app passes false on the test iPhone. */
  showStatusBar?: ScreenProps['showStatusBar'];
  /** Close: leaves the session for 03VoicerecallON. */
  onClose?: () => void;
  /** Typing placeholder. */
  onTypeInstead?: () => void;
  /** Next question. */
  onSkip?: () => void;
}

/* Same transcription ResultBtm's Silence variant and the typing placeholder
   already use for their own Skip button — kept visually consistent. */
function SkipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" aria-hidden="true">
      <g transform="translate(4, 4)">
        <path
          d="M 14 15 L 14 1 C 14 0.45 14.45 0 15 0 C 15.55 0 16 0.45 16 1 L 16 15 C 16 15.55 15.55 16 15 16 C 14.45 16 14 15.55 14 15 Z M 2 0.08 C 2.49 0.08 2.89 0.31 3.17 0.5 C 3.47 0.69 3.82 0.98 4.22 1.3 L 10.06 5.97 C 10.32 6.17 10.56 6.36 10.74 6.54 C 10.93 6.72 11.15 6.96 11.27 7.3 C 11.44 7.75 11.44 8.25 11.27 8.7 C 11.15 9.04 10.93 9.28 10.74 9.46 C 10.56 9.64 10.32 9.83 10.06 10.03 L 4.22 14.7 C 3.82 15.02 3.47 15.31 3.17 15.5 C 2.89 15.69 2.49 15.92 2 15.92 C 1.39 15.92 0.82 15.64 0.44 15.17 C 0.13 14.79 0.06 14.33 0.03 13.99 C -0 13.64 0 13.18 0 12.67 L 0 3.33 C 0 2.82 -0 2.36 0.03 2.01 C 0.06 1.67 0.13 1.21 0.44 0.83 C 0.82 0.36 1.39 0.08 2 0.08 Z M 2 12.67 C 2 13.22 2 13.57 2.02 13.81 C 2.02 13.83 2.03 13.84 2.03 13.86 C 2.04 13.85 2.06 13.84 2.07 13.83 C 2.27 13.7 2.54 13.48 2.97 13.14 L 8.81 8.47 C 9.09 8.24 9.25 8.12 9.36 8.01 C 9.37 8.01 9.37 8 9.37 8 C 9.37 8 9.37 7.99 9.36 7.99 C 9.25 7.88 9.09 7.76 8.81 7.53 L 2.97 2.86 C 2.54 2.52 2.27 2.3 2.07 2.17 C 2.06 2.16 2.04 2.15 2.03 2.14 C 2.03 2.16 2.02 2.17 2.02 2.19 C 2 2.43 2 2.78 2 3.33 L 2 12.67 Z"
          fill="currentColor"
          fillRule="nonzero"
        />
      </g>
    </svg>
  );
}

/** Static "⚡2", never counts (XP is out of scope). Duplicated from
 * VerdictScreen — see this screen's decisions in the build report. */
function XpChip() {
  return (
    <span className={styles.xpChip} role="img" aria-label="2 XP">
      <Lightning className={styles.xpIcon} aria-hidden="true" />
      <span aria-hidden="true">2</span>
    </span>
  );
}

/**
 * SPEC.md screen 5: shown when the student taps Start but mic permission has
 * since been revoked. No Figma frame at build time; a reference mockup was
 * added afterward ("Permission ask (invented — no system equivalent)",
 * 13666:3837) and this was revised to match it — see the build report for
 * what changed and why. Composes the loop's Idle look behind the sheet
 * (screen 10 isn't built yet) — the tap never reaches Recording, so nothing
 * behind the sheet changes from Idle. Same inline mascot/bubble pattern as
 * VerdictScreen (screen 1), duplicated rather than promoted: SPEC.md's
 * screen 10 says to keep it inline, not as a component.
 */
export function MicOffScreen({
  question,
  progress,
  showStatusBar = true,
  onClose,
  onTypeInstead,
  onSkip,
}: MicOffScreenProps) {
  return (
    <Screen
      showStatusBar={showStatusBar}
      showBottomSheetBackground
      topNavigation={
        <AppBar
          variant="leftIconButtonOnly"
          leftIcon={<X size="100%" aria-hidden="true" />}
          leftLabel="Close"
          onLeftClick={onClose}
          slot={
            <>
              <ProgressIndicator thickness="16" progress={progress} />
              <XpChip />
            </>
          }
        />
      }
      middleContent={
        <div className={styles.content}>
          <div className={styles.knowie}>
            <div className={styles.questionRow}>
              <div className={styles.mascot}>
                <span className={styles.mascotShadow} aria-hidden="true" />
                <MascotSlot size="XL" expression="standby" className={styles.mascotArt} />
              </div>
              <div className={styles.bubble}>
                <span className={styles.bubbleTail} aria-hidden="true" />
                <p className={styles.bubbleText}>{question}</p>
              </div>
            </div>
            <AiDisclaimer />
          </div>
          <TranscriptDisplay state="Empty" />
        </div>
      }
      bottomSheetOnly={
        <BottomSheet
          aria-label="Your mic is off"
          appBar={
            <BottomSheetAppBar
              variant="withTitle"
              title="Your mic is off"
              caption="Open Settings, find Voice recall, then turn on Microphone."
              showCaption
            />
          }
          bottomSection={
            <ButtonGroup variant="Horizontal" size="L">
              <ButtonIcon
                variant="Secondary"
                size="L"
                icon={<SkipIcon />}
                aria-label="Skip"
                className={styles.skipButton}
                onClick={onSkip}
              />
              <Button variant="Primary" size="L" onClick={onTypeInstead}>
                Type instead
              </Button>
            </ButtonGroup>
          }
        />
      }
    />
  );
}
