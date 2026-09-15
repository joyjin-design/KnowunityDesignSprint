import type { StorageLike } from './turnLog';

/**
 * The facilitator's forced latency for the next turns, set on `/log`
 * (sprint-context.md, 2026-09-14: "a latency switch (normal / slow / hang)
 * on /log, because `?latency=` can't be typed there"). `normal` means no
 * override: the loop's own ~1-in-5 random slow chance still applies.
 * `slow` and `hang` correspond to the `?latency=slow` / `?latency=hang` URL
 * flags and SPEC.md's `LatencyFlag` values `slow (forced)` / `hang`.
 */
export type LatencyOverride = 'normal' | 'slow' | 'hang';

const STORAGE_KEY = 'voice-recall:latency-override:v1';
const VALUES: readonly LatencyOverride[] = ['normal', 'slow', 'hang'];

/** Fails soft, same as turnLog: an unreadable or blocked value reads as
 * `normal` rather than breaking the session. Also doubles as the
 * `useSyncExternalStore` client snapshot getter. */
export function getLatencyOverride(getStorage: () => StorageLike | null): LatencyOverride {
  try {
    const raw = getStorage()?.getItem(STORAGE_KEY);
    if (raw && (VALUES as readonly string[]).includes(raw)) return raw as LatencyOverride;
  } catch {
    // Fall through to the default.
  }
  return 'normal';
}

/** Storage isn't readable on the server (no `window`); this is the
 * `useSyncExternalStore` server snapshot, same shape as turnLog's
 * `getServerRows`. */
export function getServerLatencyOverride(): LatencyOverride {
  return 'normal';
}

const listeners = new Set<() => void>();

/** For `useSyncExternalStore`: notified after every write, successful or
 * not, so a subscriber re-reads storage and reflects what's actually there
 * rather than what was merely asked for. */
export function subscribeLatencyOverride(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Returns false if it couldn't be saved (storage blocked or full); either
 * way subscribers are notified to re-read the real stored value. */
export function setLatencyOverride(
  getStorage: () => StorageLike | null,
  value: LatencyOverride
): boolean {
  let saved = false;
  try {
    const storage = getStorage();
    if (storage) {
      storage.setItem(STORAGE_KEY, value);
      saved = true;
    }
  } catch {
    saved = false;
  }
  listeners.forEach((listener) => listener());
  return saved;
}
