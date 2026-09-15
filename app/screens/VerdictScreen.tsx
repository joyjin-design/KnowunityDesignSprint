'use client';

import { useLayoutEffect, useRef, useState, type ComponentProps } from 'react';
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { AiDisclaimer } from '@/app/components/AiDisclaimer';
import { AppBar } from '@/app/components/AppBar';
import { MascotSlot } from '@/app/components/MascotSlot';
import { ProgressIndicator } from '@/app/components/ProgressIndicator';
import { ResultBtm } from '@/app/components/ResultBtm';
import { Screen } from '@/app/components/Screen';
import { TranscriptDisplay } from '@/app/components/TranscriptDisplay';
import { toResultVariant, type Verdict } from '@/lib/recall/types';
import styles from './VerdictScreen.module.css';

/** What the sheet is showing: a judge verdict, or the Silence recovery. */
export type VerdictOutcome = Verdict | 'Silence';

type Progress = ComponentProps<typeof ProgressIndicator>['progress'];

export interface VerdictScreenProps {
  outcome: VerdictOutcome;
  /** The question, as written in content/voice-recall-questions.md. */
  question: string;
  /** The student's transcript. Empty when nothing was heard. */
  transcript: string;
  /**
   * Counts every question with a verdict, including this one: it moves when
   * the verdict appears. Silence doesn't move it.
   */
  progress: Progress;
  /** Figma parity in Storybook; the app passes false on the test iPhone. */
  showStatusBar?: boolean;
  /** Close: leaves the session for the exam plan (03VoicerecallON). */
  onClose?: () => void;
  /** Pass, Partial and Fail: Why? sheet. */
  onWhy?: () => void;
  /** Pass, Partial and Fail: next question, or the summary after the last. */
  onContinue?: () => void;
  /** Silence: back to recording. */
  onReRecord?: () => void;
  /** Silence: the typing placeholder. */
  onTypeInstead?: () => void;
  /** Silence: next question. */
  onSkip?: () => void;
}

const SHEET_LABEL: Record<VerdictOutcome, string> = {
  Pass: 'Result: pass',
  Partial: 'Result: partial',
  Fail: 'Result: incorrect',
  Silence: "Result: didn't catch it",
};

/**
 * SPEC.md screen 1: the verdict sheet over the loop screen, as the loop looks
 * right after Send (Figma 10End, Partial, Incorrect, Silence 13659:3542).
 * The loop screen itself is screen 10; this composes only the parts visible
 * behind the sheet. There's no dim, so the transcript reads clearly and close
 * stays in reach.
 */
export function VerdictScreen({
  outcome,
  question,
  transcript,
  progress,
  showStatusBar = true,
  onClose,
  onWhy,
  onContinue,
  onReRecord,
  onTypeInstead,
  onSkip,
}: VerdictScreenProps) {
  // The sheet floats over the content, and its height changes with the
  // variant (Silence is taller) and the phone's bottom inset. The content
  // stops above it, so the sheet never covers the transcript.
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetHeight, setSheetHeight] = useState(0);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const measure = () => setSheetHeight(sheet.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sheet);
    return () => observer.disconnect();
  }, []);

  return (
    <Screen
      showStatusBar={showStatusBar}
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
        // Measured sheet height, not a design value.
        <div className={styles.content} style={{ paddingBottom: sheetHeight }}>
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
          <Transcript transcript={transcript} />
        </div>
      }
      bottomSheetOnly={
        <div ref={sheetRef} role="dialog" aria-label={SHEET_LABEL[outcome]}>
          <ResultBtm
            variant={toResultVariant(outcome)}
            onWhy={onWhy}
            onContinue={onContinue}
            onReRecord={onReRecord}
            onTypeInstead={onTypeInstead}
            onSkip={onSkip}
          />
        </div>
      }
    />
  );
}

/** Static "⚡2", never counts (XP is out of scope). */
function XpChip() {
  return (
    <span className={styles.xpChip} role="img" aria-label="2 XP">
      <Lightning className={styles.xpIcon} aria-hidden="true" />
      <span aria-hidden="true">2</span>
    </span>
  );
}

/**
 * Nothing heard → nothing behind the sheet: Empty's "I'm listening…" would
 * contradict "Didn't catch it" (decided 2026-09-15). Otherwise Filled, and
 * Overflow once the text doesn't fit, either past Overflow's window or past
 * the room left above the sheet. Overflow is anchored to the bottom of that
 * room, so the newest words always stay clear of the sheet and the oldest
 * fade off the top.
 */
function Transcript({ transcript }: { transcript: string }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const heard = transcript.trim() !== '';

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area || !heard) return;
    const measure = () => {
      const text = area.querySelector('p');
      if (!text) return;
      // Height of the text itself, the same in either state.
      const range = document.createRange();
      range.selectNodeContents(text);
      const textHeight = range.getBoundingClientRect().height;
      const css = getComputedStyle(area);
      // Room inside the area, less Filled's own top padding. The window is
      // TranscriptDisplay's own token, read from CSS so the two never drift.
      const room =
        area.clientHeight -
        parseFloat(css.paddingTop) -
        parseFloat(css.paddingBottom) -
        parseFloat(css.getPropertyValue('--size-space-600'));
      const window = parseFloat(css.getPropertyValue('--size-illustration-4000'));
      setOverflowing(textHeight > Math.min(window, room));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    return () => observer.disconnect();
  }, [transcript, heard]);

  if (!heard) return null;

  return (
    <div ref={areaRef} className={styles.transcriptArea} data-overflowing={overflowing || undefined}>
      <TranscriptDisplay state={overflowing ? 'Overflow' : 'Filled'} transcript={transcript} />
    </div>
  );
}
