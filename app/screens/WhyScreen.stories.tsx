import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { ReactNode } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import type { ConceptId } from '@/lib/recall/types';
import { WhyScreen } from './WhyScreen';

const DESCRIPTION = `
**SPEC.md screen 7: the Why? explanation sheet.** No Figma frame yet; modelled on \`reference/TapWhy?.PNG\`. Reached from \`ResultBtm\`'s own **Why?** button (Pass, Partial or Fail — Silence has no Why?).

**Composition:** \`BottomSheet\` (\`appBar\` omitted, so its own default — a bare grab handle, no title, matching the reference — shows), with the authored explanation in \`middleSection\`. **Got it** \`Button\` sits outside \`BottomSheet\`, above its top edge, in \`Screen\`'s own \`bottomSheetOnly\` slot, floating clear of the sheet with a small gap (\`space.100\`, 4px, on your call 2026-09-15) rather than overlapping it. Knowie normally sits alongside Got it here too, peeking behind the sheet the way the gate's own mascot sits behind its buttons (Figma 13555:8294, \`reference/Quiz-Why-explanation.png\`) — hidden for now, also on your call.

**Behind the sheet:** the same reconstruction as \`VerdictScreen\` (screen 1) — the loop itself is screen 10, still blocked on the spike — since the student's transcript stays visible while reading the explanation. Duplicated rather than shared, per the exception \`SPEC.md\`'s screen 10 already carves out for this inline scaffolding.

**Bold:** only the concepts \`content/voice-recall-questions.md\` says the judge found missing — Success has nothing missing, so nothing's bold there. The judge itself is mocked, so which concepts counted is decided by these stories, the same way \`VerdictScreen\`'s sample transcripts are.

**Got it:** \`accent/coral/bold\` fill with \`accent/coral/on-bold\` text, on your call (2026-09-15) — a local style override, the same mechanism \`ResultBtm\`'s own \`ACTION_COLOR\` uses for a non-standard fill, since it's not one of \`Button\`'s own variants (its real master, Figma 4871:29884, binds plain \`interactive/primary\` instead — tried as-is first, then overridden back to coral on a second pass). Updates \`SPEC.md\`'s earlier call that Got it stays \`interactive/primary\` on every verdict, not verdict-coloured. It's the only way out of the sheet; there's no drag or backdrop dismissal. **Close**, in the top app bar, is still there as this screen's own way out (the same rule \`VerdictScreen\` follows), separate from the sheet's own dismissal rules.

**Not a documented prop / no matching component:** the explanation paragraph's mixed bold is built with plain \`<strong>\` spans, tokens only (\`font/greed/body/m/bold\`) — there's no rich-text component in Storybook.
`;

const Q2 = 'What do mitochondria do, and why does a cell need them?';

// content/voice-recall-questions.md, Q2's three concepts and explanation.
const Q2_EXPLANATION: { text: string; concept?: ConceptId }[] = [
  { text: 'Mitochondria are where the cell gets its ' },
  { text: 'energy', concept: 'A' },
  { text: '. They break down ' },
  { text: 'glucose', concept: 'C' },
  { text: ' (sugar from food) using oxygen in a process called ' },
  { text: 'cellular respiration', concept: 'B' },
  { text: ', and the energy released powers everything else the cell does.' },
];

/** Bolds only the concepts the (mocked) judge found missing. */
function explainQ2(missing: ConceptId[]): ReactNode {
  return Q2_EXPLANATION.map((segment, i) =>
    segment.concept && missing.includes(segment.concept) ? <strong key={i}>{segment.text}</strong> : segment.text,
  );
}

const meta = {
  title: 'Screens/WhyScreen',
  component: WhyScreen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: DESCRIPTION } },
  },
  args: {
    question: Q2,
    progress: 50,
    onClose: fn(),
    onGotIt: fn(),
  },
} satisfies Meta<typeof WhyScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pass: "They make energy for the cell by breaking down glucose." hits A and C — only B is missing. */
export const AfterPass: Story = {
  args: {
    outcome: 'Pass',
    transcript: 'They make energy for the cell by breaking down glucose.',
    explanation: explainQ2(['B']),
  },
  play: async ({ canvas, canvasElement, args }) => {
    await expect(canvas.getByText(/They make energy for the cell/)).toBeVisible();
    const strongs = [...canvasElement.querySelectorAll('strong')].map((el) => el.textContent);
    await expect(strongs).toEqual(['cellular respiration']);

    await userEvent.click(canvas.getByRole('button', { name: 'Got it' }));
    await expect(args.onGotIt).toHaveBeenCalledTimes(1);

    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/** Partial: "They're the powerhouse of the cell." hits only A (energy) — B and C are missing. */
export const AfterPartial: Story = {
  args: {
    outcome: 'Partial',
    transcript: "They're the powerhouse of the cell.",
    explanation: explainQ2(['B', 'C']),
  },
  play: async ({ canvasElement }) => {
    const strongs = [...canvasElement.querySelectorAll('strong')].map((el) => el.textContent);
    await expect(strongs).toEqual(['glucose', 'cellular respiration']);
  },
};

/** Fail: "They help the cell divide." hits nothing — all three concepts are missing. */
export const AfterFail: Story = {
  args: {
    outcome: 'Fail',
    transcript: 'They help the cell divide.',
    explanation: explainQ2(['A', 'B', 'C']),
  },
  play: async ({ canvas, canvasElement }) => {
    const strongs = [...canvasElement.querySelectorAll('strong')].map((el) => el.textContent);
    await expect(strongs).toEqual(['energy', 'glucose', 'cellular respiration']);

    // Got it floats clear above the sheet's own top edge, not overlapping it
    // (reference/Quiz-Why-explanation.png).
    const gotIt = canvas.getByRole('button', { name: 'Got it' }).getBoundingClientRect();
    const sheet = canvasElement.querySelector('[role="dialog"]')!.getBoundingClientRect();
    await expect(gotIt.bottom).toBeLessThanOrEqual(sheet.top);
  },
};

/** A long answer still clears the sheet — the same Overflow anchoring VerdictScreen uses, measured against the room the peeking Got it row leaves above the sheet. */
export const AfterPassLongAnswer: Story = {
  name: 'After Pass, long answer',
  args: {
    outcome: 'Pass',
    // Same long sample VerdictScreen's own stories use, long enough to
    // overflow regardless of exactly how much room the peek row leaves.
    transcript:
      "Mitochondria is the powerhouse of the cell, it converts glucose and oxygen into ATP through cellular respiration, which the cell then uses as energy for basically everything it does, like moving stuff around and building proteins and dividing. It also has its own DNA separate from the nucleus, which is one of the reasons scientists think it used to be a free living bacteria that got absorbed by a bigger cell a really long time ago, and the two of them just started working together instead of one eating the other, that's the endosymbiotic theory. Every cell has a different number of them depending on how much energy that part of the body needs, so muscle cells and heart cells have way more than something like a skin cell. And the folds on the inside, the cristae, give it way more surface area so it can make more ATP at once, which is why the inner membrane is all folded up like that. Oh and if you exercise a lot your muscle cells can actually build more mitochondria over time.",
    explanation: explainQ2([]),
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('[data-overflowing]')).toBeInTheDocument());
    const area = canvasElement.querySelector('[data-overflowing]')!;
    // The whole covered region, not just the sheet's own box: its parent
    // wraps the peeking mascot + Got it row too, and that row sits above the
    // sheet's own top edge. Checking only the sheet's own top wouldn't catch
    // a transcript running under the peek instead (the bug the measured
    // height's parent element, not just the sheet, was fixed to catch).
    const covered = canvasElement.querySelector('[role="dialog"]')!.parentElement!;
    const newestLine = area.querySelector('p:last-of-type')!;
    await expect(newestLine.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      covered.getBoundingClientRect().top,
    );
  },
};
