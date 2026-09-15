import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import type { MicRequestResult } from '@/lib/recall/micPermission';
import { PrototypeFlow } from './PrototypeFlow';
import { reviewScreen } from './reviewScreens';

const DESCRIPTION = `
**The running prototype** (\`app/page.tsx\`): every built screen joined up, as it runs on the test iPhone (no mock status bar). Prototype scaffolding, not a SPEC.md screen.

| From | Tap | Goes to |
| --- | --- | --- |
| 03VoicerecallON | a node | the gate, or straight to the loop once the mic is allowed. Writes the turn log's "Session started" row |
| Gate | Can't talk right now | 01Exam — a different button from the loop's own Can't talk right now, which leaves for 03VoicerecallON once the loop exists |
| Gate | Turn on microphone / Don't allow | opens / closes the permission sheet |
| Gate sheet | Allow | the real iOS prompt: allowed → the loop; Don't Allow → 01Exam, and the node's gate then shows Settings steps |
| Gate, after a denial | I've turned on the mic | asks again: allowed → the loop; still off → stays, with a "Still off" notice |
| Verdict | Why? (Pass, Partial, Fail only) | the Why? sheet, same question and transcript. Got it → the loop (not built) |

**The loop (screen 10) isn't built**, so everything that leads to it stops at a temporary "Not built yet" screen (\`NotBuiltScreen\`) with a way back to 03VoicerecallON. Mic permission is remembered in memory only, so a reload starts over; iOS answers straight away if it already has.

**Review links** open one screen directly: \`/?screen=gate\`, \`gate-sheet\`, \`gate-denied\`, \`mic-off\`, \`typing\`, \`verdict-pass\`, \`verdict-partial\`, \`verdict-fail\`, \`verdict-silence\`, \`why-pass\`, \`why-partial\`, \`why-fail\`, \`summary-some-non-pass\`, \`summary-all-pass\`, \`summary-after-try-again\`. They don't write to the turn log. The mic prompt needs HTTPS (or localhost): off it, Allow acts like Don't Allow and logs a console warning.

**The summary (screen 8) isn't reachable from the flow yet**, only by review link: nothing in this mock tracks which question a session is on, so Verdict's and Why's own Continue/Got it always return to the loop's "Not built yet" stop, never to the summary. Once reached, its own Share and Claim XP are decorative this sprint (your instruction, 2026-09-15) — Close is the only way out, back to the exam plan.
`;

const granted = () => fn<() => Promise<MicRequestResult>>(async () => 'granted');
const denied = () => fn<() => Promise<MicRequestResult>>(async () => 'denied');

const meta = {
  title: 'Prototype/PrototypeFlow',
  component: PrototypeFlow,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
    docs: { description: { component: DESCRIPTION } },
  },
  args: {
    initialView: { screen: 'exam-plan', frame: '03VoicerecallON' },
    requestMic: granted(),
    startSession: fn(),
  },
} satisfies Meta<typeof PrototypeFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

const GATE_TITLE = "Say it, don't just tap it";
const SETTINGS_STEPS = 'Open Settings, find Voice recall, then turn on Microphone.';

function visibleFrame(canvasElement: HTMLElement) {
  return canvasElement.querySelector('[data-frame]:not([hidden])')?.getAttribute('data-frame');
}

/** A node opens the gate and starts a session; the gate's own Can't talk
 * right now goes to 01Exam (SPEC.md's original table; confirmed against
 * Figma 13548:6324, 2026-09-15) — not 03VoicerecallON, which is where the
 * *loop's* own Can't talk right now leaves to, once the loop exists. */
export const NodeOpensTheGate: Story = {
  name: 'Node → gate → Can’t talk right now',
  play: async ({ canvas, canvasElement, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Organelle Identification/ }));
    await expect(canvas.getByText(GATE_TITLE)).toBeVisible();
    await expect(args.startSession).toHaveBeenCalledWith(1);

    await userEvent.click(canvas.getByRole('button', { name: "Can't talk right now" }));
    await expect(visibleFrame(canvasElement)).toBe('01Exam');
  },
};

/** Don't allow only closes the sheet: iOS is never asked. */
export const DontAllowClosesTheSheet: Story = {
  name: 'Turn on microphone → Don’t allow',
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Comparing Cell Types/ }));
    await expect(args.startSession).toHaveBeenCalledWith(2);
    await userEvent.click(canvas.getByRole('button', { name: 'Turn on microphone' }));
    await expect(canvas.getByRole('dialog', { name: 'Allow microphone access?' })).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: "Don't allow" }));
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(canvas.getByText(GATE_TITLE)).toBeVisible();
    await expect(args.requestMic).not.toHaveBeenCalled();
  },
};

/** Allowed in iOS: on to the loop (not built yet), and later node opens skip the gate. */
export const AllowGranted: Story = {
  name: 'Allow → iOS allows',
  args: { requestMic: granted() },
  play: async ({ canvas, canvasElement, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Organelle Identification/ }));
    await userEvent.click(canvas.getByRole('button', { name: 'Turn on microphone' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Allow' }));
    await expect(await canvas.findByText('Not built yet')).toBeVisible();
    await expect(args.requestMic).toHaveBeenCalledTimes(1);

    await userEvent.click(canvas.getByRole('button', { name: 'Back to exam plan' }));
    await expect(visibleFrame(canvasElement)).toBe('03VoicerecallON');

    await userEvent.click(canvas.getByRole('button', { name: /Organelle Identification/ }));
    await expect(canvas.getByText('Not built yet')).toBeVisible();
    await expect(canvas.queryByText(GATE_TITLE)).not.toBeInTheDocument();
    await expect(args.startSession).toHaveBeenCalledTimes(2);
  },
};

/** Don't Allow in iOS: back to 01Exam, and the node's gate now shows Settings steps. */
export const AllowDenied: Story = {
  name: 'Allow → iOS doesn’t allow',
  args: { requestMic: denied() },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Organelle Identification/ }));
    await userEvent.click(canvas.getByRole('button', { name: 'Turn on microphone' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Allow' }));
    await waitFor(() => expect(visibleFrame(canvasElement)).toBe('01Exam'));

    await userEvent.click(canvas.getByRole('button', { name: 'Show me' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Voice recall' }));
    await userEvent.click(canvas.getByRole('button', { name: /Organelle Identification/ }));
    await expect(canvas.getByText(SETTINGS_STEPS)).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Turn on microphone' })).not.toBeInTheDocument();
  },
};

/** After a denial, I've turned on the mic asks again; still off stays on the Settings steps, with a notice (Open #5). */
export const TurnedOnMicStillOff: Story = {
  name: 'I’ve turned on the mic → still off',
  args: {
    initialView: { screen: 'gate', node: 1, sheetOpen: false },
    initialMic: 'denied',
    requestMic: denied(),
  },
  play: async ({ canvas, args }) => {
    // No notice before the first check on this visit.
    await expect(canvas.queryByText('Still off — check Settings and try again.')).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: "I've turned on the mic" }));
    await expect(args.requestMic).toHaveBeenCalledTimes(1);
    await (args.requestMic as ReturnType<typeof denied>).mock.results[0].value;
    await expect(await canvas.findByText('Still off — check Settings and try again.')).toBeVisible();
    await expect(canvas.getByText(SETTINGS_STEPS)).toBeVisible();
    await expect(canvas.getByRole('button', { name: "Can't talk right now" })).toBeVisible();
  },
};

/** After a denial, I've turned on the mic with the mic now allowed goes on to the loop. */
export const TurnedOnMicNowAllowed: Story = {
  name: 'I’ve turned on the mic → allowed',
  args: {
    initialView: { screen: 'gate', node: 1, sheetOpen: false },
    initialMic: 'denied',
    requestMic: granted(),
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: "I've turned on the mic" }));
    await expect(await canvas.findByText('Not built yet')).toBeVisible();
  },
};

/** `/?screen=mic-off`: a review link. Type instead reaches the typing placeholder, whose Back to voice goes to 01Exam. */
export const ReviewLinkMicOff: Story = {
  name: '?screen=mic-off',
  args: { initialView: reviewScreen('mic-off').view, initialMic: reviewScreen('mic-off').mic },
  play: async ({ canvas, canvasElement, args }) => {
    await expect(canvas.getByRole('dialog', { name: 'Your mic is off' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Type instead' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Back to voice' }));
    await expect(visibleFrame(canvasElement)).toBe('01Exam');
    await expect(args.startSession).not.toHaveBeenCalled();

    // Unknown or missing names start the normal flow.
    await expect(reviewScreen('nope').view).toEqual({ screen: 'exam-plan', frame: '00Homescreen' });
    await expect(reviewScreen(undefined).view).toEqual({ screen: 'exam-plan', frame: '00Homescreen' });
    await expect(reviewScreen('toString').view).toEqual({ screen: 'exam-plan', frame: '00Homescreen' });
  },
};

/** `/?screen=verdict-partial`: Why? opens the Why? sheet with the same question and transcript; Got it moves on to the loop (not built). */
export const ReviewLinkVerdict: Story = {
  name: '?screen=verdict-partial',
  args: { initialView: reviewScreen('verdict-partial').view },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText("They're the powerhouse of the cell.")).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Why?' }));
    await expect(canvas.getByText(/They're the powerhouse of the cell\./)).toBeVisible();
    await expect([...canvasElement.querySelectorAll('strong')].map((el) => el.textContent)).toEqual([
      'glucose',
      'cellular respiration',
    ]);

    await userEvent.click(canvas.getByRole('button', { name: 'Got it' }));
    await expect(await canvas.findByText('Not built yet')).toBeVisible();
  },
};

/** `/?screen=why-fail`: opens the Why? sheet directly, all three concepts missing. */
export const ReviewLinkWhy: Story = {
  name: '?screen=why-fail',
  args: { initialView: reviewScreen('why-fail').view },
  play: async ({ canvasElement }) => {
    await expect([...canvasElement.querySelectorAll('strong')].map((el) => el.textContent)).toEqual([
      'energy',
      'glucose',
      'cellular respiration',
    ]);
  },
};

/** `/?screen=summary-some-non-pass`: Share and Claim XP are decorative this
 * sprint (your instruction, 2026-09-15) — Close is the only way out. */
export const ReviewLinkSummary: Story = {
  name: '?screen=summary-some-non-pass',
  args: { initialView: reviewScreen('summary-some-non-pass').view },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText('Lesson complete!')).toBeVisible();
    await expect(canvas.getByText('You explained 1 of 4 out loud.')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Share' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Claim XP' }));
    await expect(canvas.getByText('Lesson complete!')).toBeVisible(); // neither leaves the screen

    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await expect(visibleFrame(canvasElement)).toBe('03VoicerecallON');
  },
};
