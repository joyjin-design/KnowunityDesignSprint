'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties } from 'react';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning';
import { Microphone } from '@phosphor-icons/react/dist/csr/Microphone';
import { Waveform as WaveformIcon } from '@phosphor-icons/react/dist/csr/Waveform';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { AiDisclaimer } from '@/app/components/AiDisclaimer';
import { AppBar } from '@/app/components/AppBar';
import { Button } from '@/app/components/Button';
import { ButtonGroup } from '@/app/components/ButtonGroup';
import { ButtonIcon } from '@/app/components/ButtonIcon';
import { ButtonVoice } from '@/app/components/ButtonVoice';
import { MascotSlot } from '@/app/components/MascotSlot';
import { ProgressIndicator } from '@/app/components/ProgressIndicator';
import { Screen, type ScreenProps } from '@/app/components/Screen';
import { Snackbar } from '@/app/components/Snackbar';
import { TranscriptDisplay } from '@/app/components/TranscriptDisplay';
import { judge } from '@/lib/recall/judge';
import type { LatencyOverride } from '@/lib/recall/latencyOverride';
import { planProcessing, type ProcessingPlan } from '@/lib/recall/processingLatency';
import type { Question } from '@/lib/recall/questions';
import { scriptedTextFor, startScriptedSpeech, type ScriptedAnswerId } from '@/lib/recall/scriptedTranscript';
import { isWebSpeechSupported, startWebSpeech } from '@/lib/recall/webSpeech';
import type { ConceptId, LatencyFlag, Verdict } from '@/lib/recall/types';
import styles from './LoopScreen.module.css';

type Phase = 'idle' | 'recording' | 'processing';
type ProcessingPhrase = 'think' | 'checking' | 'almost';

const PROCESSING_COPY: Record<ProcessingPhrase, string> = {
  think: 'Let me think…',
  checking: 'Checking your answer…',
  almost: 'Almost there…',
};

/** How long a take has to run before Send counts as a real attempt, not the
 * accidental-tap case (SPEC.md "On Send" step 1). Also drives `sendGuarded`
 * (2026-09-16, your call): Send now visibly dims for this same window,
 * rather than a too-early tap being a silent dead click, and clears the
 * instant either this timer fires or the first word is heard. */
const ACCIDENTAL_TAP_MS = 1000;
/** "Still listening…" fires on real silence (2026-09-16, your call): no new
 * transcript from either speech source for this long, not a word count or a
 * recognizer restart. Clears the moment a new interim result arrives, or the
 * take ends — no separate auto-hide timer. */
const SILENCE_TIMEOUT_MS = 3000;

/** Waveform bars reveal one at a time on this clock while there's been
 * recent speech (2026-09-16, your call — replaces the earlier word-count
 * proxy). Gated by `stillListening` below: the clock only advances between
 * "a sound has been heard" and "3s of silence" — the same two states that
 * already drive the "Still listening…" cue, so the two read as
 * complementary rather than two separate signals. No live amplitude signal
 * exists (`webkitSpeechRecognition` doesn't expose one), so "a sound has
 * been heard" means "at least one interim result has arrived," not a real
 * volume threshold. */
const WAVEFORM_REVEAL_INTERVAL_MS = 200;

/** The waveform row's bar heights (px), left to right, transcribed from
 * Figma's own full-width waveform (nodes 13698:7196 and 13696:7029 —
 * 08Talking-finished and Processing draw the identical 38-bar row) — literal
 * decorative geometry, not tokens, same exemption component-gaps.md already
 * gives the hint arrow and the summary stat chip. */
const WAVEFORM_BAR_HEIGHTS = [
  25, 30, 23, 23, 23, 21, 19, 16, 14, 16, 10, 10, 10, 16, 10, 10, 23, 21, 19, 16, 23, 23, 23, 23, 23, 23, 23, 23, 23,
  23, 23, 21, 19, 16, 23, 21, 19, 16,
];

/** Bar width (`--size-space-150`) and gap (`--size-space-100`) as plain
 * numbers, for computing the reveal group's own shift below — real tokens,
 * just needed as arithmetic here rather than CSS. */
const WAVEFORM_BAR_WIDTH_PX = 6;
const WAVEFORM_BAR_GAP_PX = 4;
/** The waveform viewport's real interior width in this 390px-only design
 * (CLAUDE.md: "390px width. No other platform/size."): 390 minus Screen's
 * own `.bottomContent` padding (`--size-space-400`, 16px each side) minus
 * `.waveform`'s own `padding-inline` (`--size-space-300`, 12px each side).
 * Used below to keep the newest bar flush against the row's right edge as
 * the group grows (2026-09-16, your call — "show them as a group... move
 * from right to left," replacing the earlier per-bar pop-in). */
const WAVEFORM_VIEWPORT_WIDTH_PX = 390 - 16 * 2 - 12 * 2;

/** How far to shift the bar group so its newest (rightmost) bar stays
 * flush against the viewport's right edge, whatever the current count.
 * Bars are appended in their natural, already-correct Figma order
 * (`WAVEFORM_BAR_HEIGHTS.slice(0, n)`), so appending never reflows a bar
 * that's already on screen — only this one group-level `transform` value
 * changes, which is what lets the whole group glide left together via a
 * plain CSS `transition` instead of each bar animating independently. */
function waveformGroupShift(barCount: number): number {
  const groupWidth = barCount === 0 ? 0 : barCount * WAVEFORM_BAR_WIDTH_PX + (barCount - 1) * WAVEFORM_BAR_GAP_PX;
  return WAVEFORM_VIEWPORT_WIDTH_PX - groupWidth;
}

type Progress = ComponentProps<typeof ProgressIndicator>['progress'];

export interface LoopScreenProps {
  question: Question;
  /** Same meaning as VerdictScreen's own progress prop: counts every
   * question with a verdict so far, not including this one until it's
   * answered. */
  progress: Progress;
  /** Figma parity in Storybook; the app passes false on the test iPhone. */
  showStatusBar?: ScreenProps['showStatusBar'];
  /** The facilitator's current pick on /log — `live` (the default) uses the
   * real recognizer (`lib/recall/webSpeech.ts`); every other value streams a
   * scripted stand-in instead, for testing without speaking. */
  scriptedAnswer: ScriptedAnswerId;
  /** The facilitator's latency override, already wired into /log. */
  latencyOverride: LatencyOverride;
  /** Start tapped: the caller re-checks the mic before recording begins.
   * Resolving `false` means the caller is about to show the mic-off sheet
   * (SPEC.md screen 5) over this one instead — LoopScreen just stays put. */
  onStart?: () => Promise<boolean> | boolean;
  /** Idle only (2026-09-16, your call — narrower than the Figma reference,
   * which didn't distinguish): the caller has passively found the mic gone
   * since Gate last confirmed it (permission revoked, hardware unplugged),
   * without the student tapping anything yet. Shows the `Snackbar` above the
   * app bar (Figma 13719:8829/9060, variant Error). Tapping Start still
   * works exactly as before — this is only a heads-up, not a block; Start's
   * own `onStart` recheck is still what actually stops Recording. */
  micUnavailable?: boolean;
  /** The snackbar's one action ("Go back"). Not a real OS deep link —
   * no web page can open iOS Settings — so the caller sends the student back
   * to Gate's own after-denial Settings-instructions state instead of
   * inventing a second copy of it here (2026-09-16, your call). */
  onGoToSettings?: () => void;
  /** Idle only: next question, no attempt used. */
  onSkipIdle?: () => void;
  /** Idle only: leaves the session for 01Exam. */
  onCantTalk?: () => void;
  /** Every phase: leaves the session for 03VoicerecallON. The phase and
   * whatever transcript existed tell the caller how to log it — SPEC.md's
   * TurnOutcome only has 'Left (idle)' and 'Left (judging)'; a close
   * mid-Recording is treated like Cancel (nothing committed yet), so the
   * caller shouldn't log a turn for it. `latencyMs`/`flag` are only set when
   * `phase` is 'processing' — Close is the only *working* way out of
   * Processing; the discard icon and Send are visible there but disabled
   * (sprint-context.md, 2026-09-16, supersedes hiding them entirely). */
  onClose?: (phase: Phase, transcript: string, latencyMs?: number, flag?: LatencyFlag) => void;
  /** A call, lock or backgrounding interrupted a take mid-Recording. */
  onInterrupted?: (transcript: string) => void;
  /** The judge (or the ?latency=hang timeout) came back Silence: empty,
   * noise, a question, or no result in time. */
  onSilence?: (transcript: string, latencyMs: number, flag: LatencyFlag) => void;
  /** The judge reached a real verdict. */
  onVerdict?: (
    transcript: string,
    verdict: Verdict,
    conceptsHit: ConceptId[],
    latencyMs: number,
    flag: LatencyFlag
  ) => void;
}

/**
 * SPEC.md screen 10: the voice recall loop. Owns Idle, Recording (including
 * Still listening) and Processing; Verdict, Why?, Mic-off and Summary stay
 * separate screens the caller composes on top, the same "sits over this one"
 * model those screens already established while this one didn't exist yet.
 *
 * Recording's transcript comes from lib/recall/webSpeech.ts (the real
 * `webkitSpeechRecognition` wrapper, wired in once SPEC.md verification item
 * 0's spike ran, 2026-09-16) when the facilitator's /log pick is `live`, or
 * from lib/recall/scriptedTranscript.ts's stand-in otherwise — both return
 * the same `{ stop() }` shape, so this screen doesn't otherwise care which
 * one is streaming.
 */
export function LoopScreen({
  question,
  progress,
  showStatusBar = true,
  scriptedAnswer,
  latencyOverride,
  onStart,
  onSkipIdle,
  onCantTalk,
  onClose,
  onInterrupted,
  onSilence,
  onVerdict,
  micUnavailable = false,
  onGoToSettings,
}: LoopScreenProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [startingMic, setStartingMic] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [idleNotice, setIdleNotice] = useState<'empty' | 'silence'>('empty');
  const [stillListening, setStillListening] = useState(false);
  const [processingPhrase, setProcessingPhrase] = useState<ProcessingPhrase>('think');
  const [waveformBars, setWaveformBars] = useState(0);
  /** True for the accidental-tap guard window (ACCIDENTAL_TAP_MS) right
   * after Start, so Send can visibly dim instead of the tap being a silent
   * dead click — see the .sendGuard usage below. Cleared the instant either
   * the timer below fires or `transcript` goes non-empty (checked together
   * where this is read), matching handleSend's own guard condition exactly
   * so a genuinely fast real answer is never blocked, only dimmed briefly
   * before any speech has landed. */
  const [sendGuarded, setSendGuarded] = useState(false);

  const speechRef = useRef<{ stop: () => void } | null>(null);
  const recordingStartedAt = useRef(0);
  const processingStartedAt = useRef(0);
  const planRef = useRef<ProcessingPlan | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waveformTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sendGuardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stillListeningRef = useRef(false);
  const hasHeardSpeechRef = useRef(false);
  const phaseRef = useRef<Phase>('idle');
  const transcriptRef = useRef('');
  useEffect(() => {
    phaseRef.current = phase;
    transcriptRef.current = transcript;
    stillListeningRef.current = stillListening;
  });

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function clearSilenceTimer() {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
  }

  function clearWaveformTimer() {
    if (waveformTimerRef.current) clearInterval(waveformTimerRef.current);
    waveformTimerRef.current = null;
  }

  function clearSendGuardTimer() {
    if (sendGuardTimerRef.current) clearTimeout(sendGuardTimerRef.current);
    sendGuardTimerRef.current = null;
  }

  /** Rearms the real-silence clock (SILENCE_TIMEOUT_MS): called once when
   * Recording starts, then again on every interim result so genuine speech
   * keeps pushing "Still listening…" off. */
  function armSilenceTimer() {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => setStillListening(true), SILENCE_TIMEOUT_MS);
  }

  // Cleanup on unmount (the caller swaps screens once an outcome fires, but
  // Storybook/tests may unmount mid-take).
  useEffect(() => () => {
    speechRef.current?.stop();
    clearTimers();
    clearSilenceTimer();
    clearWaveformTimer();
    clearSendGuardTimer();
  }, []);

  // Interruptions (SPEC.md): a call, lock or backgrounding mid-Recording
  // discards the take and returns to Idle with the Silence copy, no attempt
  // used — logged as 'Interrupted' by the caller. Only Recording is
  // affected; Idle has nothing to interrupt and Processing keeps running
  // regardless (it isn't listening to anything).
  useEffect(() => {
    function handleInterruption() {
      if (phaseRef.current !== 'recording') return;
      speechRef.current?.stop();
      clearSilenceTimer();
      clearWaveformTimer();
      onInterrupted?.(transcriptRef.current);
      setPhase('idle');
      setIdleNotice('silence');
      setTranscript('');
      setStillListening(false);
      setWaveformBars(0);
      hasHeardSpeechRef.current = false;
      clearSendGuardTimer();
      setSendGuarded(false);
    }
    document.addEventListener('visibilitychange', handleInterruption);
    window.addEventListener('pagehide', handleInterruption);
    return () => {
      document.removeEventListener('visibilitychange', handleInterruption);
      window.removeEventListener('pagehide', handleInterruption);
    };
  }, [onInterrupted]);

  async function handleStart() {
    if (startingMic || phase !== 'idle') return;
    setStartingMic(true);
    const ok = await Promise.resolve(onStart ? onStart() : true);
    setStartingMic(false);
    if (!ok) return; // The caller shows the mic-off sheet instead.

    setIdleNotice('empty');
    setTranscript('');
    setStillListening(false);
    setWaveformBars(0);
    recordingStartedAt.current = Date.now();
    setPhase('recording');
    armSilenceTimer();

    setSendGuarded(true);
    clearSendGuardTimer();
    sendGuardTimerRef.current = setTimeout(() => setSendGuarded(false), ACCIDENTAL_TAP_MS);

    hasHeardSpeechRef.current = false;
    clearWaveformTimer();
    waveformTimerRef.current = setInterval(() => {
      if (!hasHeardSpeechRef.current || stillListeningRef.current) return;
      setWaveformBars((n) => Math.min(WAVEFORM_BAR_HEIGHTS.length, n + 1));
    }, WAVEFORM_REVEAL_INTERVAL_MS);

    const handleInterim = (textSoFar: string) => {
      hasHeardSpeechRef.current = true;
      setStillListening(false);
      armSilenceTimer();
      setTranscript(textSoFar);
    };

    if (scriptedAnswer === 'live' && isWebSpeechSupported()) {
      speechRef.current = startWebSpeech({
        onInterim: handleInterim,
        // Hides "Still listening…" the instant speech resumes, even after a
        // long gap — doesn't wait for the recognizer to actually transcribe
        // a word first, which can lag a beat behind real speech (2026-09-16,
        // your call). Rearms the silence timer too, same as an interim
        // result would: a speech-start with nothing ever transcribed behind
        // it (a stray noise, a false positive) should still let "Still
        // listening…" come back after another 3s of quiet, not suppress it
        // for the rest of the take.
        onSpeechStart: () => {
          setStillListening(false);
          armSilenceTimer();
        },
      });
    } else {
      const text = scriptedTextFor(scriptedAnswer, question);
      speechRef.current = startScriptedSpeech(text, {
        onInterim: handleInterim,
        onFinal: () => {
          // Streaming finished, but push-to-talk means recording keeps going
          // (no auto-endpointing, CLAUDE.md) until the student taps Send —
          // and no further interim ever arrives, so the silence timer above
          // will fire "Still listening…" on its own if Send isn't tapped.
        },
      });
    }
  }

  function handleCancel() {
    speechRef.current?.stop();
    clearSilenceTimer();
    clearWaveformTimer();
    clearSendGuardTimer();
    setSendGuarded(false);
    setStillListening(false);
    setPhase('idle');
    setTranscript('');
    setWaveformBars(0);
    hasHeardSpeechRef.current = false;
  }

  function handleSend() {
    if (phase !== 'recording') return;
    const elapsedMs = Date.now() - recordingStartedAt.current;
    speechRef.current?.stop();
    clearSilenceTimer();
    clearWaveformTimer();
    clearSendGuardTimer();
    setStillListening(false);
    const finalTranscript = transcript;

    if (elapsedMs < ACCIDENTAL_TAP_MS && finalTranscript.trim() === '') {
      // Accidental tap (SPEC.md "On Send" step 1): back to Idle silently,
      // nothing logged.
      setPhase('idle');
      setTranscript('');
      return;
    }

    setPhase('processing');
    setProcessingPhrase('think');
    processingStartedAt.current = Date.now();

    const plan = planProcessing(latencyOverride);
    planRef.current = plan;
    timersRef.current.push(
      setTimeout(() => setProcessingPhrase('checking'), 2000),
      setTimeout(() => setProcessingPhrase('almost'), 5000),
      setTimeout(() => {
        if (plan.hangs) {
          onSilence?.(finalTranscript, plan.durationMs, plan.flag);
          return;
        }
        const result = judge(finalTranscript, question);
        if (result.outcome === 'Silence') {
          onSilence?.(finalTranscript, plan.durationMs, plan.flag);
        } else {
          onVerdict?.(finalTranscript, result.outcome, result.conceptsHit, plan.durationMs, plan.flag);
        }
      }, plan.durationMs)
    );
  }

  const bubbleText = phase === 'processing' ? PROCESSING_COPY[processingPhrase] : question.prompt;

  return (
    <Screen
      showStatusBar={showStatusBar}
      topNavigation={
        <>
          {phase === 'idle' && micUnavailable && (
            <Snackbar variant="Error" action={{ label: 'Go back', onClick: () => onGoToSettings?.() }}>
              Your microphone is not available.
            </Snackbar>
          )}
          <AppBar
            variant="leftIconButtonOnly"
            leftIcon={<X size="100%" aria-hidden="true" />}
            leftLabel="Close"
            onLeftClick={() => {
              if (phase === 'processing') {
                const latencyMs = Date.now() - processingStartedAt.current;
                onClose?.(phase, transcript, latencyMs, planRef.current?.flag ?? 'normal');
              } else {
                onClose?.(phase, transcript);
              }
            }}
            slot={
              <>
                <ProgressIndicator thickness="16" progress={progress} />
                <XpChip />
              </>
            }
          />
        </>
      }
      middleContent={
        <div className={styles.content}>
          <div className={styles.knowie}>
            <div className={styles.questionRow}>
              <div className={styles.mascot} data-thinking={phase === 'processing' || undefined}>
                <span className={styles.mascotShadow} aria-hidden="true" />
                <MascotSlot
                  size="XL"
                  expression={phase === 'processing' ? 'thinking' : 'standby'}
                  className={styles.mascotArt}
                />
              </div>
              <div className={styles.bubble}>
                <span className={styles.bubbleTail} aria-hidden="true" />
                <p className={styles.bubbleText}>{bubbleText}</p>
              </div>
            </div>
            <AiDisclaimer />
          </div>
          <Transcript phase={phase} transcript={transcript} idleNotice={idleNotice} />
          {phase === 'recording' && (
            <p className={styles.stillListening} data-visible={stillListening || undefined}>
              Still listening…
            </p>
          )}
        </div>
      }
      bottomContent={
        <div className={styles.bottomStack}>
          {phase !== 'idle' && (
            <VoiceWaveform heights={WAVEFORM_BAR_HEIGHTS.slice(0, waveformBars)} animate={phase === 'processing'} />
          )}
          <ButtonGroup variant="Horizontal" size="L">
            <ButtonIcon
              variant="Secondary"
              size="L"
              icon={
                phase !== 'idle' ? (
                  <span key="discard" className={styles.iconSwap}>
                    <ArrowCounterClockwise size="100%" aria-hidden="true" />
                  </span>
                ) : (
                  <span key="skip" className={styles.iconSwap}>
                    <SkipIcon />
                  </span>
                )
              }
              aria-label={phase !== 'idle' ? 'Discard and start over' : 'Skip'}
              disabled={phase === 'processing'}
              onClick={phase === 'recording' ? handleCancel : phase === 'idle' ? onSkipIdle : undefined}
            />
            <ButtonVoice
              state={startingMic ? 'Loading' : phase !== 'idle' ? 'Recording' : 'Default'}
              ctaText={phase !== 'idle' ? 'Send' : 'Start'}
              disabled={phase === 'processing'}
              className={styles.sendGuard}
              style={
                phase === 'recording' && sendGuarded && transcript.trim() === '' ? { opacity: 0.4 } : undefined
              }
              leftIcon={
                phase !== 'idle' ? (
                  <span key="waveform" className={styles.iconSwap}>
                    <WaveformIcon size="100%" aria-hidden="true" />
                  </span>
                ) : (
                  <span key="mic" className={styles.iconSwap}>
                    <Microphone size="100%" aria-hidden="true" />
                  </span>
                )
              }
              onClick={phase === 'recording' ? handleSend : phase === 'idle' ? handleStart : undefined}
            />
          </ButtonGroup>
          {phase === 'idle' && (
            <Button variant="Secondary" size="L" onClick={onCantTalk}>
              Can&apos;t talk right now
            </Button>
          )}
        </div>
      }
    />
  );
}

/**
 * The bar row above the button group in Recording (Figma 06Talking →
 * 07KeepTalking → 08Talking-finished) and Processing (Figma's "Processing"
 * frame — the same 38-bar row, held over rather than reset). No Storybook
 * component covers this (component-gaps.md, same root cause as the
 * Processing mascot bob and the exam-plan hint arrow: no motion/decoration
 * component exists). `animate` gates the slow equalizer-style pulse — off
 * for Recording's bars, on while Processing.
 *
 * Bars reveal as a group, not one at a time (2026-09-16, your call): the
 * caller always passes the *first* N entries of `WAVEFORM_BAR_HEIGHTS`
 * (natural, already-correct Figma order), appended at the end — appending
 * never reflows a bar that's already on screen, so every bar's own local
 * position is fixed the moment it's added. The only thing that moves is
 * `.waveformGroup`'s own `transform`, recomputed every render
 * (`waveformGroupShift`) to keep the newest bar flush against the row's
 * right edge — a plain CSS `transition` on that one value is what makes the
 * whole group glide left together as it grows, instead of each bar having
 * its own separate pop-in. Keys are the bars' own natural index again
 * (stable under this append order, unlike the previous right-anchored
 * scheme this replaces).
 */
function VoiceWaveform({ heights, animate }: { heights: number[]; animate: boolean }) {
  return (
    <div
      className={styles.waveform}
      data-animate={animate || undefined}
      data-bar-count={heights.length}
      aria-hidden="true"
    >
      <div className={styles.waveformGroup} style={{ transform: `translateX(${waveformGroupShift(heights.length)}px)` }}>
        {heights.map((height, i) => (
          <span
            key={i}
            className={styles.waveformBar}
            style={{ height, '--waveform-bar-delay': `${-(i % 8) * 0.25}s` } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

/** Same hand-drawn skip-forward glyph ResultBtm's own Silence variant and
 * MicOffScreen already use — not promoted to a shared icon component; see
 * this screen's build notes. */
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

/** Static "⚡2", never counts (XP is out of scope). Duplicated per screen,
 * same as VerdictScreen/MicOffScreen/WhyScreen — not promoted (SPEC.md's own
 * exception for this screen's inline pieces). */
function XpChip() {
  return (
    <span className={styles.xpChip} role="img" aria-label="2 XP">
      <Lightning className={styles.xpIcon} aria-hidden="true" />
      <span aria-hidden="true">2</span>
    </span>
  );
}

/**
 * Idle shows a fixed state (Empty, or Silence after an interruption).
 * Recording and Processing show the real transcript, measured the same way
 * VerdictScreen's own Transcript helper anchors Overflow to the newest text
 * — simpler here since there's no sheet height to stay clear of.
 */
function Transcript({
  phase,
  transcript,
  idleNotice,
}: {
  phase: Phase;
  transcript: string;
  idleNotice: 'empty' | 'silence';
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    // Idle never renders the transcript area below (it always shows the
    // fixed Empty/Silence copy instead), so `overflowing` goes unused there
    // — nothing to reset, and it's remeasured fresh next time Recording
    // starts anyway.
    if (phase === 'idle') return;
    const area = areaRef.current;
    if (!area) return;
    const measure = () => {
      const text = area.querySelector('p');
      if (!text) return;
      const range = document.createRange();
      range.selectNodeContents(text);
      const textHeight = range.getBoundingClientRect().height;
      const css = getComputedStyle(area);
      const room = area.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom);
      const window = parseFloat(css.getPropertyValue('--size-illustration-4000'));
      setOverflowing(textHeight > Math.min(window, room));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    return () => observer.disconnect();
  }, [transcript, phase]);

  if (phase === 'idle') {
    return <TranscriptDisplay state={idleNotice === 'silence' ? 'Silence' : 'Empty'} />;
  }

  return (
    <div ref={areaRef} className={styles.transcriptArea} data-overflowing={overflowing || undefined}>
      <TranscriptDisplay state={overflowing ? 'Overflow' : 'Filled'} transcript={transcript} />
    </div>
  );
}
