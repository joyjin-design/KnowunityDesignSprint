import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { ExamPlanFlow, ExamPlanScreen } from './ExamPlanScreen';

const DESCRIPTION = `
**SPEC.md screen 3: Homescreen and exam plan.** Exported Figma frames (3×, 1170×2364) with invisible tap zones. They're prototype images, not components, and render bare rather than inside \`Screen\`, because each export draws its own tab bar and home indicator. Each export's own baked-in status bar strip is cropped off (2026-09-16 — it doubled the real one on a phone, same as Screen's used to); \`FrameImage\` pads that space with the safe-area inset instead.

| Frame | Figma | Tap zone → goes to |
| --- | --- | --- |
| 00Homescreen | 13619:3109 | Exam tab (with a live, animated new-voice-recall badge) → 01Exam. Triple tap the blank band below the header row → turn log (facilitator) |
| 01Exam | 13548:6324 | Show me (banner) → 02Hint-animate |
| 02Hint-animate | 13547:5824 | Voice recall chip → 03VoicerecallON |
| 03VoicerecallON | 13548:6325 | Organelle Identification → node 1 · Comparing Cell Types → node 2 |

- Only the tap zones do anything. Zones are at least 48pt; the Exam tab and Show me are grown around their element to reach that.
- 02Hint-animate composites a real, live purple line over its still export (Option B: the line draws itself in, ending in an arrowhead at the Voice recall chip). The curve is a transcription of the real Figma vector's geometry; everything else on the frame is still the exported image (SPEC.md: "the exam plan is out of scope as components").
- 00Homescreen composites a real, live coral badge over its still export in place of its own baked-in one — a static dot plus a looping ping ring, since (unlike the hint arrow) this badge has no dismissed/seen state to gate a "plays once" reveal on.
- The readiness banner on 01Exam is part of the image, not a \`Snackbar\`.
- Frame images live in \`public/frames/\`, tap zones in \`app/_prototype/frames.ts\`. Re-export from Figma when a frame changes.
`;

const meta = {
  title: 'Screens/ExamPlanScreen',
  component: ExamPlanScreen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: DESCRIPTION } },
  },
  args: { onZone: fn() },
} satisfies Meta<typeof ExamPlanScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma 00Homescreen. The Exam tab carries the new-voice-recall badge, a
 * real live overlay (a dot plus a looping ping ring), not baked into the
 * image. */
export const Homescreen: Story = {
  name: 'frame=00Homescreen',
  args: { frame: '00Homescreen' },
  play: async ({ canvas, canvasElement, args }) => {
    await expect(canvas.getByRole('img', { name: /Study session\?/ })).toBeVisible();

    const badge = canvasElement.querySelector('[aria-hidden="true"]');
    await expect(badge).toBeTruthy();
    await expect(badge?.querySelectorAll('span')).toHaveLength(2);

    await userEvent.click(canvas.getByRole('button', { name: /^Exam/ }));
    await expect(args.onZone).toHaveBeenLastCalledWith('exam-tab');

    // The facilitator entry needs three quick taps; one or two do nothing.
    const log = canvas.getByRole('button', { name: 'Open turn log (facilitator)' });
    (args.onZone as ReturnType<typeof fn>).mockClear();
    await userEvent.click(log);
    await userEvent.click(log);
    await expect(args.onZone).not.toHaveBeenCalled();
    await userEvent.click(log);
    await expect(args.onZone).toHaveBeenCalledWith('facilitator-log');
  },
};

/** Figma 01Exam: the readiness banner with Show me. */
export const Exam: Story = {
  name: 'frame=01Exam',
  args: { frame: '01Exam' },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show me' }));
    await expect(args.onZone).toHaveBeenCalledWith('show-me');
  },
};

/** Figma 02Hint-animate: still export plus a live, self-drawing arrow. */
export const HintAnimate: Story = {
  name: 'frame=02Hint-animate',
  args: { frame: '02Hint-animate' },
  play: async ({ canvas, canvasElement, args }) => {
    // The arrow is a real, live SVG overlay, not baked into the image: the
    // curve plus its two arrowhead strokes, three <path>s in total.
    await expect(canvasElement.querySelectorAll('svg path')).toHaveLength(3);
    await userEvent.click(canvas.getByRole('button', { name: 'Voice recall' }));
    await expect(args.onZone).toHaveBeenCalledWith('voice-recall-toggle');
  },
};

/** Figma 03VoicerecallON: voice recall on, both nodes show a mic. */
export const VoicerecallOn: Story = {
  name: 'frame=03VoicerecallON',
  args: { frame: '03VoicerecallON' },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Organelle Identification/ }));
    await expect(args.onZone).toHaveBeenLastCalledWith('node-1');
    await userEvent.click(canvas.getByRole('button', { name: /Comparing Cell Types/ }));
    await expect(args.onZone).toHaveBeenLastCalledWith('node-2');
  },
};

/**
 * The whole sequence as the app runs it: 00Homescreen → 01Exam → 02Hint-animate
 * → 03VoicerecallON → node 1.
 */
export const Flow: StoryObj<typeof ExamPlanFlow> = {
  name: 'Flow: 00Homescreen to a node',
  args: { onOpenNode: fn(), onOpenLog: fn() },
  render: (args) => <ExamPlanFlow {...args} />,
  play: async ({ canvas, canvasElement, args }) => {
    const shown = () => canvasElement.querySelector<HTMLElement>('[data-frame]:not([hidden])')?.dataset.frame;
    await expect(shown()).toBe('00Homescreen');
    await userEvent.click(canvas.getByRole('button', { name: /^Exam/ }));
    await expect(shown()).toBe('01Exam');
    await userEvent.click(canvas.getByRole('button', { name: 'Show me' }));
    await expect(shown()).toBe('02Hint-animate');
    await userEvent.click(canvas.getByRole('button', { name: 'Voice recall' }));
    await expect(shown()).toBe('03VoicerecallON');
    await userEvent.click(canvas.getByRole('button', { name: /Organelle Identification/ }));
    await expect(args.onOpenNode).toHaveBeenCalledWith(1);
  },
};
