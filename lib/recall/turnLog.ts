import type { ConceptId, LatencyFlag, NodeId, QuestionId, Round, TurnOutcome } from './types';

/**
 * Written the moment a node is opened, before the gate or the first question,
 * so every session shows up in the log even if it ends with no answers.
 */
export interface SessionStartRow {
  kind: 'session';
  /** Counts up from 1 each time a node is opened; reset by Clear log. */
  session: number;
  node: NodeId;
  /** ISO string. Shown in local time. */
  timestamp: string;
}

/**
 * One attempt at a question that ended somehow. Written by the recall loop,
 * read on the hidden /log route. Columns agreed in sprint-context.md
 * (2026-09-14).
 */
export interface TurnRow {
  kind: 'turn';
  session: number;
  node: NodeId;
  round: Round;
  question: QuestionId;
  /** The final text that was judged. Empty when nothing was judged. */
  transcript: string;
  /** Concepts the judge found, in A/B/C order. Empty when nothing was judged. */
  conceptsHit: ConceptId[];
  outcome: TurnOutcome;
  /**
   * Milliseconds on the loading screen, which starts at Send: until the sheet
   * appeared, or until the student gave up (Skipped or Left (judging) while
   * judging). Null for turns that never reached Send: Skipped at idle,
   * Left (idle), Interrupted, Mic off, Tried typing.
   */
  latencyMs: number | null;
  /** Null exactly when latencyMs is null. */
  latencyFlag: LatencyFlag | null;
  /** When the turn ended, as an ISO string. Shown in local time. */
  timestamp: string;
}

export type LogRow = SessionStartRow | TurnRow;

/** Saves that didn't reach storage since the log was last cleared, so /log
 * can warn that rows are missing. */
export interface SaveStatus {
  failedSaves: number;
  /** ISO string of the most recent failure, or null. */
  lastFailedAt: string | null;
}

/** The subset of the Web Storage API this module uses, so tests can pass an
 * in-memory stand-in (Node has no localStorage). */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

interface StoredLog {
  lastSession: number;
  rows: LogRow[];
}

/** Versioned, so a later change to the row shape can't misread old rows. */
export const STORAGE_KEY = 'voice-recall:turn-log:v2';
/** Kept apart from the log: when a big write fails for quota, this small one
 * may still land, so the warning survives the app being closed. */
export const SAVE_FAILURE_KEY = 'voice-recall:turn-log-save-failures:v1';

const EMPTY_ROWS: readonly LogRow[] = Object.freeze([]);
const NO_FAILURES: SaveStatus = Object.freeze({ failedSaves: 0, lastFailedAt: null });

export function createTurnLog(getStorage: () => StorageLike | null, now = () => new Date()) {
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  // getRows and getSaveStatus must return the same object until something
  // changes, or useSyncExternalStore re-renders forever. Both are cached
  // against the raw stored string, so writes from anywhere still invalidate.
  let cachedRaw: string | null = null;
  let cachedRows: readonly LogRow[] = EMPTY_ROWS;
  let cachedStatusKey = '0|';
  let cachedStatus: SaveStatus = NO_FAILURES;

  // Failures also live in memory: if storage is fully blocked, the marker
  // can't be written either, and memory is all that's left. It holds for as
  // long as the app stays open (/log is reached without a reload).
  let memoryFailures = 0;
  let memoryLastFailedAt: string | null = null;

  // Storage can throw (Safari private mode, blocked site data, full quota).
  // A broken log must never break the student's session, so every access
  // fails soft: reads come back empty, writes report false.
  function read(key: string): string | null {
    try {
      return getStorage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  function parse(raw: string | null): StoredLog {
    if (!raw) return { lastSession: 0, rows: [] };
    try {
      const data = JSON.parse(raw) as StoredLog;
      if (Array.isArray(data.rows) && typeof data.lastSession === 'number') return data;
    } catch {
      // Fall through: unreadable data reads as an empty log.
    }
    return { lastSession: 0, rows: [] };
  }

  function storedFailures(): SaveStatus {
    try {
      const data = JSON.parse(read(SAVE_FAILURE_KEY) ?? 'null') as SaveStatus | null;
      if (data && typeof data.failedSaves === 'number') return data;
    } catch {
      // Unreadable marker: fall back to memory.
    }
    return NO_FAILURES;
  }

  function recordFailure() {
    memoryFailures += 1;
    memoryLastFailedAt = now().toISOString();
    try {
      const stored = storedFailures();
      const status: SaveStatus = {
        failedSaves: Math.max(stored.failedSaves + 1, memoryFailures),
        lastFailedAt: memoryLastFailedAt,
      };
      getStorage()?.setItem(SAVE_FAILURE_KEY, JSON.stringify(status));
    } catch {
      // Nowhere to write it; the in-memory count still shows on /log.
    }
  }

  function write(log: StoredLog): boolean {
    let saved = false;
    try {
      const storage = getStorage();
      if (storage) {
        storage.setItem(STORAGE_KEY, JSON.stringify(log));
        saved = true;
      }
    } catch {
      saved = false;
    }
    if (!saved) recordFailure();
    notify();
    return saved;
  }

  return {
    /** Every row, oldest first: session starts and turns interleaved. Stable
     * between changes. */
    getRows(): readonly LogRow[] {
      const raw = read(STORAGE_KEY);
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedRows = Object.freeze(parse(raw).rows);
      }
      return cachedRows;
    },

    /** Failed saves since the last Clear log. Stable between changes. */
    getSaveStatus(): SaveStatus {
      const stored = storedFailures();
      const failedSaves = Math.max(stored.failedSaves, memoryFailures);
      const lastFailedAt = memoryLastFailedAt ?? stored.lastFailedAt;
      const key = `${failedSaves}|${lastFailedAt ?? ''}`;
      if (key !== cachedStatusKey) {
        cachedStatusKey = key;
        cachedStatus = failedSaves === 0 ? NO_FAILURES : Object.freeze({ failedSaves, lastFailedAt });
      }
      return cachedStatus;
    },

    /** Call when a node opens. Writes the session's start row and returns its
     * number, which every turn in the session carries. */
    startSession(node: NodeId): number {
      const log = parse(read(STORAGE_KEY));
      const session = log.lastSession + 1;
      const row: SessionStartRow = { kind: 'session', session, node, timestamp: now().toISOString() };
      write({ lastSession: session, rows: [...log.rows, row] });
      return session;
    },

    /** Returns false if the turn couldn't be saved; /log will say so. */
    appendTurn(turn: Omit<TurnRow, 'kind'>): boolean {
      const log = parse(read(STORAGE_KEY));
      return write({ ...log, rows: [...log.rows, { kind: 'turn', ...turn }] });
    },

    /** Empties the log, forgets past save failures, and restarts session
     * numbering at 1. */
    clear(): boolean {
      memoryFailures = 0;
      memoryLastFailedAt = null;
      let cleared = true;
      try {
        const storage = getStorage();
        storage?.removeItem(STORAGE_KEY);
        storage?.removeItem(SAVE_FAILURE_KEY);
      } catch {
        cleared = false;
      }
      notify();
      return cleared;
    },

    /** For useSyncExternalStore. */
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** The app's log, on the device's localStorage. On the server (prerender)
 * there's no storage, so nothing is read or written there. */
export const turnLog = createTurnLog(() =>
  typeof window === 'undefined' ? null : window.localStorage
);

/** useSyncExternalStore's server snapshots: nothing is logged on the server. */
export function getServerRows(): readonly LogRow[] {
  return EMPTY_ROWS;
}
export function getServerSaveStatus(): SaveStatus {
  return NO_FAILURES;
}

// ---- Display and CSV -------------------------------------------------------

export function formatSession(session: number): string {
  return `S${session}`;
}

/** Seconds, one decimal ("3.2"). Empty when there's no latency. */
export function formatLatency(latencyMs: number | null): string {
  return latencyMs === null ? '' : (latencyMs / 1000).toFixed(1);
}

/** Local time, "2026-09-14 20:15:03". */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/** What a session start row shows in the outcome column. */
export const SESSION_STARTED = 'Session started';

export const CSV_HEADER = [
  'session',
  'node',
  'round',
  'question',
  'transcript',
  'concepts hit',
  'outcome',
  'latency (s)',
  'latency flag',
  'timestamp',
] as const;

/** RFC 4180: quote a field holding a comma, quote or line break, and double
 * any quotes inside it. Transcripts can hold all three. */
function csvField(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvRow(row: LogRow): (string | number)[] {
  if (row.kind === 'session') {
    return [formatSession(row.session), row.node, '', '', '', '', SESSION_STARTED, '', '', formatTimestamp(row.timestamp)];
  }
  return [
    formatSession(row.session),
    row.node,
    row.round,
    row.question,
    row.transcript,
    row.conceptsHit.join(', '),
    row.outcome,
    formatLatency(row.latencyMs),
    row.latencyFlag ?? '',
    formatTimestamp(row.timestamp),
  ];
}

/** The log as CSV, header first, CRLF line endings (RFC 4180). */
export function toCsv(rows: readonly LogRow[]): string {
  return [[...CSV_HEADER], ...rows.map(csvRow)].map((row) => row.map(csvField).join(',')).join('\r\n');
}
