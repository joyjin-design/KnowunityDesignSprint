'use client';

import { useState, useSyncExternalStore } from 'react';
import { Button } from '@/app/components/Button';
import { ButtonGroup } from '@/app/components/ButtonGroup';
import {
  getLatencyOverride,
  getServerLatencyOverride,
  setLatencyOverride,
  subscribeLatencyOverride,
  type LatencyOverride,
} from '@/lib/recall/latencyOverride';
import {
  SCRIPTED_ANSWER_LABEL,
  getScriptedAnswer,
  getServerScriptedAnswer,
  setScriptedAnswer,
  subscribeScriptedAnswer,
  type ScriptedAnswerId,
} from '@/lib/recall/scriptedTranscript';
import type { LogRow, SaveStatus } from '@/lib/recall/turnLog';
import {
  SESSION_STARTED,
  formatLatency,
  formatSession,
  formatTimestamp,
  getServerRows,
  getServerSaveStatus,
  toCsv,
  turnLog,
} from '@/lib/recall/turnLog';
import type { TurnOutcome } from '@/lib/recall/types';
import styles from './LogScreen.module.css';

const LATENCY_LABEL: Record<LatencyOverride, string> = {
  normal: 'Normal',
  slow: 'Slow (7–8s)',
  hang: 'Hang (15s)',
};

/** Colours the outcome by the same vocabulary `resultBtm` uses: Pass is a
 * success, Fail and Silence both read as `feedback/error` (Silence reuses
 * that token on the real component too — design-system.md), Partial stands
 * in on `accent/blue` (the same stand-in `resultBtm` uses, sprint-context.md
 * 2026-09-11), and every other outcome (Skipped, Interrupted, Mic off, Left,
 * Tried typing, Session started) is informational, not a verdict. */
function outcomeTone(outcome: TurnOutcome | typeof SESSION_STARTED): 'success' | 'partial' | 'error' | 'neutral' {
  if (outcome === 'Pass') return 'success';
  if (outcome === 'Partial') return 'partial';
  if (outcome === 'Fail' || outcome === 'Silence') return 'error';
  return 'neutral';
}

export interface LogScreenProps {
  rows: readonly LogRow[];
  saveStatus: SaveStatus;
  latency: LatencyOverride;
  onLatencyChange: (value: LatencyOverride) => void;
  /** Real STT is deferred (SPEC.md verification item 0's spike hasn't run):
   * this picks which of the current question's sample answers Recording
   * plays next, standing in for what the recognizer would have heard. */
  scriptedAnswer: ScriptedAnswerId;
  onScriptedAnswerChange: (value: ScriptedAnswerId) => void;
  /** Returns whether the copy actually reached the clipboard, so the button
   * can say if it didn't. */
  onCopyCsv: () => boolean | Promise<boolean>;
  confirmingClear: boolean;
  onRequestClear: () => void;
  onConfirmClear: () => void;
  onCancelClear: () => void;
}

/**
 * SPEC.md screen 2: the hidden `/log` route, facilitator only, never linked
 * from the student flow. Not composed inside `Screen` — there's no mascot or
 * appBar here, just a plain 390px dark page, per CLAUDE.md's width/mode rule.
 * States: no turns yet, turns listed, the Clear log confirm.
 */
export function LogScreen({
  rows,
  saveStatus,
  latency,
  onLatencyChange,
  scriptedAnswer,
  onScriptedAnswerChange,
  onCopyCsv,
  confirmingClear,
  onRequestClear,
  onConfirmClear,
  onCancelClear,
}: LogScreenProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function handleCopy() {
    const ok = await onCopyCsv();
    setCopyState(ok ? 'copied' : 'failed');
    setTimeout(() => setCopyState('idle'), 1500);
  }

  const copyLabel = copyState === 'copied' ? 'Copied' : copyState === 'failed' ? "Couldn't copy" : 'Copy as CSV';
  const empty = rows.length === 0;

  return (
    <div className={styles.page}>
      <div className={styles.scroll}>
        <header className={styles.header}>
          <h1 className={styles.title}>Turn log</h1>
          <p className={styles.subtitle}>Facilitator only. Never linked from the student flow.</p>
        </header>

        {saveStatus.failedSaves > 0 && (
          <div className={styles.saveWarning} role="alert">
            <p className={styles.saveWarningTitle}>The last save failed.</p>
            <p className={styles.saveWarningDetail}>
              {saveStatus.failedSaves} since the log was last cleared
              {saveStatus.lastFailedAt ? ` · last at ${formatTimestamp(saveStatus.lastFailedAt)}` : ''}
            </p>
          </div>
        )}

        <div className={styles.latencyRow}>
          <span className={styles.latencyLabel} id="latency-label">
            Latency
          </span>
          <div className={styles.latencyOptions} role="radiogroup" aria-labelledby="latency-label">
            {(Object.keys(LATENCY_LABEL) as LatencyOverride[]).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={latency === value}
                className={styles.latencyOption}
                data-selected={latency === value || undefined}
                onClick={() => onLatencyChange(value)}
              >
                {LATENCY_LABEL[value]}
              </button>
            ))}
          </div>
        </div>

        {/* Real STT is deferred (SPEC.md verification item 0), so this picks
            what Recording "hears" next — same facilitator-only control
            pattern as Latency above, never seen by a student. */}
        <div className={styles.latencyRow}>
          <span className={styles.latencyLabel} id="scripted-answer-label">
            Next answer
          </span>
          <div className={styles.latencyOptions} role="radiogroup" aria-labelledby="scripted-answer-label">
            {(Object.keys(SCRIPTED_ANSWER_LABEL) as ScriptedAnswerId[]).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={scriptedAnswer === value}
                className={styles.latencyOption}
                data-selected={scriptedAnswer === value || undefined}
                onClick={() => onScriptedAnswerChange(value)}
              >
                {SCRIPTED_ANSWER_LABEL[value]}
              </button>
            ))}
          </div>
        </div>

        {empty ? (
          <p className={styles.empty}>No turns yet.</p>
        ) : (
          <ol className={styles.list}>
            {rows.map((row, index) =>
              row.kind === 'session' ? (
                <li key={index} className={styles.sessionDivider}>
                  <span>
                    {formatSession(row.session)} · Node {row.node} · {SESSION_STARTED}
                  </span>
                  <span>{formatTimestamp(row.timestamp)}</span>
                </li>
              ) : (
                <li key={index} className={styles.turnCard}>
                  <div className={styles.turnHeader}>
                    <span className={styles.turnMeta}>
                      {formatSession(row.session)} · Node {row.node} · {row.question} · Round {row.round}
                    </span>
                    <span className={styles.outcome} data-tone={outcomeTone(row.outcome)}>
                      {row.outcome}
                    </span>
                  </div>
                  {row.transcript && <p className={styles.transcript}>“{row.transcript}”</p>}
                  {row.conceptsHit.length > 0 && (
                    <p className={styles.meta}>Concepts hit: {row.conceptsHit.join(', ')}</p>
                  )}
                  <div className={styles.turnFooter}>
                    <span>
                      {row.latencyMs === null
                        ? '—'
                        : `${formatLatency(row.latencyMs)}s (${row.latencyFlag})`}
                    </span>
                    <span>{formatTimestamp(row.timestamp)}</span>
                  </div>
                </li>
              )
            )}
          </ol>
        )}
      </div>

      {!empty && (
        <div className={styles.actions}>
          {confirmingClear ? (
            <>
              <p className={styles.confirmText}>Clear the log? This can&apos;t be undone.</p>
              <ButtonGroup variant="Vertical" size="L">
                <Button variant="Primary" size="L" onClick={onConfirmClear}>
                  Clear log
                </Button>
                <Button variant="Secondary" size="L" onClick={onCancelClear}>
                  Cancel
                </Button>
              </ButtonGroup>
            </>
          ) : (
            <ButtonGroup variant="Vertical" size="L">
              <Button variant="Primary" size="L" onClick={handleCopy}>
                {copyLabel}
              </Button>
              <Button variant="Secondary" size="L" onClick={onRequestClear}>
                Clear log
              </Button>
            </ButtonGroup>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The real, stateful `/log` page: subscribes to the on-device turn log and
 * the latency override, and does the actual clipboard write and clear.
 */
export function LogPage() {
  const rows = useSyncExternalStore(turnLog.subscribe, turnLog.getRows, getServerRows);
  const saveStatus = useSyncExternalStore(turnLog.subscribe, turnLog.getSaveStatus, getServerSaveStatus);
  const latency = useSyncExternalStore(
    subscribeLatencyOverride,
    () => getLatencyOverride(() => window.localStorage),
    getServerLatencyOverride
  );
  const scriptedAnswer = useSyncExternalStore(
    subscribeScriptedAnswer,
    () => getScriptedAnswer(() => window.localStorage),
    getServerScriptedAnswer
  );
  const [confirmingClear, setConfirmingClear] = useState(false);

  function handleLatencyChange(value: LatencyOverride) {
    setLatencyOverride(() => window.localStorage, value);
  }

  function handleScriptedAnswerChange(value: ScriptedAnswerId) {
    setScriptedAnswer(() => window.localStorage, value);
  }

  async function handleCopyCsv() {
    try {
      await navigator.clipboard.writeText(toCsv(rows));
      return true;
    } catch {
      return false;
    }
  }

  function handleConfirmClear() {
    turnLog.clear();
    setConfirmingClear(false);
  }

  return (
    <LogScreen
      rows={rows}
      saveStatus={saveStatus}
      latency={latency}
      onLatencyChange={handleLatencyChange}
      scriptedAnswer={scriptedAnswer}
      onScriptedAnswerChange={handleScriptedAnswerChange}
      onCopyCsv={handleCopyCsv}
      confirmingClear={confirmingClear}
      onRequestClear={() => setConfirmingClear(true)}
      onConfirmClear={handleConfirmClear}
      onCancelClear={() => setConfirmingClear(false)}
    />
  );
}
