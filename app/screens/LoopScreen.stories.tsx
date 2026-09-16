import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { QUESTIONS } from '@/lib/recall/questions';
import { LoopScreen } from './LoopScreen';

const DESCRIPTION = `
**SPEC.md screen 10: the voice recall loop.** Owns Idle, Recording (including Still listening) and Processing. Verdict, Why?, Mic-off and Summary stay separate screens the caller composes on top.

**Recording's transcript** comes from \`lib/recall/scriptedTranscript.ts\`'s facilitator-controlled stand-in in every story here (\`scriptedAnswer\` is always a fixed sample, for deterministic play functions) — the real recognizer (\`lib/recall/webSpeech.ts\`, \`scriptedAnswer="live"\`) needs an actual mic and isn't exercised in Storybook.

**Still listening…** shows on real silence now (2026-09-16): no new interim result from either speech source for 3s, cleared the moment one arrives or the take ends — not a word count, and not tied to a recognizer restart.

**The waveform row** above the button group (Figma 06Talking → 07KeepTalking → 08Talking-finished) reveals bars as words are recognized, holds whatever it last showed into Processing unchanged, and pulses there like a slow equalizer. Bar heights are literal geometry transcribed off Figma, not tokens (component-gaps.md).

**Actions:**
- Idle: **Start** (with a brief mic re-check first — resolving \`false\` means the caller is about to show the mic-off sheet), **Skip** (next question, no attempt), **Can't talk right now** (leaves the session).
- Recording: the discard icon **cancels** back to Idle (nothing logged), **Send** moves to Processing (or drops silently back to Idle if under ~1s with nothing heard — the accidental tap).
- Processing: the discard icon and buttonVoice stay on screen, frozen at Recording's exact look, but disabled (2026-09-16 — supersedes the 2026-09-15 "hidden entirely" decision); **Close** (top app bar) is the only actually working way out, and always leaves the session.

**Built inline (component-gaps.md):** the speech bubble with its tail, the mascot's shadow and thinking-loop animation, the XP chip, and the waveform row — same duplicated pattern as VerdictScreen/MicOffScreen/WhyScreen.
`;

const meta = {
  title: 'Screens/LoopScreen',
  component: LoopScreen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: DESCRIPTION } },
  },
  args: {
    question: QUESTIONS.Q2,
    progress: 25,
    scriptedAnswer: 'pass',
    latencyOverride: 'normal',
    onStart: fn(() => true),
    onSkipIdle: fn(),
    onCantTalk: fn(),
    onClose: fn(),
    onInterrupted: fn(),
    onSilence: fn(),
    onVerdict: fn(),
  },
} satisfies Meta<typeof LoopScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

function bubbleText(canvasElement: HTMLElement) {
  return canvasElement.querySelector<HTMLElement>('p')?.textContent;
}

/** Resolves a CSS custom property to its final computed color via a
 * throwaway probe element, so color assertions don't hardcode an rgb()
 * literal that would need updating if the token's own value ever changes. */
function resolvedColor(canvasElement: HTMLElement, cssVar: string): string {
  const probe = document.createElement('div');
  probe.style.background = `var(${cssVar})`;
  canvasElement.appendChild(probe);
  const color = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return color;
}

export const Idle: Story = {
  args: { scriptedAnswer: 'pass' },
  play: async ({ canvas, canvasElement, args }) => {
    await expect(canvas.getByText(QUESTIONS.Q2.prompt)).toBeVisible();
    const startButton = canvas.getByRole('button', { name: /start/i });
    await expect(startButton).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Skip' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: "Can't talk right now" })).toBeVisible();
    await expect(bubbleText(canvasElement)).toBe(QUESTIONS.Q2.prompt);

    // Default's real color (2026-09-16, your report): background/inverse,
    // same as Recording — not Secondary's usual interactive/secondary.
    await expect(getComputedStyle(startButton).backgroundColor).toBe(
      resolvedColor(canvasElement, '--color-background-inverse')
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Skip' }));
    await expect(args.onSkipIdle).toHaveBeenCalledTimes(1);

    await userEvent.click(canvas.getByRole('button', { name: "Can't talk right now" }));
    await expect(args.onCantTalk).toHaveBeenCalledTimes(1);

    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await expect(args.onClose).toHaveBeenCalledWith('idle', '');
  },
};

/** Start re-checks the mic first; resolving false means the caller is about
 * to show the mic-off sheet instead, so Recording never starts. */
export const MicUnavailable: Story = {
  args: { onStart: fn(() => false) },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /start/i }));
    // Still idle: Start didn't turn into Send.
    await expect(canvas.getByRole('button', { name: /start/i })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: /send/i })).not.toBeInTheDocument();
  },
};

export const Recording: Story = {
  args: { scriptedAnswer: 'pass' },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: /start/i }));

    const sendButton = canvas.getByRole('button', { name: /send/i });
    await expect(sendButton).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Discard and start over' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: "Can't talk right now" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();

    // Recording's real color (2026-09-16, your report): background/inverse,
    // same as Default (Idle story) — not Secondary's usual
    // interactive/secondary.
    await expect(getComputedStyle(sendButton).backgroundColor).toBe(
      resolvedColor(canvasElement, '--color-background-inverse')
    );

    // Nothing recognized yet: no waveform bars (Figma's 06Talking).
    await expect(canvasElement.querySelector('[data-bar-count]')).not.toBeInTheDocument();

    // The scripted answer streams in, revealing bars as words arrive.
    await waitFor(() => expect(canvas.getByText(/./, { selector: 'p[data-state]' })).toBeVisible());
    await waitFor(() => {
      const bars = canvasElement.querySelector('[data-bar-count]');
      expect(bars).toBeVisible();
      expect(Number(bars?.getAttribute('data-bar-count'))).toBeGreaterThan(0);
    });

    // Cancel discards and returns to Idle with nothing kept.
    await userEvent.click(canvas.getByRole('button', { name: 'Discard and start over' }));
    await expect(canvas.getByRole('button', { name: /start/i })).toBeVisible();
    await expect(canvas.getByRole('button', { name: "Can't talk right now" })).toBeVisible();
  },
};

/** Send before ~1s with nothing heard yet drops silently back to Idle —
 * nothing logged, no verdict, no Silence sheet. */
export const AccidentalTap: Story = {
  args: { onVerdict: fn(), onSilence: fn() },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /start/i }));
    await userEvent.click(canvas.getByRole('button', { name: /send/i }));

    await expect(canvas.getByRole('button', { name: /start/i })).toBeVisible();
    await expect(args.onVerdict).not.toHaveBeenCalled();
    await expect(args.onSilence).not.toHaveBeenCalled();
  },
};

/** Once a real take (≥1s) is sent, Processing starts immediately: the
 * bubble swaps to "Let me think…". The discard icon and buttonVoice stay on
 * screen, frozen at Recording's exact look ("Send", waveform icon,
 * background/inverse), but disabled — Skip never shows here or in Recording
 * (2026-09-16, your call: previously both buttons were hidden entirely
 * during Processing, sprint-context.md 2026-09-15; kept only Close (top app
 * bar) as the way out — that's superseded by this same-day change, the
 * buttons are visible again, just non-interactive). Waiting out the full
 * fake-latency window (2–8s) to see the eventual verdict/Silence callback is
 * covered by lib/recall/judge.test.ts and processingLatency.test.ts, not
 * here. */
export const Processing: Story = {
  args: { scriptedAnswer: 'pass' },
  play: async ({ canvas, canvasElement, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /start/i }));
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const barsBeforeSend = canvasElement.querySelector('[data-bar-count]')?.getAttribute('data-bar-count');
    await userEvent.click(canvas.getByRole('button', { name: /send/i }));

    await expect(bubbleText(canvasElement)).toBe('Let me think…');
    const sendButton = canvas.getByRole('button', { name: /send/i });
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeDisabled();
    const discardButton = canvas.getByRole('button', { name: 'Discard and start over' });
    await expect(discardButton).toBeVisible();
    await expect(discardButton).toBeDisabled();
    // Anchored (not the loose /start/i elsewhere in this file): "Discard and
    // start over" is legitimately present now and would otherwise match a
    // substring test for "start".
    await expect(canvas.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();

    // Frozen at Recording's exact look, not reverted to Default's colors.
    await expect(getComputedStyle(sendButton).backgroundColor).toBe(
      resolvedColor(canvasElement, '--color-background-inverse')
    );

    // "The lines stay" (your instruction, 2026-09-16): Processing holds
    // Recording's exact bar count rather than jumping to a full row, and now
    // pulses (data-animate) instead of sitting static.
    const waveform = canvasElement.querySelector('[data-bar-count]');
    await expect(waveform).toBeVisible();
    await expect(waveform?.getAttribute('data-bar-count')).toBe(barsBeforeSend);
    await expect(waveform).toHaveAttribute('data-animate');

    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await expect(args.onClose).toHaveBeenCalledWith(
      'processing',
      expect.any(String),
      expect.any(Number),
      expect.any(String)
    );
  },
};

/** "Still listening…" fires on real silence (2026-09-16): no new interim
 * result for 3s. `blank` never streams anything at all, so the silence
 * clock armed at Recording's start is the only thing that can trigger it —
 * a direct stand-in for genuine mic silence, not a word count or a
 * recognizer restart. It stays up (no auto-hide) until Cancel ends the
 * take. */
export const StillListeningCue: Story = {
  args: { scriptedAnswer: 'blank' },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /start/i }));
    await expect(canvas.queryByText('Still listening…')).not.toBeInTheDocument();
    await waitFor(() => expect(canvas.getByText('Still listening…')).toBeVisible(), { timeout: 4000 });

    await userEvent.click(canvas.getByRole('button', { name: 'Discard and start over' }));
    await expect(canvas.queryByText('Still listening…')).not.toBeInTheDocument();
  },
};

/** A call, lock or backgrounding mid-Recording (simulated here via
 * visibilitychange, the same signal the real interruption uses) discards
 * the take and returns to Idle with the Silence copy, no attempt used. */
export const InterruptedMidRecording: Story = {
  args: { scriptedAnswer: 'pass' },
  play: async ({ canvas, canvasElement, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /start/i }));
    await expect(canvas.getByRole('button', { name: /send/i })).toBeVisible();

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    await expect(args.onInterrupted).toHaveBeenCalledTimes(1);
    await expect(canvas.getByRole('button', { name: /start/i })).toBeVisible();
    await waitFor(() =>
      expect(canvas.getByText("Sorry, I didn't catch that. Can you repeat?")).toBeVisible()
    );
    await expect(canvasElement.querySelector('p[data-state="Silence"]')).toBeVisible();

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  },
};

/** How the app renders it on the test iPhone, under the real status bar. */
export const OnDevice: Story = {
  args: { showStatusBar: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('09:41')).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /start/i })).toBeVisible();
  },
};
