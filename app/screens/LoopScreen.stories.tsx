import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { QUESTIONS } from '@/lib/recall/questions';
import { LoopScreen } from './LoopScreen';

const DESCRIPTION = `
**SPEC.md screen 10: the voice recall loop.** Owns Idle, Recording (including Still listening) and Processing. Verdict, Why?, Mic-off and Summary stay separate screens the caller composes on top.

**Real STT is deferred** (verification item 0's mic/recognizer spike hasn't run): Recording's transcript comes from \`lib/recall/scriptedTranscript.ts\`, a facilitator-controlled stand-in, not a live recognizer.

**Actions:**
- Idle: **Start** (with a brief mic re-check first — resolving \`false\` means the caller is about to show the mic-off sheet), **Skip** (next question, no attempt), **Can't talk right now** (leaves the session).
- Recording: the discard icon **cancels** back to Idle (nothing logged), **Send** moves to Processing (or drops silently back to Idle if under ~1s with nothing heard — the accidental tap).
- Processing: **Skip** cancels judging (logged Skipped); **Close** always leaves the session.

**Built inline (component-gaps.md):** the speech bubble with its tail, the mascot's shadow and thinking-loop animation, and the XP chip — same duplicated pattern as VerdictScreen/MicOffScreen/WhyScreen.
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
    onSkipProcessing: fn(),
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

export const Idle: Story = {
  args: { scriptedAnswer: 'pass' },
  play: async ({ canvas, canvasElement, args }) => {
    await expect(canvas.getByText(QUESTIONS.Q2.prompt)).toBeVisible();
    await expect(canvas.getByRole('button', { name: /start/i })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Skip' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: "Can't talk right now" })).toBeVisible();
    await expect(bubbleText(canvasElement)).toBe(QUESTIONS.Q2.prompt);

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
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /start/i }));

    await expect(canvas.getByRole('button', { name: /send/i })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Discard and start over' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: "Can't talk right now" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();

    // The scripted answer streams in.
    await waitFor(() => expect(canvas.getByText(/./, { selector: 'p[data-state]' })).toBeVisible());

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
 * bubble swaps to "Let me think…", buttonVoice disappears, and Skip alone
 * stays reachable. Waiting out the full fake-latency window (2–8s) to see
 * the eventual verdict/Silence callback is covered by
 * lib/recall/judge.test.ts and processingLatency.test.ts, not here. */
export const Processing: Story = {
  args: { scriptedAnswer: 'pass' },
  play: async ({ canvas, canvasElement, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /start/i }));
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await userEvent.click(canvas.getByRole('button', { name: /send/i }));

    await expect(bubbleText(canvasElement)).toBe('Let me think…');
    await expect(canvas.queryByRole('button', { name: /send/i })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: /start/i })).not.toBeInTheDocument();
    const skip = canvas.getByRole('button', { name: 'Skip' });
    await expect(skip).toBeVisible();

    await userEvent.click(skip);
    await expect(args.onSkipProcessing).toHaveBeenCalledTimes(1);
  },
};

/** "Still listening…" fires once, roughly mid-stream, only on answers long
 * enough to show it (SPEC.md: ~1.5s). Q5's Pass sample runs well past the
 * 7-word floor. */
export const StillListeningCue: Story = {
  args: { question: QUESTIONS.Q5, scriptedAnswer: 'pass' },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /start/i }));
    await waitFor(() => expect(canvas.getByText('Still listening…')).toBeVisible(), { timeout: 4000 });
    await waitFor(() => expect(canvas.queryByText('Still listening…')).not.toBeInTheDocument(), { timeout: 3000 });
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
