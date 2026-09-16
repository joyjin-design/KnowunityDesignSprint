import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { SummaryScreen } from './SummaryScreen';

const DESCRIPTION = `
**SPEC.md screen 8: the summary**, shown after the last of a node's 4 questions. Rebuilt 2026-09-15 to match reference/Finish-quiz.png and the matching real Figma frame (node 7366:69693, \`scaffold\` / size=iPhone 13, your link) — replacing the earlier row-by-row build.

**Composition:** \`MascotSlot\` (\`size="3XL"\`) + a headline/subhead pair, then a two-card stat row (XP, Score), then \`ButtonGroup\` (Horizontal, L) of \`Button\` Secondary **Share** + \`Button\` Primary **Claim XP** in \`bottomContent\`. No \`BottomSheet\` — this is a full screen, not an overlay.

**Headline/subhead/mascot expression are dynamic** on how many questions passed (\`passCount\`/\`totalCount\`): a clean run reuses Figma's own copy and expression ("Perfect lesson!", "You made 0 mistakes. How?!", \`expression="approving"\`) verbatim; the other two states are authored copy (not in SPEC.md, \`Voice-ux.md\` or the content file) — see the build report.

**Traded away from the earlier build, on your instruction:** the per-question rows (question, transcript snippet, verdict) and the Try again path — Try again is dropped for real (screen 10, 2026-09-15); a session is one pass through 4 questions, no reruns. **CLAUDE.md's transcript rule** is still met earlier in the flow — every \`VerdictScreen\`/\`WhyScreen\` already shows the transcript back at the moment of judging — not repeated here.

**Close (top-left X) is a deliberate addition**, not in the Figma frame at all: CLAUDE.md's "never trap the student" rule needs a way out, since Share and Claim XP are both decorative this sprint (your instruction, 2026-09-15) and neither one leaves the screen.

**The "Blazing" streak card is dropped**: nothing in this mocked session tracks elapsed time or a day-to-day streak, so showing one would be an invented number, the same category CLAUDE.md already rules out for XP ("static... never counts"). The two remaining cards split the row's width evenly instead of Figma's fixed 108px cards (which summed to 358px across three).

**Two token gaps, both already flagged elsewhere in this project:** the headline and stat values use an off-system condensed display face ("Greed VF-TRIAL"/"Greed Condensed-TRIAL" Heavy) with no matching \`--font-size\` or \`--font-line-height\` token at 44/48 and 24/20 — the same category of gap already logged on ResultBtm's Error title (24px Condensed Heavy). Composed from real weight/family primitives plus one literal, non-token number each, the same treatment \`TypingPlaceholderScreen\`'s own 150% caption line-height already uses.
`;

const meta = {
  title: 'Screens/SummaryScreen',
  component: SummaryScreen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: DESCRIPTION } },
  },
  args: {
    onClose: fn(),
    onShare: fn(),
    onClaimXp: fn(),
  },
} satisfies Meta<typeof SummaryScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's own example state (node 7366:69693): a clean run, its exact copy and mascot expression. */
export const AllPass: Story = {
  args: { passCount: 4, totalCount: 4 },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText('Perfect lesson!')).toBeVisible();
    await expect(canvas.getByText('You made 0 mistakes. How?!')).toBeVisible();
    await expect(canvas.getByText('4/4')).toBeVisible();

    // Present and clickable, but decorative this sprint (your instruction,
    // 2026-09-15): the app itself (PrototypeFlow) never passes onShare or
    // onClaimXp, so neither leaves the screen there — the only way out is
    // Close. Wired here only so this story can prove the click itself is safe.
    await userEvent.click(canvas.getByRole('button', { name: 'Share' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Claim XP' }));
    await expect(args.onShare).toHaveBeenCalledTimes(1);
    await expect(args.onClaimXp).toHaveBeenCalledTimes(1);

    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/** Some passed, some missed — authored copy, not in Figma. */
export const SomeNonPass: Story = {
  args: { passCount: 1, totalCount: 4 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Lesson complete!')).toBeVisible();
    await expect(canvas.getByText('You explained 1 of 4 out loud.')).toBeVisible();
    await expect(canvas.getByText('1/4')).toBeVisible();
  },
};

/** Nothing passed — the encouraging tail end of the mock judge's range, an
 * expression other than the "disappointed" ones (CLAUDE.md-adjacent: a false
 * "wrong" reading costs more here than in multiple choice). */
export const NonePass: Story = {
  args: { passCount: 0, totalCount: 4 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Lesson complete')).toBeVisible();
    await expect(canvas.getByText("Let's go over these again next time.")).toBeVisible();
    await expect(canvas.getByText('0/4')).toBeVisible();
  },
};
