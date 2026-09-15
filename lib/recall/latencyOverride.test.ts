import { describe, expect, test, vi } from 'vitest';
import { getLatencyOverride, setLatencyOverride, subscribeLatencyOverride } from './latencyOverride';
import type { StorageLike } from './turnLog';

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe('latency override', () => {
  test('defaults to normal with nothing stored', () => {
    const storage = memoryStorage();
    expect(getLatencyOverride(() => storage)).toBe('normal');
  });

  test('round-trips a stored value', () => {
    const storage = memoryStorage();
    expect(setLatencyOverride(() => storage, 'slow')).toBe(true);
    expect(getLatencyOverride(() => storage)).toBe('slow');
    setLatencyOverride(() => storage, 'hang');
    expect(getLatencyOverride(() => storage)).toBe('hang');
  });

  test('an unreadable stored value reads as normal, not a crash', () => {
    const storage = memoryStorage();
    storage.data.set('voice-recall:latency-override:v1', 'nonsense');
    expect(getLatencyOverride(() => storage)).toBe('normal');
  });

  test('no storage at all reads as normal and reports the write failed', () => {
    expect(getLatencyOverride(() => null)).toBe('normal');
    expect(setLatencyOverride(() => null, 'hang')).toBe(false);
  });

  test('a blocked storage fails soft on both read and write', () => {
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
    expect(getLatencyOverride(() => blocked)).toBe('normal');
    expect(setLatencyOverride(() => blocked, 'slow')).toBe(false);
  });

  test('every write notifies subscribers, so useSyncExternalStore re-reads the real value', () => {
    const storage = memoryStorage();
    const listener = vi.fn();
    const unsubscribe = subscribeLatencyOverride(listener);

    setLatencyOverride(() => storage, 'slow');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    setLatencyOverride(() => storage, 'hang');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('a failed write still notifies, so the UI reflects what was actually saved', () => {
    const blocked: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {},
    };
    const listener = vi.fn();
    const unsubscribe = subscribeLatencyOverride(listener);
    expect(setLatencyOverride(() => blocked, 'hang')).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
