import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import type { LogRow } from '@/lib/recall/turnLog';
import { LogScreen } from './LogScreen';

const DESCRIPTION = `
**SPEC.md screen 2: the hidden \`/log\` route**, facilitator only, never linked from the student flow. No Figma frame.

**Not composed inside \`Screen\`**: no mascot, no appBar, just a plain 390px dark page (a decision this build made — SPEC.md doesn't say either way).

**States:** no turns yet; turns listed; the Clear log confirm (inline on the page, not a sheet — \`button\` Secondary is invisible on a sheet's \`background/surface\`, sprint-context.md 2026-09-11).

**Columns** (session, node, round, question, transcript, concepts hit, outcome, latency, latency flag, timestamp) match \`lib/recall/turnLog.ts\`'s own \`CSV_HEADER\`, agreed in sprint-context.md 2026-09-14.

**Latency switch** (Normal / Slow / Hang): sprint-context.md's 2026-09-14 build-plan review decided \`/log\` needs this, since \`?latency=\` can't be typed on a home-screen web app with no address bar. Not in SPEC.md screen 2's own text — a gap this build fills, flagged in the report.

**Built inline (logged in component-gaps.md):** the latency switch (no toggle/segmented component exists yet) and the turn/session rows (tokens only, same as the summary's rows in screen 8 and the loop's speech bubble in screen 10).
`;

const SESSION_1: LogRow = { kind: 'session', session: 1, node: 1, timestamp: '2026-09-15T09:00:00.000Z' };
const Q1_PASS: LogRow = {
  kind: 'turn',
  session: 1,
  node: 1,
  round: 1,
  question: 'Q1',
  transcript: 'The nucleus is the control center and it holds the DNA.',
  conceptsHit: ['A', 'B'],
  outcome: 'Pass',
  latencyMs: 3200,
  latencyFlag: 'normal',
  timestamp: '2026-09-15T09:00:12.000Z',
};
const Q2_PARTIAL: LogRow = {
  kind: 'turn',
  session: 1,
  node: 1,
  round: 1,
  question: 'Q2',
  transcript: "They're the powerhouse of the cell.",
  conceptsHit: ['A'],
  outcome: 'Partial',
  latencyMs: 7600,
  latencyFlag: 'slow (random)',
  timestamp: '2026-09-15T09:01:40.000Z',
};
const Q3_SKIPPED: LogRow = {
  kind: 'turn',
  session: 1,
  node: 1,
  round: 1,
  question: 'Q3',
  transcript: '',
  conceptsHit: [],
  outcome: 'Skipped',
  latencyMs: null,
  latencyFlag: null,
  timestamp: '2026-09-15T09:02:05.000Z',
};
const SESSION_2: LogRow = { kind: 'session', session: 2, node: 2, timestamp: '2026-09-15T09:10:00.000Z' };
const Q5_FAIL: LogRow = {
  kind: 'turn',
  session: 2,
  node: 2,
  round: 1,
  question: 'Q5',
  transcript: 'They help the cell divide.',
  conceptsHit: [],
  outcome: 'Fail',
  latencyMs: 3900,
  latencyFlag: 'normal',
  timestamp: '2026-09-15T09:10:30.000Z',
};
const Q5_SILENCE: LogRow = {
  kind: 'turn',
  session: 2,
  node: 2,
  round: 2,
  question: 'Q5',
  transcript: '',
  conceptsHit: [],
  outcome: 'Silence',
  latencyMs: 15000,
  latencyFlag: 'hang',
  timestamp: '2026-09-15T09:11:00.000Z',
};

const ROWS: LogRow[] = [SESSION_1, Q1_PASS, Q2_PARTIAL, Q3_SKIPPED, SESSION_2, Q5_FAIL, Q5_SILENCE];

const meta = {
  title: 'Screens/LogScreen',
  component: LogScreen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: DESCRIPTION } },
  },
  args: {
    rows: ROWS,
    saveStatus: { failedSaves: 0, lastFailedAt: null },
    latency: 'normal',
    confirmingClear: false,
    onLatencyChange: fn(),
    onCopyCsv: fn(() => true),
    onRequestClear: fn(),
    onConfirmClear: fn(),
    onCancelClear: fn(),
  },
} satisfies Meta<typeof LogScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoTurnsYet: Story = {
  name: 'No turns yet',
  args: { rows: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No turns yet.')).toBeVisible();
    // Nothing to copy or clear when the log is empty.
    await expect(canvas.queryByRole('button', { name: 'Copy as CSV' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Clear log' })).not.toBeInTheDocument();
    // The latency switch is a testing control, independent of log content.
    await expect(canvas.getByRole('radio', { name: 'Normal' })).toBeVisible();
  },
};

export const TurnsListed: Story = {
  name: 'Turns listed',
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText('S1 · Node 1 · Session started')).toBeVisible();
    await expect(canvas.getByText('S2 · Node 2 · Session started')).toBeVisible();
    await expect(canvas.getByText('S1 · Node 1 · Q1 · Round 1')).toBeVisible();
    await expect(canvas.getByText('“The nucleus is the control center and it holds the DNA.”')).toBeVisible();
    await expect(canvas.getByText('Concepts hit: A, B')).toBeVisible();
    await expect(canvas.getByText('3.2s (normal)')).toBeVisible();
    // Round 2, the Try again on Q5 after Fail.
    await expect(canvas.getByText('S2 · Node 2 · Q5 · Round 2')).toBeVisible();
    await expect(canvas.getByText('15.0s (hang)')).toBeVisible();
    // A skip logs nothing judged: no transcript line, no latency.
    await expect(canvas.getByText('S1 · Node 1 · Q3 · Round 1')).toBeVisible();
    await expect(canvas.getAllByText('—')).toHaveLength(1);

    await userEvent.click(canvas.getByRole('button', { name: 'Copy as CSV' }));
    await expect(args.onCopyCsv).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Copied' })).toBeVisible());

    await userEvent.click(canvas.getByRole('button', { name: 'Clear log' }));
    await expect(args.onRequestClear).toHaveBeenCalledTimes(1);

    await userEvent.click(canvas.getByRole('radio', { name: 'Slow (7–8s)' }));
    await expect(args.onLatencyChange).toHaveBeenCalledWith('slow');
  },
};

/** When the clipboard write fails, the button says so instead of "Copied". */
export const CopyFailed: Story = {
  name: 'Copy as CSV fails',
  args: { onCopyCsv: fn(() => false) },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Copy as CSV' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: "Couldn't copy" })).toBeVisible());
  },
};

export const ClearLogConfirm: Story = {
  name: 'Clear log confirm',
  args: { confirmingClear: true },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText("Clear the log? This can't be undone.")).toBeVisible();
    // Not a sheet: no dialog role, no scrim, just inline content on the page.
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(args.onCancelClear).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Clear log' }));
    await expect(args.onConfirmClear).toHaveBeenCalledTimes(1);
  },
};

export const SaveFailedWarning: Story = {
  name: 'Failed save warning',
  args: { saveStatus: { failedSaves: 2, lastFailedAt: '2026-09-15T09:12:00.000Z' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toBeVisible();
    await expect(canvas.getByText('The last save failed.')).toBeVisible();
    await expect(canvas.getByText(/2 since the log was last cleared/)).toBeVisible();
  },
};

/** Latency override picked to `hang`, matching `?latency=hang`. */
export const LatencyHangSelected: Story = {
  name: 'Latency=hang selected',
  args: { latency: 'hang' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'Hang (15s)' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Normal' })).not.toBeChecked();
  },
};
