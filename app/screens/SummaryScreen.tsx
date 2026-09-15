'use client';

import type { ReactNode } from 'react';
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning';
import { Target } from '@phosphor-icons/react/dist/csr/Target';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { AppBar } from '@/app/components/AppBar';
import { Button } from '@/app/components/Button';
import { ButtonGroup } from '@/app/components/ButtonGroup';
import { MascotSlot, type MascotSlotProps } from '@/app/components/MascotSlot';
import { Screen, type ScreenProps } from '@/app/components/Screen';
import styles from './SummaryScreen.module.css';

export interface SummaryScreenProps {
  /** Figma parity in Storybook; the app passes false on the test iPhone. */
  showStatusBar?: ScreenProps['showStatusBar'];
  /** Questions passed out of the total in this run — the original 4, or a
   * Try again run's rerun subset (SPEC.md, "Session and after"). Skip
   * counts as non-pass, so it's excluded here the same as Partial/Fail. */
  passCount: number;
  totalCount: number;
  /** The only way out (CLAUDE.md: never trap the student) — reference/
   * Finish-quiz.png has no top nav at all, so this is a deliberate addition,
   * not a frame match. Share and Claim XP are decorative this sprint (your
   * call, 2026-09-15): neither triggers anything. */
  onClose?: () => void;
  onShare?: () => void;
  onClaimXp?: () => void;
}

const COPY: (passCount: number, totalCount: number) => {
  expression: MascotSlotProps['expression'];
  headline: string;
  subhead: string;
} = (passCount, totalCount) => {
  const missed = totalCount - passCount;
  if (missed === 0) {
    // Figma's own copy and expression (node 7366:69693) for this case, verbatim.
    return { expression: 'approving', headline: 'Perfect lesson!', subhead: 'You made 0 mistakes. How?!' };
  }
  if (passCount === 0) {
    return { expression: 'determined', headline: 'Lesson complete', subhead: "Let's go over these again next time." };
  }
  return { expression: 'approving', headline: 'Lesson complete!', subhead: `You explained ${passCount} of ${totalCount} out loud.` };
};

/**
 * SPEC.md screen 8: the summary, shown after the last question in a run.
 * Modelled on reference/Finish-quiz.png and the matching real Figma frame
 * (node 7366:69693, `scaffold` / size=iPhone 13) — your link, 2026-09-15.
 * This replaces the earlier row-by-row build; see the build report for what
 * that trades away (Try again, the per-question transcript/verdict list).
 */
export function SummaryScreen({
  showStatusBar = true,
  passCount,
  totalCount,
  onClose,
  onShare,
  onClaimXp,
}: SummaryScreenProps) {
  const { expression, headline, subhead } = COPY(passCount, totalCount);

  return (
    <Screen
      showStatusBar={showStatusBar}
      topNavigation={
        <AppBar variant="leftIconButtonOnly" leftIcon={<X size="100%" aria-hidden="true" />} leftLabel="Close" onLeftClick={onClose} />
      }
      middleContent={
        <div className={styles.content}>
          <div className={styles.knowie}>
            <div className={styles.mascot}>
              <span className={styles.mascotShadow} aria-hidden="true" />
              <MascotSlot size="3XL" expression={expression} className={styles.mascotArt} />
            </div>
            <div className={styles.copy}>
              <p className={styles.headline}>{headline}</p>
              <p className={styles.subhead}>{subhead}</p>
            </div>
          </div>
          <div className={styles.stats}>
            {/* Static "2", never counts — same convention as the loop's own
                XP chip (VerdictScreen and others), just styled as this
                screen's larger stat card instead of the appBar's small one. */}
            <StatChip tone="xp" label="XP" value="2" icon={<Lightning weight="fill" aria-hidden="true" />} />
            <StatChip
              tone="score"
              label="Score"
              value={`${passCount}/${totalCount}`}
              icon={<Target weight="fill" aria-hidden="true" />}
            />
          </div>
        </div>
      }
      bottomContent={
        <ButtonGroup variant="Horizontal" size="L">
          <Button variant="Secondary" size="L" onClick={onShare}>
            Share
          </Button>
          <Button variant="Primary" size="L" onClick={onClaimXp}>
            Claim XP
          </Button>
        </ButtonGroup>
      }
    />
  );
}

/** The XP/Score stat card — colour fill behind a label, and a dark inset box
 * below it holding the icon and value in that same colour. Not in Storybook
 * (component-gaps.md); tokens read off the real Figma frame (accent/blue and
 * feedback/success's own bold/onBold pairs). */
function StatChip({
  tone,
  label,
  value,
  icon,
}: {
  tone: 'xp' | 'score';
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className={styles.chip} data-tone={tone}>
      <span className={styles.chipLabel}>{label}</span>
      <span className={styles.chipValue}>
        <span className={styles.chipIcon}>{icon}</span>
        {value}
      </span>
    </div>
  );
}
