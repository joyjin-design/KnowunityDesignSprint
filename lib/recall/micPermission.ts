/** What asking for the microphone came back with. */
export type MicRequestResult = 'granted' | 'denied' | 'unavailable';

export type MediaDevicesLike = Pick<MediaDevices, 'getUserMedia'>;

/**
 * Asks for the mic the only way a web page can: by opening an audio stream,
 * which shows the real iOS prompt the first time. The stream is stopped
 * straight away; the loop opens its own when recording starts.
 *
 * - `granted`: the stream opened.
 * - `denied`: the student, or iOS Settings, refused (`NotAllowedError`).
 * - `unavailable`: there's no way to ask. No `mediaDevices` means the page
 *   isn't on HTTPS or localhost; `NotFoundError` means no microphone. Any
 *   other failure lands here too.
 */
export async function requestMic(mediaDevices: MediaDevicesLike | undefined): Promise<MicRequestResult> {
  if (typeof mediaDevices?.getUserMedia !== 'function') return 'unavailable';
  try {
    const stream = await mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return 'granted';
  } catch (error) {
    const name = typeof error === 'object' && error !== null ? (error as { name?: unknown }).name : undefined;
    return name === 'NotAllowedError' ? 'denied' : 'unavailable';
  }
}
