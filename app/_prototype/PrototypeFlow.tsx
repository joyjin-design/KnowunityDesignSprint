'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, type ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { ExamPlanFlow } from '@/app/screens/ExamPlanScreen';
import { GateScreen } from '@/app/screens/GateScreen';
import { LoopScreen } from '@/app/screens/LoopScreen';
import { MicOffScreen } from '@/app/screens/MicOffScreen';
import { SummaryScreen } from '@/app/screens/SummaryScreen';
import { TypingPlaceholderScreen } from '@/app/screens/TypingPlaceholderScreen';
import { VerdictScreen } from '@/app/screens/VerdictScreen';
import { WhyScreen } from '@/app/screens/WhyScreen';
import {
  getLatencyOverride,
  getServerLatencyOverride,
  subscribeLatencyOverride,
} from '@/lib/recall/latencyOverride';
import { requestMic, type MicRequestResult } from '@/lib/recall/micPermission';
import { QUESTIONS, type Question } from '@/lib/recall/questions';
import {
  getScriptedAnswer,
  getServerScriptedAnswer,
  subscribeScriptedAnswer,
} from '@/lib/recall/scriptedTranscript';
import { turnLog } from '@/lib/recall/turnLog';
import type { ConceptId, LatencyFlag, NodeId, QuestionId, TurnOutcome } from '@/lib/recall/types';
import type { FrameId } from './frames';
import { newSession, HOME, type LastTurn, type MicState, type PrototypeView, type Session } from './reviewScreens';

/** Every screen's own progress prop is this same closed set, whether it
 * derives it from ProgressIndicator's (optional) prop type or spells it out
 * directly — MicOffScreen does the latter, so this matches that shape rather
 * than the optional one, since every value computed here is always definite. */
type Progress = 0 | 25 | 50 | 75 | 100;

/** Leaving voice recall returns to the exam plan with the toggle still on
 * (sprint-context.md, 2026-09-14): close, Can't talk right now, Continue.
 * Only Don't Allow in the iOS prompt goes back to 01Exam. */
const LEAVE_FRAME: FrameId = '03VoicerecallON';

/** Bolds only the concepts the (mocked) judge found missing. */
function renderExplanation(question: Question, missing: readonly ConceptId[]): ReactNode {
  return question.explanation.map((segment, i) =>
    segment.concept && missing.includes(segment.concept) ? <strong key={i}>{segment.text}</strong> : segment.text
  );
}

/** How far the progress ring should sit for a session: every question
 * counted so far, plus this one once it has a verdict (Silence doesn't
 * count — VerdictScreen's own progress prop doc). */
function progressAt(session: Session, countsCurrent: boolean): Progress {
  return ((session.index + (countsCurrent ? 1 : 0)) * 25) as Progress;
}

function askTheDevice(): Promise<MicRequestResult> {
  return requestMic(typeof navigator === 'undefined' ? undefined : navigator.mediaDevices);
}

export interface PrototypeFlowProps {
  initialView?: PrototypeView;
  initialMic?: MicState;
  /** Review links into loop/verdict/why/summary supply their own fixed
   * session/lastTurn; the real flow builds its own via `newSession` when a
   * node opens. */
  initialSession?: Session;
  initialLastTurn?: LastTurn;
  /** Injected in stories; the app asks the device. */
  requestMic?: () => Promise<MicRequestResult>;
  /** Injected in stories; the app writes the turn log's "Session started"
   * row and returns its session number. */
  startSession?: (node: NodeId) => number;
}

/**
 * The running prototype: every built screen, joined up. Starts on 00Homescreen
 * (or a `?screen=` review link) and follows SPEC.md's routes. Renders on the
 * phone, so the mock status bar is off.
 */
export function PrototypeFlow({
  initialView = HOME.view,
  initialMic = HOME.mic,
  initialSession,
  initialLastTurn,
  requestMic: ask = askTheDevice,
  startSession = (node) => turnLog.startSession(node),
}: PrototypeFlowProps) {
  const router = useRouter();
  const [view, setView] = useState<PrototypeView>(initialView);
  const [mic, setMic] = useState<MicState>(initialMic);
  // Only for the notice after a failed recheck (SPEC.md Open #5) — cleared
  // on every node open, so a stale notice can't reappear on a later visit.
  const [micStillOff, setMicStillOff] = useState(false);
  const [session, setSession] = useState<Session | undefined>(initialSession);
  const [lastTurn, setLastTurn] = useState<LastTurn | undefined>(initialLastTurn);
  // 02Hint-animate's Knowie bounce, played once for the whole session: kept
  // here rather than inside ExamPlanFlow because the gate's Don't Allow/
  // denial and the loop's Can't talk right now both exit to 01Exam by fully
  // unmounting ExamPlanFlow (this switch statement renders a different
  // screen type in between) and later remounting a fresh one, which would
  // otherwise reset any state kept inside that tree and replay the hint.
  const [hintPlayed, setHintPlayed] = useState(false);
  const asking = useRef(false);

  // Real STT is deferred (SPEC.md verification item 0's spike hasn't run):
  // both facilitator-only controls on /log, never seen by a student.
  const scriptedAnswer = useSyncExternalStore(
    subscribeScriptedAnswer,
    () => getScriptedAnswer(() => window.localStorage),
    getServerScriptedAnswer
  );
  const latencyOverride = useSyncExternalStore(
    subscribeLatencyOverride,
    () => getLatencyOverride(() => window.localStorage),
    getServerLatencyOverride
  );

  const examPlan = (frame: FrameId) => setView({ screen: 'exam-plan', frame });

  /** Leaves the running session (its bookkeeping, not the turn log already
   * written) and returns to the exam plan. */
  function leaveSession(frame: FrameId) {
    setSession(undefined);
    setLastTurn(undefined);
    examPlan(frame);
  }

  /** Writes one turn row for the session currently open. A no-op with no
   * session (shouldn't happen in the real flow; guards review-link edges). */
  function logTurn(
    question: QuestionId,
    outcome: TurnOutcome,
    opts: { transcript?: string; conceptsHit?: ConceptId[]; latencyMs?: number | null; latencyFlag: LatencyFlag | null }
  ) {
    if (!session) return;
    turnLog.appendTurn({
      session: session.sessionNumber,
      node: session.node,
      round: 1,
      question,
      transcript: opts.transcript ?? '',
      conceptsHit: opts.conceptsHit ?? [],
      outcome,
      latencyMs: opts.latencyMs ?? null,
      latencyFlag: opts.latencyFlag,
      timestamp: new Date().toISOString(),
    });
  }

  /** Records the question's outcome against the session and moves on: the
   * next question, or the summary after the last. Try again is out
   * (sprint-context.md, this build), so every question is seen exactly once
   * per session. Doesn't itself write to the turn log — callers that need a
   * row (every outcome except a Silence's own Skip/Re-record, already logged
   * when the Silence fired) call `logTurn` first. */
  function advance(question: QuestionId, outcome: TurnOutcome) {
    if (!session) return;
    const index = session.index + 1;
    const outcomes = { ...session.outcomes, [question]: outcome };
    setSession({ ...session, index, outcomes });
    if (index >= session.order.length) {
      const passCount = Object.values(outcomes).filter((o) => o === 'Pass').length;
      setView({ screen: 'summary', passCount, totalCount: session.order.length });
    } else {
      setView({ screen: 'loop' });
    }
  }

  /** Starts (or resumes) the session for `node` once the mic is confirmed
   * on, and shows the loop. */
  function beginSession(node: NodeId) {
    setMic('granted');
    if (!session || session.node !== node) {
      setSession(newSession(startSession(node), node));
    }
    setMicStillOff(false);
    setView({ screen: 'loop' });
  }

  function openNode(node: NodeId) {
    setMicStillOff(false);
    if (mic === 'granted') {
      beginSession(node);
    } else {
      setSession(newSession(startSession(node), node));
      setView({ screen: 'gate', node, sheetOpen: false });
    }
  }

  /** One request at a time: the iOS prompt is up while this waits. */
  async function askForMic(node: NodeId, ifNotGranted: () => void) {
    if (asking.current) return;
    asking.current = true;
    const result = await ask();
    asking.current = false;
    if (result === 'granted') {
      beginSession(node);
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

  /** LoopScreen's own Start: a real permission re-check, since it can be
   * revoked after the gate already passed. Denied shows the mic-off sheet
   * over the loop instead of entering Recording. */
  async function handleLoopStart(): Promise<boolean> {
    if (asking.current) return false;
    asking.current = true;
    const result = await ask();
    asking.current = false;
    if (result === 'granted') {
      setMic('granted');
      return true;
    }
    if (result === 'unavailable') {
      console.warn('Voice recall: the microphone is unavailable (no microphone, or the page is not on HTTPS).');
    }
    setMic('denied');
    setView({ screen: 'mic-off' });
    return false;
  }

  switch (view.screen) {
    case 'exam-plan':
      return (
        <ExamPlanFlow
          initialFrame={view.frame}
          onOpenNode={openNode}
          onOpenLog={() => router.push('/log')}
          hintPlayed={hintPlayed}
          onHintPlayed={() => setHintPlayed(true)}
        />
      );

    case 'gate':
      return (
        <GateScreen
          showStatusBar={false}
          state={mic === 'denied' ? 'afterDenial' : view.sheetOpen ? 'permissionSheetOpen' : 'firstTime'}
          onTurnOnMicrophone={() => setView({ ...view, sheetOpen: true })}
          onDontAllow={() => setView({ ...view, sheetOpen: false })}
          onAllow={() => askForMic(view.node, () => examPlan('01Exam'))}
          // Still off: stays on the Settings steps, with a notice (Open #5).
          onIveTurnedOnMic={() => {
            setMicStillOff(false);
            askForMic(view.node, () => setMicStillOff(true));
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

    case 'loop': {
      // Every path into 'loop' (openNode, beginSession, advance) sets a
      // session first; nothing renders without one.
      if (!session) return null;
      const questionId = session.order[session.index];
      const question = QUESTIONS[questionId];
      return (
        <LoopScreen
          showStatusBar={false}
          question={question}
          progress={progressAt(session, false)}
          scriptedAnswer={scriptedAnswer}
          latencyOverride={latencyOverride}
          onStart={handleLoopStart}
          onSkipIdle={() => {
            logTurn(questionId, 'Skipped', { latencyFlag: null });
            advance(questionId, 'Skipped');
          }}
          onCantTalk={() => {
            logTurn(questionId, 'Left (idle)', { latencyFlag: null });
            leaveSession('01Exam');
          }}
          onClose={(phase, transcript, latencyMs, flag) => {
            if (phase === 'idle') {
              logTurn(questionId, 'Left (idle)', { latencyFlag: null });
            } else if (phase === 'processing') {
              logTurn(questionId, 'Left (judging)', {
                transcript,
                latencyMs: latencyMs ?? null,
                latencyFlag: flag ?? null,
              });
            }
            // Recording: treated like Cancel — nothing committed, nothing logged.
            leaveSession(LEAVE_FRAME);
          }}
          onInterrupted={(transcript) => {
            logTurn(questionId, 'Interrupted', { transcript, latencyFlag: null });
          }}
          onSilence={(transcript, latencyMs, flag) => {
            logTurn(questionId, 'Silence', { transcript, latencyMs, latencyFlag: flag });
            setLastTurn({ question: questionId, transcript, verdict: 'Silence', conceptsHit: [] });
            setView({ screen: 'verdict', outcome: 'Silence' });
          }}
          onVerdict={(transcript, verdict, conceptsHit, latencyMs, flag) => {
            logTurn(questionId, verdict, { transcript, conceptsHit, latencyMs, latencyFlag: flag });
            setLastTurn({ question: questionId, transcript, verdict, conceptsHit });
            setView({ screen: 'verdict', outcome: verdict });
          }}
        />
      );
    }

    case 'mic-off': {
      const questionId = session ? session.order[session.index] : undefined;
      const question = questionId ? QUESTIONS[questionId] : QUESTIONS.Q1;
      return (
        <MicOffScreen
          showStatusBar={false}
          question={question.prompt}
          progress={session ? progressAt(session, false) : 0}
          onClose={() => leaveSession(LEAVE_FRAME)}
          onTypeInstead={() => setView({ screen: 'typing' })}
          onSkip={() => {
            if (!questionId) return;
            logTurn(questionId, 'Mic off', { latencyFlag: null });
            advance(questionId, 'Mic off');
          }}
        />
      );
    }

    case 'typing':
      return <TypingPlaceholderScreen showStatusBar={false} onBackToVoice={() => examPlan('01Exam')} />;

    case 'verdict': {
      if (!lastTurn) return null;
      const question = QUESTIONS[lastTurn.question];
      const progress = session ? progressAt(session, view.outcome !== 'Silence') : 0;
      return (
        <VerdictScreen
          showStatusBar={false}
          outcome={view.outcome}
          question={question.prompt}
          transcript={lastTurn.transcript}
          progress={progress}
          onClose={() => leaveSession(LEAVE_FRAME)}
          onWhy={() => {
            // Silence has no Why? button (ResultBtm doesn't render one for
            // it), so this never actually fires with outcome 'Silence' — the
            // check just satisfies the 'why' view's narrower Verdict type.
            if (view.outcome === 'Silence') return;
            setView({ screen: 'why', outcome: view.outcome });
          }}
          onContinue={() => advance(lastTurn.question, view.outcome)}
          onReRecord={() => setView({ screen: 'loop' })}
          onTypeInstead={() => setView({ screen: 'typing' })}
          // Silence's own Skip: the Silence row was already logged when it
          // fired, so this only advances the session, no new turn row.
          onSkip={() => advance(lastTurn.question, 'Skipped')}
        />
      );
    }

    case 'why': {
      if (!lastTurn) return null;
      const question = QUESTIONS[lastTurn.question];
      const missing = question.concepts.map((c) => c.id).filter((id) => !lastTurn.conceptsHit.includes(id));
      const progress = session ? progressAt(session, true) : 0;
      return (
        <WhyScreen
          showStatusBar={false}
          outcome={view.outcome}
          question={question.prompt}
          transcript={lastTurn.transcript}
          progress={progress}
          explanation={renderExplanation(question, missing)}
          onClose={() => leaveSession(LEAVE_FRAME)}
          onGotIt={() => advance(lastTurn.question, view.outcome)}
        />
      );
    }

    case 'summary':
      return (
        <SummaryScreen
          showStatusBar={false}
          passCount={view.passCount}
          totalCount={view.totalCount}
          onClose={() => leaveSession(LEAVE_FRAME)}
          // Share and Claim XP are decorative this sprint (your instruction,
          // 2026-09-15) — onShare/onClaimXp are left unset, so neither does
          // anything; Close is the only way out.
        />
      );
  }
}
