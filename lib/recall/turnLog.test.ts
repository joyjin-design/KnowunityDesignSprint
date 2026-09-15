import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CSV_HEADER,
  SAVE_FAILURE_KEY,
  STORAGE_KEY,
  createTurnLog,
  formatLatency,
  formatTimestamp,
  toCsv,
  type LogRow,
  type StorageLike,
  type TurnRow,
} from './turnLog';
import { toResultVariant } from './types';

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

// Built from local time parts, so formatTimestamp's local output is the same
// in any time zone the tests run in.
const AT = new Date(2026, 8, 14, 20, 15, 3);
const clock = () => AT;

function turn(overrides: Partial<Omit<TurnRow, 'kind'>> = {}): Omit<TurnRow, 'kind'> {
  return {
    session: 1,
    node: 1,
    round: 1,
    question: 'Q1',
    transcript: 'The nucleus is the control center and it holds the DNA',
    conceptsHit: ['A', 'B'],
    outcome: 'Pass',
    latencyMs: 3200,
    latencyFlag: 'normal',
    timestamp: AT.toISOString(),
    ...overrides,
  };
}

const turnsOnly = (rows: readonly LogRow[]) => rows.filter((row) => row.kind === 'turn');

describe('turn log storage', () => {
  let storage: ReturnType<typeof memoryStorage>;
  let log: ReturnType<typeof createTurnLog>;

  beforeEach(() => {
    storage = memoryStorage();
    log = createTurnLog(() => storage, clock);
  });

  test('starts empty', () => {
    expect(log.getRows()).toEqual([]);
  });

  test('opening a node writes a session row, even if no turn follows', () => {
    expect(log.startSession(2)).toBe(1);
    expect(log.getRows()).toEqual([
      { kind: 'session', session: 1, node: 2, timestamp: AT.toISOString() },
    ]);
  });

  test('appends turns after their session row, and keeps them across instances', () => {
    log.startSession(1);
    log.appendTurn(turn({ question: 'Q1' }));
    log.appendTurn(turn({ question: 'Q2', outcome: 'Partial' }));
    const reopened = createTurnLog(() => storage, clock);
    expect(reopened.getRows().map((row) => row.kind)).toEqual(['session', 'turn', 'turn']);
    expect(turnsOnly(reopened.getRows()).map((row) => row.question)).toEqual(['Q1', 'Q2']);
  });

  test('numbers sessions from 1, and Clear log starts them again', () => {
    expect(log.startSession(1)).toBe(1);
    expect(log.startSession(1)).toBe(2);
    log.appendTurn(turn({ session: 2 }));
    log.clear();
    expect(log.getRows()).toEqual([]);
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
    expect(log.startSession(1)).toBe(1);
  });

  test('returns the same array until the log changes', () => {
    log.appendTurn(turn());
    const first = log.getRows();
    expect(log.getRows()).toBe(first);
    log.appendTurn(turn({ question: 'Q2' }));
    expect(log.getRows()).not.toBe(first);
  });

  test('notices a write made outside this instance', () => {
    const other = createTurnLog(() => storage, clock);
    expect(log.getRows()).toHaveLength(0);
    other.appendTurn(turn());
    expect(log.getRows()).toHaveLength(1);
  });

  test('tells subscribers about every change, and stops after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = log.subscribe(listener);
    log.startSession(1);
    log.appendTurn(turn());
    log.clear();
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
    log.appendTurn(turn());
    expect(listener).toHaveBeenCalledTimes(3);
  });

  test('reads unreadable data as an empty log', () => {
    storage.setItem(STORAGE_KEY, '{not json');
    expect(log.getRows()).toEqual([]);
    storage.setItem(STORAGE_KEY, JSON.stringify({ rows: 'nope' }));
    expect(log.getRows()).toEqual([]);
  });
});

describe('save failures', () => {
  test('a working log reports no failures, as a stable object', () => {
    const storage = memoryStorage();
    const log = createTurnLog(() => storage, clock);
    log.appendTurn(turn());
    expect(log.getSaveStatus()).toEqual({ failedSaves: 0, lastFailedAt: null });
    expect(log.getSaveStatus()).toBe(log.getSaveStatus());
  });

  test('when storage is blocked, reads are empty, writes return false, and the failures are counted in memory', () => {
    const blocked: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const log = createTurnLog(() => blocked, clock);
    const listener = vi.fn();
    log.subscribe(listener);

    expect(log.getRows()).toEqual([]);
    expect(log.startSession(1)).toBe(1);
    expect(log.appendTurn(turn())).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(log.getSaveStatus()).toEqual({ failedSaves: 2, lastFailedAt: AT.toISOString() });
    expect(log.clear()).toBe(false);
    expect(log.getSaveStatus()).toEqual({ failedSaves: 0, lastFailedAt: null });
  });

  test('when only the big log write fails (full quota), the failure survives the app closing', () => {
    const storage = memoryStorage();
    const quota: StorageLike = {
      ...storage,
      setItem: (key, value) => {
        if (key === STORAGE_KEY) throw new Error('QuotaExceededError');
        storage.setItem(key, value);
      },
    };
    createTurnLog(() => quota, clock).appendTurn(turn());

    const reopened = createTurnLog(() => storage, clock);
    expect(reopened.getSaveStatus()).toEqual({ failedSaves: 1, lastFailedAt: AT.toISOString() });
    reopened.clear();
    expect(storage.data.has(SAVE_FAILURE_KEY)).toBe(false);
    expect(reopened.getSaveStatus().failedSaves).toBe(0);
  });

  test('no storage at all (server prerender) counts as a failed save', () => {
    const serverSide = createTurnLog(() => null, clock);
    expect(serverSide.getRows()).toEqual([]);
    expect(serverSide.appendTurn(turn())).toBe(false);
    expect(serverSide.getSaveStatus().failedSaves).toBe(1);
  });
});

describe('formatting', () => {
  test('latency is seconds with one decimal, blank when absent', () => {
    expect(formatLatency(3200)).toBe('3.2');
    expect(formatLatency(15000)).toBe('15.0');
    expect(formatLatency(null)).toBe('');
  });

  test('timestamp is local time', () => {
    expect(formatTimestamp(AT.toISOString())).toBe('2026-09-14 20:15:03');
  });
});

describe('CSV', () => {
  const lines = (csv: string) => csv.split('\r\n');
  const asRow = (t: Omit<TurnRow, 'kind'>): TurnRow => ({ kind: 'turn', ...t });

  test('an empty log is just the header', () => {
    expect(toCsv([])).toBe(CSV_HEADER.join(','));
  });

  test('a session row fills only session, node, outcome and timestamp', () => {
    const csv = toCsv([{ kind: 'session', session: 3, node: 2, timestamp: AT.toISOString() }]);
    expect(lines(csv)[1]).toBe('S3,2,,,,,Session started,,,2026-09-14 20:15:03');
  });

  test('writes one row per turn in column order', () => {
    const csv = toCsv([asRow(turn({ transcript: 'It holds the DNA', conceptsHit: ['A'] }))]);
    expect(lines(csv)[1]).toBe('S1,1,1,Q1,It holds the DNA,A,Pass,3.2,normal,2026-09-14 20:15:03');
  });

  test('quotes fields with commas, quotes and line breaks', () => {
    const csv = toCsv([asRow(turn({ transcript: 'Well, it\'s the "control center"\nand it holds DNA' }))]);
    expect(csv).toContain('"Well, it\'s the ""control center""\nand it holds DNA"');
    expect(csv).toContain(',"A, B",');
  });

  test('giving up on the loading screen keeps the time spent waiting', () => {
    const csv = toCsv([
      asRow(turn({ outcome: 'Left (judging)', transcript: 'It makes energy', conceptsHit: [], latencyMs: 6400, latencyFlag: 'slow (random)' })),
    ]);
    expect(lines(csv)[1]).toBe('S1,1,1,Q1,It makes energy,,Left (judging),6.4,slow (random),2026-09-14 20:15:03');
  });

  test('turns that never reached Send leave transcript, concepts and latency blank', () => {
    const csv = toCsv([
      asRow(turn({ outcome: 'Left (idle)', transcript: '', conceptsHit: [], latencyMs: null, latencyFlag: null })),
    ]);
    expect(lines(csv)[1]).toBe('S1,1,1,Q1,,,Left (idle),,,2026-09-14 20:15:03');
  });
});

describe('toResultVariant', () => {
  test("maps the judge's words onto ResultBtm's", () => {
    expect(toResultVariant('Pass')).toBe('Success');
    expect(toResultVariant('Partial')).toBe('Partial');
    expect(toResultVariant('Fail')).toBe('Error');
    expect(toResultVariant('Silence')).toBe('Silence');
  });
});
