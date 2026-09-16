'use client';

import { useEffect, useState } from 'react';
import { FrameImage } from '@/app/_prototype/FrameImage';
import { FRAMES, type FrameId, type ZoneId } from '@/app/_prototype/frames';
import type { NodeId } from '@/lib/recall/types';
import styles from './ExamPlanScreen.module.css';

export interface ExamPlanScreenProps {
  frame: FrameId;
  onZone?: (zone: ZoneId) => void;
  /** See `HintAnimateOverlay`'s doc comment — lifted above this component
   * because it has to survive a remount. Defaults to "hasn't played, and
   * nothing records that it has" so the other frames/stories, which don't
   * care, need not pass anything. */
  hintPlayed?: boolean;
  onHintPlayed?: () => void;
}

/** Line (ends 920ms) + the two arrowhead strokes (end 1060ms/1100ms) — see
 * ExamPlanScreen.module.css. Rounded up with margin for the "has it
 * finished" timer below. */
const HINT_ANIMATION_MS = 1300;

/**
 * 02Hint-animate's hint (SPEC.md "Options under consideration", Option B —
 * lined arrow): the purple line draws itself in, ending in an arrowhead at
 * the Voice recall chip. Composited live over the still export, which has
 * no mascot on it either way — see ExamPlanScreen.module.css for the full
 * derivation and why.
 *
 * Animates once only, for the whole session, not just this mount:
 * `hintPlayed`/`onHintPlayed` are owned by `PrototypeFlow`, which never
 * unmounts, rather than local state here. `ExamPlanFlow` itself only ever
 * reaches 02Hint-animate by one forward path (01Exam's Show me) with no zone
 * back to 01Exam, so a real replay never happens by toggling `hidden` within
 * one `ExamPlanFlow` mount — it happens because `PrototypeFlow` fully
 * unmounts and later remounts a fresh `ExamPlanFlow` (the gate's Don't
 * Allow/denial and the loop's Can't talk right now both exit to 01Exam),
 * which would reset any state kept inside this tree.
 *
 * `onHintPlayed` fires a fixed `HINT_ANIMATION_MS` after the first reveal —
 * by then the animation has already run its own course to the same resting
 * (fully drawn) state the static classes below hold, so the class swap that
 * follows is a no-op visually, not a cut. (Firing it immediately on reveal,
 * rather than after playing out, would swap the classes out from under the
 * animation before the browser painted it.)
 */
function HintAnimateOverlay({
  hidden,
  hintPlayed,
  onHintPlayed,
}: {
  hidden: boolean;
  hintPlayed: boolean;
  onHintPlayed: () => void;
}) {
  const isFirstShow = !hidden && !hintPlayed;

  useEffect(() => {
    if (hidden || hintPlayed) return;
    const timer = setTimeout(onHintPlayed, HINT_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [hidden, hintPlayed, onHintPlayed]);

  const line = isFirstShow ? `${styles.line} ${styles.drawing}` : styles.line;
  const wingA = isFirstShow ? `${styles.wingA} ${styles.drawing}` : styles.wingA;
  const wingB = isFirstShow ? `${styles.wingB} ${styles.drawing}` : styles.wingB;

  return (
    <div className={styles.arrowBox} aria-hidden="true">
      <svg width="113" height="117" viewBox="0 0 113 117">
        <path
          className={line}
          pathLength={100}
          d="M0,117
             C22.036,113.992 79.665,93.043 74.130,66.279
             C70.562,49.028 49.685,52.929 49.685,68.529
             C49.685,87.472 74.130,92.486 90.822,80.786
             C111.831,66.060 119.770,28.005 106.493,0"
        />
        <path className={wingA} pathLength={100} d="M106.493,0 L106.60,18.00" />
        <path className={wingB} pathLength={100} d="M106.493,0 L120.35,11.48" />
      </svg>
    </div>
  );
}

/**
 * 00Homescreen's exam-tab "new" badge (design-system.md's `badge`): a live
 * dot in place of the still export's, animated with a looping ping to draw
 * the eye toward Voice recall. Unlike 02Hint-animate's arrow, this has no
 * "played once" gating — the badge itself has no dismissed/seen state
 * anywhere in the real file (sprint-context.md, 2026-09-12: "dropped from
 * voice-ux gap tracking"), so it's designed to animate for as long as it's
 * on screen, not once. See ExamPlanScreen.module.css for the geometry and
 * animation derivation.
 */
function HomescreenBadgeOverlay() {
  return (
    <div className={styles.badge} aria-hidden="true">
      <span className={styles.badgePing} />
      <span className={styles.badgeDot} />
    </div>
  );
}

const NOOP = () => {};

/** The one frame with a live overlay on top of its still export. */
function frameOverlay(id: FrameId, hidden: boolean, hintPlayed: boolean, onHintPlayed: () => void) {
  if (id === '02Hint-animate') {
    return <HintAnimateOverlay hidden={hidden} hintPlayed={hintPlayed} onHintPlayed={onHintPlayed} />;
  }
  if (id === '00Homescreen') {
    return <HomescreenBadgeOverlay />;
  }
  return null;
}

/**
 * SPEC.md screen 3: one exported frame (00Homescreen, 01Exam, 02Hint-animate
 * or 03VoicerecallON) with its tap zones. Rendered bare, not inside Screen,
 * since each export already draws its own tab bar and home indicator — see
 * frames.ts's doc comment for why the status bar strip isn't part of that
 * any more.
 */
export function ExamPlanScreen({ frame, onZone, hintPlayed = false, onHintPlayed = NOOP }: ExamPlanScreenProps) {
  return (
    <FrameImage frame={FRAMES[frame]} onZone={onZone}>
      {frameOverlay(frame, false, hintPlayed, onHintPlayed)}
    </FrameImage>
  );
}

/** Where each tap zone leads inside the exam plan images. */
const NEXT_FRAME: Partial<Record<ZoneId, FrameId>> = {
  'exam-tab': '01Exam',
  'show-me': '02Hint-animate',
  'voice-recall-toggle': '03VoicerecallON',
};

const NODE: Partial<Record<ZoneId, NodeId>> = { 'node-1': 1, 'node-2': 2 };

const ORDER: FrameId[] = ['00Homescreen', '01Exam', '02Hint-animate', '03VoicerecallON'];

export interface ExamPlanFlowProps {
  /** The prototype starts on 00Homescreen; leaving the loop returns to 03VoicerecallON. */
  initialFrame?: FrameId;
  /** A voice node was tapped on 03VoicerecallON: the gate or the loop, for that node. */
  onOpenNode?: (node: NodeId) => void;
  /** The facilitator's triple tap on 00Homescreen. */
  onOpenLog?: () => void;
  /** See `HintAnimateOverlay`'s doc comment. Passed through from `PrototypeFlow`
   * so the hint survives this component's own remounts; defaults to
   * uncontrolled (plays once per mount) for stories that render `ExamPlanFlow`
   * on its own. */
  hintPlayed?: boolean;
  onHintPlayed?: () => void;
}

/**
 * 00Homescreen → 01Exam → 02Hint-animate → 03VoicerecallON → a node. Only the tap
 * zones do anything. All four frames stay mounted, so the next one is already
 * loaded when it's tapped to.
 */
export function ExamPlanFlow({
  initialFrame = '00Homescreen',
  onOpenNode,
  onOpenLog,
  hintPlayed = false,
  onHintPlayed = NOOP,
}: ExamPlanFlowProps) {
  const [current, setCurrent] = useState<FrameId>(initialFrame);

  function handleZone(zone: ZoneId) {
    const next = NEXT_FRAME[zone];
    if (next) return setCurrent(next);
    const node = NODE[zone];
    if (node) return onOpenNode?.(node);
    if (zone === 'facilitator-log') onOpenLog?.();
  }

  return (
    <>
      {ORDER.map((id) => (
        <FrameImage key={id} frame={FRAMES[id]} onZone={handleZone} hidden={id !== current}>
          {frameOverlay(id, id !== current, hintPlayed, onHintPlayed)}
        </FrameImage>
      ))}
    </>
  );
}
