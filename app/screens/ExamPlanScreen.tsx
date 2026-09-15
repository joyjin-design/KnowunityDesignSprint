'use client';

import { useState } from 'react';
import { FrameImage } from '@/app/_prototype/FrameImage';
import { FRAMES, type FrameId, type ZoneId } from '@/app/_prototype/frames';
import type { NodeId } from '@/lib/recall/types';

export interface ExamPlanScreenProps {
  frame: FrameId;
  onZone?: (zone: ZoneId) => void;
}

/**
 * SPEC.md screen 3: one exported frame (00Homescreen, 01Exam, 02Hint-animate
 * or 03VoicerecallON) with its tap zones. Rendered bare, not inside Screen, since
 * each export already draws its own status bar and tab bar.
 */
export function ExamPlanScreen({ frame, onZone }: ExamPlanScreenProps) {
  return <FrameImage frame={FRAMES[frame]} onZone={onZone} />;
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
}

/**
 * 00Homescreen → 01Exam → 02Hint-animate → 03VoicerecallON → a node. Only the tap
 * zones do anything. All four frames stay mounted, so the next one is already
 * loaded when it's tapped to.
 */
export function ExamPlanFlow({ initialFrame = '00Homescreen', onOpenNode, onOpenLog }: ExamPlanFlowProps) {
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
        <FrameImage key={id} frame={FRAMES[id]} onZone={handleZone} hidden={id !== current} />
      ))}
    </>
  );
}
