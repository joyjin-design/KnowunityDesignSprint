import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { MicOffScreen } from './MicOffScreen';

const DESCRIPTION = `
**SPEC.md screen 5: the mic-off sheet.** Shown when the student taps Start but mic permission has since been revoked.

**Behind the sheet:** the loop's Idle look — mascot, question bubble, disclaimer, \`TranscriptDisplay\` Empty. The tap never reaches Recording, since the permission check fails first, so nothing behind the sheet changes from Idle. Screen 10 isn't built yet, so this reconstructs Idle inline, the same way \`VerdictScreen\` (screen 1) reconstructs it behind the verdict sheet. **No dim** (revised 2026-09-17): this screen originally followed SPEC.md's general sheet rule (\`showBottomSheetBackground\`), but that scrim paints over the transcript/disclaimer text itself, not just the space around it, and was found to crush both below the 4.5:1 contrast floor (an eval panel's Accessibility hard-gate finding). Now a second documented exception alongside the verdict sheet, for the same reason: the content needs to stay legible, not just present.

**Sheet content, revised 2026-09-15 against a reference mockup** ("Permission ask (invented — no system equivalent)", Figma 13666:3837): \`BottomSheetAppBar\` (\`variant="withTitle"\`) now carries the title and Settings instructions directly, not a separate \`TextBlock\` in \`middleSection\` — \`middleSection\` is unused. \`ButtonGroup\` (Horizontal, L) of \`ButtonIcon\` Skip + \`Button\` Primary "Type instead" stays in \`bottomSection\`.

**Actions:** **Type instead** (\`onTypeInstead\`) → the typing placeholder. **Skip** (\`onSkip\`) → next question. No Open Settings button — a web app can't deep-link there.

**Settings copy** ("Open Settings, find Voice recall, then turn on Microphone.") matches the reference mockup, but is still pending SPEC.md Open #2 ("The Settings steps copy for the gate and mic-off sheet"), itself blocked on the Verification-step-0 spike (home-screen web app vs. Safari tab changes the real navigation path). Expect this to change once the spike runs.

**Fixed: the Skip button was invisible against the sheet.** \`ButtonIcon\` Secondary's real fill is \`background/surface\` — the same colour as the sheet itself, the same known gap \`ResultBtm\` already worked around for its own Skip button (sprint-context.md, 2026-09-11). Same fix here: a local \`.skipButton\` override tints the inner circle to \`interactive/secondary\` + \`interactive/onSecondary\` instead.

**Component fixes (affect every \`BottomSheet\`/\`BottomSheetAppBar\` usage going forward):**
- \`BottomSheetAppBar\`'s \`withTitle\` inline padding is now \`space.600\` (24px), not the real component's own bound 16px — matches the reference mockup, the first real placed usage of this variant.
- \`BottomSheet\`'s \`bottomSection\` padding is now \`space.700\` (28px) on every side, not the real component's own bound 16px — reconciles it with \`ResultBtm\`'s own \`.bottomCta\`, which already uses this exact padding for the same kind of sheet action row, and matches the reference mockup.
- \`BottomSheetAppBar\`'s title and caption are now left-aligned (\`.textSection\`'s \`align-items\` and both text rules), not centered — confirmed against the reference mockup on review, applied to every variant that shows text.

**Not replicated from the reference mockup:** a partial-width "Divider" instance sitting inside the app bar's own padding — reads as an artifact of a rough, hand-built mockup ("invented — no system equivalent") rather than a deliberate choice, so the sheet keeps its single top hairline.

**Built inline, not promoted (component-gaps.md):** the mascot/bubble/shadow and the XP chip, the same items already logged for screen 1 — SPEC.md's screen 10 keeps these inline on purpose, so this is their second occurrence, not a promotion trigger.
`;

const Q1 = 'What does the nucleus do in a cell?';

const meta = {
  title: 'Screens/MicOffScreen',
  component: MicOffScreen,
  tags: ['autodocs', '!dev'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: DESCRIPTION } },
  },
  args: {
    question: Q1,
    progress: 0,
    onClose: fn(),
    onTypeInstead: fn(),
    onSkip: fn(),
  },
} satisfies Meta<typeof MicOffScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, canvasElement, args }) => {
    await expect(canvas.getByRole('dialog', { name: 'Your mic is off' })).toBeVisible();
    await expect(canvas.getByText('Your mic is off')).toBeVisible();
    await expect(
      canvas.getByText('Open Settings, find Voice recall, then turn on Microphone.')
    ).toBeVisible();
    await expect(canvas.getByText(Q1)).toBeVisible();
    await expect(canvas.getByText("I'm listening. Feel free to say your answer out loud")).toBeVisible();

    // Behind the sheet, unlike the verdict sheet.
    await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');

    // Title and caption are left-aligned, matching the reference mockup
    // (Figma 13666:3837) — not centered, the app bar's previous default.
    const title = canvas.getByText('Your mic is off');
    const caption = canvas.getByText('Open Settings, find Voice recall, then turn on Microphone.');
    await expect(title.getBoundingClientRect().left).toBeCloseTo(caption.getBoundingClientRect().left, 0);
    const dialogLeft = canvasElement.querySelector('[role="dialog"]')!.getBoundingClientRect().left;
    await expect(title.getBoundingClientRect().left).toBeLessThan(dialogLeft + 60);

    // The Skip button's circle is tinted, not left on background/surface.
    const skip = canvas.getByRole('button', { name: 'Skip' });
    const circle = skip.querySelector('span');
    await expect(circle && getComputedStyle(circle).backgroundColor).not.toBe(
      getComputedStyle(canvasElement.querySelector('[role="dialog"]')!).backgroundColor
    );

    await userEvent.click(skip);
    await expect(args.onSkip).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Type instead' }));
    await expect(args.onTypeInstead).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/** No dim behind the sheet (2026-09-17) — same as the verdict sheet, and for
 * the same reason: the scrim painted over the transcript/disclaimer text
 * itself, not just the space around it, crushing both below the 4.5:1
 * contrast floor. */
export const NoDimBehindTheSheet: Story = {
  name: 'No dim behind the sheet',
  play: async ({ canvas, canvasElement }) => {
    const scrim = canvasElement.querySelector<HTMLElement>('[class*="bottomSheetBackground"]');
    await expect(scrim).not.toBeInTheDocument();
    await expect(
      canvas.getByText("I'm listening. Feel free to say your answer out loud")
    ).toBeVisible();
  },
};

/** How the app renders it on the test iPhone, under the real status bar. */
export const OnDevice: Story = {
  name: 'showStatusBar=false',
  args: { showStatusBar: false, question: 'What do mitochondria do, and why does a cell need them?', progress: 25 },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('09:41')).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Type instead' })).toBeVisible();
  },
};
