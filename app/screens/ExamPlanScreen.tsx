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
    <div className={styles.arrowBox} aria-hidden="true" data-overlay="hint-arrow">
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

/** Phosphor `microphone-bold`, the Voice recall toggle chip's icon in Figma
 * (13761:5969, "Phosphor icons (voice recall)"). Path copied verbatim from
 * Figma's own SVG export of that component, on its 20×20 box. */
const MICROPHONE_BOLD_PATH =
  'M10 14.0625C11.0771 14.0613 12.1097 13.6328 12.8713 12.8713C13.6328 12.1097 14.0613 11.0771 14.0625 10V5C14.0625 3.92256 13.6345 2.88925 12.8726 2.12738C12.1108 1.36551 11.0774 0.9375 10 0.9375C8.92256 0.9375 7.88925 1.36551 7.12738 2.12738C6.36551 2.88925 5.9375 3.92256 5.9375 5V10C5.93874 11.0771 6.36715 12.1097 7.12875 12.8713C7.89035 13.6328 8.92294 14.0613 10 14.0625ZM7.8125 5C7.8125 4.41984 8.04297 3.86344 8.4532 3.4532C8.86344 3.04297 9.41984 2.8125 10 2.8125C10.5802 2.8125 11.1366 3.04297 11.5468 3.4532C11.957 3.86344 12.1875 4.41984 12.1875 5V10C12.1875 10.5802 11.957 11.1366 11.5468 11.5468C11.1366 11.957 10.5802 12.1875 10 12.1875C9.41984 12.1875 8.86344 11.957 8.4532 11.5468C8.04297 11.1366 7.8125 10.5802 7.8125 10V5ZM10.9375 17.1266V18.75C10.9375 18.9986 10.8387 19.2371 10.6629 19.4129C10.4871 19.5887 10.2486 19.6875 10 19.6875C9.75136 19.6875 9.5129 19.5887 9.33709 19.4129C9.16127 19.2371 9.0625 18.9986 9.0625 18.75V17.1266C7.3344 16.8969 5.74838 16.0479 4.59892 14.7372C3.44947 13.4266 2.81471 11.7433 2.8125 10C2.8125 9.75136 2.91127 9.5129 3.08709 9.33709C3.2629 9.16127 3.50136 9.0625 3.75 9.0625C3.99864 9.0625 4.2371 9.16127 4.41291 9.33709C4.58873 9.5129 4.6875 9.75136 4.6875 10C4.6875 11.409 5.24721 12.7602 6.2435 13.7565C7.23978 14.7528 8.59104 15.3125 10 15.3125C11.409 15.3125 12.7602 14.7528 13.7565 13.7565C14.7528 12.7602 15.3125 11.409 15.3125 10C15.3125 9.75136 15.4113 9.5129 15.5871 9.33709C15.7629 9.16127 16.0014 9.0625 16.25 9.0625C16.4986 9.0625 16.7371 9.16127 16.9129 9.33709C17.0887 9.5129 17.1875 9.75136 17.1875 10C17.1853 11.7433 16.5505 13.4266 15.4011 14.7372C14.2516 16.0479 12.6656 16.8969 10.9375 17.1266Z';

/**
 * The Voice recall toggle chip's icon on 01Exam, 02Hint-animate and
 * 03VoicerecallON: a live SVG in place of the still export's own icon,
 * whose 20×20 box is painted out of each PNG with the chip's flat fill
 * (sprint-context.md, 2026-10-12). `on` is 03VoicerecallON's filled chip.
 * See ExamPlanScreen.module.css for the geometry and colours.
 */
function ToggleChipIconOverlay({ on = false }: { on?: boolean }) {
  return (
    <div
      className={on ? `${styles.chipIcon} ${styles.chipIconOn}` : styles.chipIcon}
      aria-hidden="true"
      data-overlay="toggle-chip-icon"
    >
      <svg viewBox="0 0 20 20" width="100%" height="100%">
        <path d={MICROPHONE_BOLD_PATH} fill="currentColor" />
      </svg>
    </div>
  );
}

const NOOP = () => {};

/** Live overlays composited on top of a frame's still export. */
function frameOverlay(id: FrameId, hidden: boolean, hintPlayed: boolean, onHintPlayed: () => void) {
  if (id === '02Hint-animate') {
    return (
      <>
        <ToggleChipIconOverlay />
        <HintAnimateOverlay hidden={hidden} hintPlayed={hintPlayed} onHintPlayed={onHintPlayed} />
      </>
    );
  }
  if (id === '00Homescreen') {
    return <HomescreenBadgeOverlay />;
  }
  if (id === '01Exam') {
    return <ToggleChipIconOverlay />;
  }
  if (id === '03VoicerecallON') {
    return <ToggleChipIconOverlay on />;
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
