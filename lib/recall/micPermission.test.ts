import { describe, expect, it, vi } from 'vitest';
import { requestMic, type MediaDevicesLike } from './micPermission';

function failingWith(name: string): MediaDevicesLike {
  return { getUserMedia: vi.fn().mockRejectedValue(Object.assign(new Error(name), { name })) };
}

describe('requestMic', () => {
  it('returns granted and stops every track it opened', async () => {
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }, { stop }] } as unknown as MediaStream;
    const mediaDevices: MediaDevicesLike = { getUserMedia: vi.fn().mockResolvedValue(stream) };

    await expect(requestMic(mediaDevices)).resolves.toBe('granted');
    expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(stop).toHaveBeenCalledTimes(2);
  });

  it('returns denied when the student refuses', async () => {
    await expect(requestMic(failingWith('NotAllowedError'))).resolves.toBe('denied');
  });

  it('returns unavailable when there is no microphone', async () => {
    await expect(requestMic(failingWith('NotFoundError'))).resolves.toBe('unavailable');
  });

  it('returns unavailable when the page cannot ask (no mediaDevices off HTTPS)', async () => {
    await expect(requestMic(undefined)).resolves.toBe('unavailable');
    await expect(requestMic({} as MediaDevicesLike)).resolves.toBe('unavailable');
  });

  it('returns unavailable for a rejection that is not an error object', async () => {
    await expect(requestMic({ getUserMedia: vi.fn().mockRejectedValue('nope') })).resolves.toBe('unavailable');
  });
});
