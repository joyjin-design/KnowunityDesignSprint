import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { TypingPlaceholderScreen } from './TypingPlaceholderScreen';

const DESCRIPTION = `
**SPEC.md screen 4: the typing placeholder.** The typing turn is out of scope this sprint, so "Try typing instead" (Silence sheet) and "Type instead" (mic-off sheet) both land here instead of a real text input.

**No Figma frame.** SPEC.md marks this screen's layout and copy as Open — built as this session's best guess, then adjusted per your 2026-09-15 review.

**Action:** **Back to voice** (\`onBackToVoice\`) leaves the session for the exam plan (01Exam) — not idle for the same question, since typing has nothing to come back to. No Skip button: it's the screen's only action, and it already leaves the session, so nothing traps the student without it.

**Not built:** \`AnswerInput\` and \`Keyboard\` exist in the library but are unused here — using them would build the typing turn itself, which SPEC.md rules out this sprint.

**Spacing/type (2026-09-15 review):** 12px (\`size.space.300\`) between title and caption, up from the component's own 4px — a local override, since \`TextBlock\` isn't sitting next to a mascot here. Caption line height is 150% (\`line-height: 1.5\`), a literal ratio rather than a token: no line-height token equals 150% of Headline XS Regular's 18px.

**Title size (2026-09-15, second review pass):** 28px Bold/28 (\`font-greed-headline-m\`), not \`textBlock\`'s own L-variant title (headline/XL, 44px Bold/44) — the same title-size change made to \`GateScreen\`.
`;

const meta = {
  title: 'Screens/TypingPlaceholderScreen',
  component: TypingPlaceholderScreen,
  tags: ['autodocs', '!dev'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: DESCRIPTION } },
  },
  args: {
    onBackToVoice: fn(),
  },
} satisfies Meta<typeof TypingPlaceholderScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText("Typing isn't part of this prototype")).toBeVisible();
    const caption = canvas.getByText('This build is voice only. Go back to the exam plan to try again by voice.');
    await expect(caption).toBeVisible();

    // 150% line height on the caption, and no Skip button.
    await expect(getComputedStyle(caption).lineHeight).toBe('27px');
    await expect(canvas.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();

    // 12px between the title and the caption.
    const title = canvas.getByText("Typing isn't part of this prototype");
    const gap = caption.getBoundingClientRect().top - title.getBoundingClientRect().bottom;
    await expect(gap).toBeCloseTo(12, 0);

    // headline/M, 28px/28 — not textBlock's own headline/XL (44px/44).
    await expect(getComputedStyle(title).fontSize).toBe('28px');
    await expect(getComputedStyle(title).lineHeight).toBe('28px');

    await userEvent.click(canvas.getByRole('button', { name: 'Back to voice' }));
    await expect(args.onBackToVoice).toHaveBeenCalledTimes(1);
  },
};

/** How the app renders it on the test iPhone, under the real status bar. */
export const OnDevice: Story = {
  name: 'showStatusBar=false',
  args: { showStatusBar: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('09:41')).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Back to voice' })).toBeVisible();
  },
};
