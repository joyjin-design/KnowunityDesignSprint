'use client';

import { useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { AiDisclaimer } from '@/app/components/AiDisclaimer';
import { AppBar } from '@/app/components/AppBar';
import { BottomSheet } from '@/app/components/BottomSheet';
import { Button } from '@/app/components/Button';
import { MascotSlot } from '@/app/components/MascotSlot';
import { ProgressIndicator } from '@/app/components/ProgressIndicator';
import { Screen, type ScreenProps } from '@/app/components/Screen';
import { TranscriptDisplay } from '@/app/components/TranscriptDisplay';
import type { Verdict } from '@/lib/recall/types';
import styles from './WhyScreen.module.css';

type Progress = ComponentProps<typeof ProgressIndicator>['progress'];

export interface WhyScreenProps {
  /** Figma parity in Storybook; the app passes false on the test iPhone. */
  showStatusBar?: ScreenProps['showStatusBar'];
  outcome: Verdict;
  /** The question, as written in content/voice-recall-questions.md. */
  question: string;
  /** The student's transcript that earned this verdict. */
  transcript: string;
  /** Same meaning as VerdictScreen's own progress prop. */
  progress: Progress;
  /** The authored explanation (content/voice-recall-questions.md), with the
   * concepts the judge found missing already marked bold by the caller —
   * Success has nothing missing, so nothing's bold there. */
  explanation: ReactNode;
  /** Leaves the session for the exam plan (03VoicerecallON), same as
   * VerdictScreen's own close — this sheet can't be dragged or backdrop-
   * dismissed, but the screen's usual way out stays available. */
  onClose?: () => void;
  /** The only way out of the sheet itself: next question, or the summary. */
  onGotIt?: () => void;
}

// Got it's own accent fill, on your call (2026-09-15) — not one of Button's
// own variants (its real master, Figma 4871:29884, binds interactive/primary
// instead), so a local style override, the same mechanism ResultBtm's own
// ACTION_COLOR already uses for a non-standard fill.
const GOT_IT_COLOR: CSSProperties = {
  background: 'var(--color-accent-coral-bold)',
  color: 'var(--color-accent-coral-on-bold)',
};

/**
 * SPEC.md screen 7: the Why? explanation sheet, reached from ResultBtm's own
 * Why? button. No Figma frame yet; modelled on `reference/TapWhy?.PNG`.
 * Reconstructs the same behind-the-sheet look as VerdictScreen (screen 1) —
 * screen 10, the loop itself, isn't built — with the Why sheet in place of
 * ResultBtm.
 */
export function WhyScreen({
  showStatusBar = true,
  outcome,
  question,
  transcript,
  progress,
  explanation,
  onClose,
  onGotIt,
}: WhyScreenProps) {
  // Same anti-cover discipline as every other sheet: measure Got it + sheet
  // together, and stop the content above it.
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
        <div ref={sheetRef} className={styles.sheetWrap}>
          {/* Got it floats above the sheet with a gap, matching
              reference/Quiz-Why-explanation.png — it doesn't overlap the
              sheet at all there, unlike the gate's own peeking mascot, so
              there's no negative-margin overlap to reconcile with the
              measured height here. Knowie normally sits in this row too,
              tucked behind the sheet the way that reference shows (and the
              gate's own mascot sits behind its buttons) — hidden for now,
              on your call (2026-09-15). */}
          <div className={styles.peek}>
            <Button variant="Primary" size="S" style={GOT_IT_COLOR} onClick={onGotIt} className={styles.gotIt}>
              Got it
            </Button>
          </div>
          <BottomSheet
            aria-label={`Why: ${SHEET_LABEL[outcome]}`}
            // BottomSheetAppBar's own Default variant reserves a fixed
            // space.1600 (64px) zone even with no title/caption to show —
            // sized for its title variants, not a bare handle. That's most
            // of "a lot of padding at the top" you flagged, so a plain
            // handle is built inline instead, same token values as the
            // real one (BottomSheetAppBar.module.css's own `.handle`).
            appBar={
              <div className={styles.sheetHandleZone}>
                <span className={styles.sheetHandle} aria-hidden="true" />
              </div>
            }
            middleSection={<p className={styles.explanation}>{explanation}</p>}
          />
        </div>
      }
    />
  );
}

const SHEET_LABEL: Record<Verdict, string> = {
  Pass: 'result: pass',
  Partial: 'result: partial',
  Fail: 'result: incorrect',
};

/** Static "⚡2", never counts (XP is out of scope). Same markup as
 * VerdictScreen's own — not promoted, per that screen's own exception. */
function XpChip() {
  return (
    <span className={styles.xpChip} role="img" aria-label="2 XP">
      <Lightning className={styles.xpIcon} aria-hidden="true" />
      <span aria-hidden="true">2</span>
    </span>
  );
}

/** Same overflow-safe reconstruction as VerdictScreen's own Transcript —
 * Why? is always reached from an actual verdict, so a transcript is always
 * heard, but the room above this sheet is often shorter (Got it's own row
 * adds to what the sheet itself takes), so a longer answer is just as likely
 * to need Overflow here. */
function Transcript({ transcript }: { transcript: string }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const measure = () => {
      const text = area.querySelector('p');
      if (!text) return;
      const range = document.createRange();
      range.selectNodeContents(text);
      const textHeight = range.getBoundingClientRect().height;
      const css = getComputedStyle(area);
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
  }, [transcript]);

  return (
    <div ref={areaRef} className={styles.transcriptArea} data-overflowing={overflowing || undefined}>
      <TranscriptDisplay state={overflowing ? 'Overflow' : 'Filled'} transcript={transcript} />
    </div>
  );
}
