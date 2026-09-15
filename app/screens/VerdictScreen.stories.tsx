import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { VerdictScreen } from './VerdictScreen';

const DESCRIPTION = `
**SPEC.md screen 1: the verdict sheet.** \`ResultBtm\` over the loop screen as it looks right after Send.

**Figma:** 10End (Success, 13568:5533), Partial (13568:5615), Incorrect (13568:5747), Silence (13659:3542).

**Actions:**
- Pass, Partial, Fail: **Why?** opens the Why? sheet; **Continue** goes to the next question, or the summary after the last. One attempt per question, so there's no Try again.
- Silence (nothing heard, recognizer or network error, no verdict by 15s, or the answer opened with a question): **Re-record** goes back to recording, **Try typing instead** to the typing placeholder, **Skip** to the next question. No attempt is used, and Silence can repeat.
- **Close** leaves the session for the exam plan. There's no dim behind the sheet, so it stays in reach (decided 2026-09-15).
- Thumbs up/down are rendered and unwired, by decision.

**Progress** moves when a verdict appears, so it counts the question just answered. Silence doesn't move it.

**Transcript:** below the disclaimer, with space/600 above and below. Short answers are \`TranscriptDisplay\` Filled; longer than its 320px window, Overflow keeps the newest words at the bottom and fades the oldest off the top. With nothing heard, nothing shows there: the Silence frame's "I'm listening…" would contradict "Didn't catch it".

**Home indicator:** on the phone, the sheet's bottom padding is the larger of space/700 and the safe-area inset, so the buttons end 34pt above the edge with the home bar inside that space, as in the shipped app (\`reference/Errorwithhomebar.PNG\`). Storybook has no inset, so it shows Figma's 28px.

**Built inline (logged in component-gaps.md):** the speech bubble with its tail, the mascot's shadow, and the XP chip.
`;

const Q2 = 'What do mitochondria do, and why does a cell need them?';
const LONG_ANSWER =
  "Mitochondria is the powerhouse of the cell, it converts glucose and oxygen into ATP through cellular respiration, which the cell then uses as energy for basically everything it does, like moving stuff around and building proteins and dividing. It also has its own DNA separate from the nucleus, which is one of the reasons scientists think it used to be a free living bacteria that got absorbed by a bigger cell a really long time ago, and the two of them just started working together instead of one eating the other, that's the endosymbiotic theory. Every cell has a different number of them depending on how much energy that part of the body needs, so muscle cells and heart cells have way more than something like a skin cell. And the folds on the inside, the cristae, give it way more surface area so it can make more ATP at once, which is why the inner membrane is all folded up like that. Oh and if you exercise a lot your muscle cells can actually build more mitochondria over time.";

const meta = {
  title: 'Screens/VerdictScreen',
  component: VerdictScreen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: DESCRIPTION } },
  },
  args: {
    question: Q2,
    progress: 50,
    onClose: fn(),
    onWhy: fn(),
    onContinue: fn(),
    onReRecord: fn(),
    onTypeInstead: fn(),
    onSkip: fn(),
  },
} satisfies Meta<typeof VerdictScreen>;

export default meta;
type Story = StoryObj<typeof meta>;
type Canvas = Parameters<NonNullable<Story['play']>>[0]['canvas'];

async function expectVerdictActions(canvas: Canvas, args: Story['args']) {
  await expect(canvas.queryByRole('button', { name: /re-record/i })).not.toBeInTheDocument();
  await userEvent.click(canvas.getByRole('button', { name: 'Why?' }));
  await expect(args?.onWhy).toHaveBeenCalledTimes(1);
  await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
  await expect(args?.onContinue).toHaveBeenCalledTimes(1);
}

function transcriptState(canvasElement: HTMLElement) {
  return canvasElement.querySelector<HTMLElement>('p[data-state]')?.dataset.state;
}

/** Figma 10End. Q2's Pass sample answer; Q1 and Q2 both have a verdict. */
export const Pass: Story = {
  name: 'outcome=Pass',
  args: { outcome: 'Pass', transcript: 'They make energy for the cell by breaking down glucose.' },
  play: async ({ canvas, canvasElement, args }) => {
    await expect(canvas.getByRole('dialog', { name: 'Result: pass' })).toBeVisible();
    await expect(canvas.getByText('Nice!')).toBeVisible();
    await expect(canvas.getByText(args.transcript)).toBeVisible();
    await expect(transcriptState(canvasElement)).toBe('Filled');
    await expect(canvas.getByText(Q2)).toBeVisible();
    await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    // No dim: close stays in reach while the verdict is up.
    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
    await expectVerdictActions(canvas, args);
  },
};

/** Figma Partial. Q2's Partial sample answer. */
export const Partial: Story = {
  name: 'outcome=Partial',
  args: { outcome: 'Partial', transcript: "They're the powerhouse of the cell." },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText('Partial right')).toBeVisible();
    await expect(canvas.getByText(args.transcript)).toBeVisible();
    await expectVerdictActions(canvas, args);
  },
};

/** Figma Incorrect. Q2's Fail sample answer. */
export const Fail: Story = {
  name: 'outcome=Fail',
  args: { outcome: 'Fail', transcript: 'They help the cell divide.' },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText('Incorrect')).toBeVisible();
    await expect(canvas.getByText(args.transcript)).toBeVisible();
    await expectVerdictActions(canvas, args);
  },
};

/**
 * The newest line ends at the bottom of Overflow's window, with at least
 * space/600 between it and the sheet, so the sheet never covers any text.
 */
async function expectNewestWordsClearOfSheet(canvas: Canvas, canvasElement: HTMLElement) {
  await expect(transcriptState(canvasElement)).toBe('Overflow');
  const text = canvasElement.querySelector<HTMLElement>('p[data-state="Overflow"]')!;
  const range = document.createRange();
  range.selectNodeContents(text);
  const lines = range.getClientRects();
  const newest = lines[lines.length - 1];
  const window = text.getBoundingClientRect();
  const sheet = canvas.getByRole('dialog').getBoundingClientRect();
  const gap = parseFloat(getComputedStyle(text).getPropertyValue('--size-space-600'));
  await expect(newest.bottom).toBeLessThanOrEqual(window.bottom + 1);
  await expect(window.bottom - newest.bottom).toBeLessThan(parseFloat(getComputedStyle(text).lineHeight));
  await expect(sheet.top - newest.bottom).toBeGreaterThanOrEqual(gap);
}

/**
 * A transcript longer than the window: the newest words stay visible above
 * the sheet, and the oldest lines fade off the top.
 */
export const PassWithLongAnswer: Story = {
  name: 'outcome=Pass, long answer',
  args: { outcome: 'Pass', transcript: LONG_ANSWER },
  play: async ({ canvas, canvasElement }) => {
    await expectNewestWordsClearOfSheet(canvas, canvasElement);
    await expect(canvas.getByRole('button', { name: 'Continue' })).toBeVisible();
  },
};

/**
 * A long answer that ends in Silence (for example, no verdict by 15s). The
 * Silence sheet is taller, and the newest words still stay clear of it.
 */
export const SilenceWithLongAnswer: Story = {
  name: 'outcome=Silence, long answer',
  args: { outcome: 'Silence', transcript: LONG_ANSWER, progress: 25 },
  play: async ({ canvas, canvasElement }) => {
    await expectNewestWordsClearOfSheet(canvas, canvasElement);
    await expect(canvas.getByRole('button', { name: /re-record/i })).toBeVisible();
  },
};

/**
 * Figma Silence (13659:3542). Empty transcript: silence, noise with no words,
 * a recognizer or network error, or no verdict by 15s with nothing heard.
 * Progress doesn't move: only Q1 has a verdict.
 */
export const SilenceNothingHeard: Story = {
  name: 'outcome=Silence, nothing heard',
  args: { outcome: 'Silence', transcript: '', progress: 25 },
  play: async ({ canvas, canvasElement, args }) => {
    await expect(canvas.getByText("Didn't catch it")).toBeVisible();
    // Nothing behind the sheet: no transcript, no placeholder copy.
    await expect(transcriptState(canvasElement)).toBeUndefined();
    await expect(canvas.queryByText("I'm listening. Feel free to say your answer out loud")).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Why?' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: /re-record/i }));
    await expect(args.onReRecord).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Try typing instead' }));
    await expect(args.onTypeInstead).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Skip' }));
    await expect(args.onSkip).toHaveBeenCalledTimes(1);
  },
};

/**
 * Silence with words on screen: the answer opened with a question (SPEC.md's
 * end-to-end step 6 on Q3). The same sheet covers no verdict by 15s when the
 * recognizer did hear something. The transcript is still shown back.
 */
export const SilenceQuestionAsked: Story = {
  name: 'outcome=Silence, question asked',
  args: {
    outcome: 'Silence',
    question: 'What does the cell membrane do?',
    transcript: 'What does the cell membrane do?',
    progress: 50,
  },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText("Didn't catch it")).toBeVisible();
    // Once as the question in the bubble, once as the student's transcript.
    await expect(canvas.getAllByText(args.transcript)).toHaveLength(2);
    await userEvent.click(canvas.getByRole('button', { name: /re-record/i }));
    await expect(args.onReRecord).toHaveBeenCalledTimes(1);
  },
};

/** How the app renders it on the test iPhone, under the real status bar. */
export const OnDevice: Story = {
  name: 'showStatusBar=false',
  args: { outcome: 'Partial', transcript: "They're the powerhouse of the cell.", showStatusBar: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('09:41')).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Continue' })).toBeVisible();
  },
};
