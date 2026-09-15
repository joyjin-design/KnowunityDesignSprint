'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, type ReactNode } from 'react';
import { ExamPlanFlow } from '@/app/screens/ExamPlanScreen';
import { GateScreen } from '@/app/screens/GateScreen';
import { MicOffScreen } from '@/app/screens/MicOffScreen';
import { SummaryScreen } from '@/app/screens/SummaryScreen';
import { TypingPlaceholderScreen } from '@/app/screens/TypingPlaceholderScreen';
import { VerdictScreen, type VerdictOutcome } from '@/app/screens/VerdictScreen';
import { WhyScreen } from '@/app/screens/WhyScreen';
import { requestMic, type MicRequestResult } from '@/lib/recall/micPermission';
import { turnLog } from '@/lib/recall/turnLog';
import type { ConceptId, NodeId, Verdict } from '@/lib/recall/types';
import type { FrameId } from './frames';
import { NotBuiltScreen } from './NotBuiltScreen';
import { HOME, type MicState, type PrototypeView } from './reviewScreens';

/** Leaving voice recall returns to the exam plan with the toggle still on
 * (sprint-context.md, 2026-09-14): close, Can't talk right now, Continue.
 * Only Don't Allow in the iOS prompt goes back to 01Exam. */
const LEAVE_FRAME: FrameId = '03VoicerecallON';

const LOOP_NOT_BUILT: PrototypeView = {
  screen: 'not-built',
  caption: "The voice recall loop isn't in this prototype yet.",
};

// Review-link content, copied from content/voice-recall-questions.md and the
// VerdictScreen / MicOffScreen stories.
const Q1 = 'What does the nucleus do in a cell?';
const Q2 = 'What do mitochondria do, and why does a cell need them?';

// SummaryScreen review links: same sample counts as SPEC.md's own
// end-to-end verification (screen 8) and SummaryScreen's own stories.
const SUMMARY_SAMPLES: Record<'someNonPass' | 'allPass' | 'afterTryAgain', { passCount: number; totalCount: number }> =
  {
    someNonPass: { passCount: 1, totalCount: 4 },
    allPass: { passCount: 4, totalCount: 4 },
    afterTryAgain: { passCount: 2, totalCount: 3 },
  };
const VERDICT_SAMPLES: Record<VerdictOutcome, { transcript: string; progress: 25 | 50 }> = {
  Pass: { transcript: 'They make energy for the cell by breaking down glucose.', progress: 50 },
  Partial: { transcript: "They're the powerhouse of the cell.", progress: 50 },
  Fail: { transcript: 'They help the cell divide.', progress: 50 },
  Silence: { transcript: '', progress: 25 },
};

// Q2's three concepts and explanation (content/voice-recall-questions.md).
const Q2_EXPLANATION: { text: string; concept?: ConceptId }[] = [
  { text: 'Mitochondria are where the cell gets its ' },
  { text: 'energy', concept: 'A' },
  { text: '. They break down ' },
  { text: 'glucose', concept: 'C' },
  { text: ' (sugar from food) using oxygen in a process called ' },
  { text: 'cellular respiration', concept: 'B' },
  { text: ', and the energy released powers everything else the cell does.' },
];

/** Which of Q2's three concepts each sample transcript above missed — the
 * judge is mocked, so this is decided here, the same way VERDICT_SAMPLES
 * decides the verdict itself. */
const WHY_MISSING: Record<Verdict, ConceptId[]> = {
  Pass: ['B'],
  Partial: ['B', 'C'],
  Fail: ['A', 'B', 'C'],
};

/** Bolds only the concepts the (mocked) judge found missing. */
function explainQ2(missing: ConceptId[]): ReactNode {
  return Q2_EXPLANATION.map((segment, i) =>
    segment.concept && missing.includes(segment.concept) ? <strong key={i}>{segment.text}</strong> : segment.text,
  );
}

function askTheDevice(): Promise<MicRequestResult> {
  return requestMic(typeof navigator === 'undefined' ? undefined : navigator.mediaDevices);
}

export interface PrototypeFlowProps {
  initialView?: PrototypeView;
  initialMic?: MicState;
  /** Injected in stories; the app asks the device. */
  requestMic?: () => Promise<MicRequestResult>;
  /** Injected in stories; the app writes the turn log's "Session started" row. */
  startSession?: (node: NodeId) => void;
}

/**
 * The running prototype: every built screen, joined up. Starts on 00Homescreen
 * (or a `?screen=` review link) and follows SPEC.md's routes, with a
 * `NotBuiltScreen` stop wherever the next screen doesn't exist yet. Renders on
 * the phone, so the mock status bar is off.
 */
export function PrototypeFlow({
  initialView = HOME.view,
  initialMic = HOME.mic,
  requestMic: ask = askTheDevice,
  startSession = (node) => turnLog.startSession(node),
}: PrototypeFlowProps) {
  const router = useRouter();
  const [view, setView] = useState<PrototypeView>(initialView);
  const [mic, setMic] = useState<MicState>(initialMic);
  // Only for the notice after a failed recheck (SPEC.md Open #5) — cleared
  // on every node open, so a stale notice can't reappear on a later visit.
  const [micStillOff, setMicStillOff] = useState(false);
  const asking = useRef(false);

  const examPlan = (frame: FrameId) => setView({ screen: 'exam-plan', frame });

  function openNode(node: NodeId) {
    startSession(node);
    setMicStillOff(false);
    setView(mic === 'granted' ? LOOP_NOT_BUILT : { screen: 'gate', node, sheetOpen: false });
  }

  /** One request at a time: the iOS prompt is up while this waits. */
  async function askForMic(ifNotGranted: () => void) {
    if (asking.current) return;
    asking.current = true;
    const result = await ask();
    asking.current = false;
    if (result === 'granted') {
      setMic('granted');
      setView(LOOP_NOT_BUILT);
      return;
    }
    // Unavailable (no HTTPS, or no mic hardware) is routed exactly like a
    // real denial, on your call (2026-09-15) — this only shows up testing
    // over plain HTTP, not worth a separate path.
    if (result === 'unavailable') {
      console.warn('Voice recall: the microphone is unavailable (no microphone, or the page is not on HTTPS).');
    }
    setMic('denied');
    ifNotGranted();
  }

  switch (view.screen) {
    case 'exam-plan':
      return <ExamPlanFlow initialFrame={view.frame} onOpenNode={openNode} onOpenLog={() => router.push('/log')} />;

    case 'gate':
      return (
        <GateScreen
          showStatusBar={false}
          state={mic === 'denied' ? 'afterDenial' : view.sheetOpen ? 'permissionSheetOpen' : 'firstTime'}
          onTurnOnMicrophone={() => setView({ ...view, sheetOpen: true })}
          onDontAllow={() => setView({ ...view, sheetOpen: false })}
          onAllow={() => askForMic(() => examPlan('01Exam'))}
          // Still off: stays on the Settings steps, with a notice (Open #5).
          onIveTurnedOnMic={() => {
            setMicStillOff(false);
            askForMic(() => setMicStillOff(true));
          }}
          micStillOff={micStillOff}
          // The gate's own Can't talk right now goes to 01Exam (SPEC.md's
          // original table; confirmed against Figma 13548:6324, 2026-09-15),
          // not LEAVE_FRAME — that 03VoicerecallON destination is for
          // leaving the *loop* (sprint-context.md, 2026-09-14), a different
          // Can't talk right now button on a different screen.
          onCantTalk={() => examPlan('01Exam')}
        />
      );

    case 'mic-off':
      return (
        <MicOffScreen
          showStatusBar={false}
          question={Q1}
          progress={0}
          onClose={() => examPlan(LEAVE_FRAME)}
          onTypeInstead={() => setView({ screen: 'typing' })}
          onSkip={() => setView(LOOP_NOT_BUILT)}
        />
      );

    case 'typing':
      return <TypingPlaceholderScreen showStatusBar={false} onBackToVoice={() => examPlan('01Exam')} />;

    case 'verdict': {
      const sample = VERDICT_SAMPLES[view.outcome];
      return (
        <VerdictScreen
          showStatusBar={false}
          outcome={view.outcome}
          question={Q2}
          transcript={sample.transcript}
          progress={sample.progress}
          onClose={() => examPlan(LEAVE_FRAME)}
          onWhy={() => {
            // Silence has no Why? button (ResultBtm doesn't render one for
            // it), so this never actually fires with outcome 'Silence' — the
            // check just satisfies the 'why' view's narrower Verdict type.
            if (view.outcome === 'Silence') return;
            setView({ screen: 'why', outcome: view.outcome });
          }}
          onContinue={() => setView(LOOP_NOT_BUILT)}
          onReRecord={() => setView(LOOP_NOT_BUILT)}
          onTypeInstead={() => setView({ screen: 'typing' })}
          onSkip={() => setView(LOOP_NOT_BUILT)}
        />
      );
    }

    case 'why': {
      const sample = VERDICT_SAMPLES[view.outcome];
      return (
        <WhyScreen
          showStatusBar={false}
          outcome={view.outcome}
          question={Q2}
          transcript={sample.transcript}
          progress={sample.progress}
          explanation={explainQ2(WHY_MISSING[view.outcome])}
          onClose={() => examPlan(LEAVE_FRAME)}
          onGotIt={() => setView(LOOP_NOT_BUILT)}
        />
      );
    }

    case 'summary': {
      const { passCount, totalCount } = SUMMARY_SAMPLES[view.variant];
      return (
        <SummaryScreen
          showStatusBar={false}
          passCount={passCount}
          totalCount={totalCount}
          onClose={() => examPlan(LEAVE_FRAME)}
          // Share and Claim XP are decorative this sprint (your instruction,
          // 2026-09-15) — onShare/onClaimXp are left unset, so neither does
          // anything; Close is the only way out.
        />
      );
    }

    case 'not-built':
      return <NotBuiltScreen showStatusBar={false} caption={view.caption} onBack={() => examPlan(LEAVE_FRAME)} />;
  }
}
