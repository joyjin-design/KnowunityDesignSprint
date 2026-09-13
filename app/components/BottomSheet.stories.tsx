import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BottomSheet } from './BottomSheet';
import { BottomSheetAppBar } from './BottomSheetAppBar';
import { Button } from './Button';
import { ButtonGroup } from './ButtonGroup';
import { TextBlock } from './TextBlock';

const FIGMA_DESCRIPTION = `
**WHAT:** The sheet shell — a \`background/surface\` panel that rises from the bottom edge with a \`radius/900\` top corner, a grab-handle app bar, a \`middleSection\` slot for content and a \`bottomSection\` slot for actions. height=S/M/L.

**WHEN TO USE:** Any sheet that slides up over a dimmed screen. Compose it rather than drawing a sheet by hand: content goes in middleSection, CTAs in bottomSection. Pairs with \`scaffold\`'s own Bottom-sheet background and \`bottomSheetOnly\` slot.

**DON'T:** Don't expect height=S/M/L to fix the sheet's size — all three variants hug their content, so treat height as a cap on how tall the sheet may grow, not a guaranteed height. Don't put persistent screen content inside it; it disappears with the sheet.

---

Notes from the React build, for anything the Figma description above doesn't cover:
- **This description didn't exist.** The Figma set and all three of its variants carried an empty description, and the component is absent from design-system.md entirely. The text above was written during this build and pushed back into the component set's Description field in Figma, per design-system.md's own rule.
- **\`height\` is the biggest divergence, and it's deliberate.** In Figma all three variants are \`layoutSizingVertical: HUG\`, so the S/M/L totals (300/494/768) aren't sizes the component enforces — they're whatever the two empty slots happened to measure, and they're mutually inconsistent (S: 114/114, M: 364/58, L: 348/348). None of the three numbers matches a token. By your decision they're implemented as viewport detents instead — \`max-height\` of 40/60/90dvh — which keeps the hug behaviour for short content, caps tall content, and needs no invented pixel values. This is the one place the build uses a non-token value, agreed up front.
- Because the cap can now bite, \`middleSection\` scrolls (\`overflow-y: auto\`, \`flex: 1 1 auto\`) and uses \`justify-content: safe center\` so overflowing content isn't clipped past the top edge. Figma's own slots are \`clipsContent\` with no scroll designed — this is the same unresolved question \`transcriptDisplay\`'s Overflow state already flagged.
- **Only one instance of this component exists in the whole file**, on a "Working log" frame, resized to 400×444 — which matches no variant. So there's no confirmed real usage to build against, the way \`snackbar\` had none.
- **Width is fluid (100%)**, not Figma's 350px. The file disagrees with itself anyway (sheet variants 350, app bar 375, the one real instance 400), none of it bound to a token, and a sheet spans the screen — the same call made for \`transcriptDisplay\` and \`progressIndicator\`.
- **\`bottomSection\` is omitted entirely when empty** rather than rendering as a bare 32px strip of padding, which is what Figma's always-present slot would produce.
- **The embedded app bar isn't consistent across the three variants:** height M and L embed \`Bottom-sheet App Bar\` variant=Default (handle only), but height S embeds variant=dismissAndAction. Nothing about a sheet's height should change whether it has a close button, so this build uses Default for all three and treats S as an authoring slip.
- **The sheet's own API exposes only \`height\`, \`middleSection\` and \`bottomSection\`**, so the app bar's variant/title/caption aren't reachable through it. Built with an \`appBar\` prop defaulting to \`<BottomSheetAppBar variant="Default" />\` so a titled or dismissible header can still be composed in; that override goes beyond Figma's current interface, the same way \`mascotSlot\`'s \`expression\` and \`buttonVoice\`'s \`ctaText\` do.
- **This component asserts \`role="dialog"\` but not \`aria-modal\`, deliberately.** \`aria-modal\` is a promise that everything outside the sheet is inert — it confines a screen reader's cursor but has no effect on keyboard focus, so asserting it without a real focus trap leaves keyboard and screen-reader users seeing different things. The modality here lives in \`scaffold\` (its Bottom-sheet background and \`bottomSheetOnly\` slot), not in this component, so whoever mounts the sheet owns focus trapping, inertness, \`aria-modal\` and Esc-to-close. \`aria-label\` is a **required** prop, since a dialog with no accessible name announces as just "dialog". Note \`resultBtm\` renders a plain \`<div>\` with no role at all — the two sheets should eventually agree on this.
- **The file's one placed instance argues for keeping the header bare.** Its app bar is overridden to dismissAndAction with the title "Let's avoid titles & buttons up top" and the caption "Let's avoid captions whenever possible" — designer guidance written into the content itself, which is why Default is this component's default here.
- **Top hairline reconciled with \`resultBtm\`.** This set bound no stroke at all, where resultBtm draws a 1px top-only \`border/default\` hairline (\`strokeTopWeight\` 1, all other edges 0, \`INSIDE\`) that separates the sheet from the dimmed screen behind it. By your decision that hairline was added to all three variants **in Figma** and mirrored here. Worth knowing: \`border/default\` and \`background/stacking\` both alias \`alpha.light-10\`, so the hairline and the grab handle now render the identical colour — one 10%-white treatment for both, which is what resultBtm was already doing.
`;

const middle = (
  <TextBlock
    variant="M"
    title="Ready to say it out loud?"
    caption="You'll speak one term, then Knowie checks it."
    showCaption
  />
);

const actions = (
  <ButtonGroup variant="Vertical" size="L">
    {[
      <Button key="start" variant="Primary" size="L">
        Start recall
      </Button>,
      <Button key="later" variant="Secondary" size="L">
        Maybe later
      </Button>,
    ]}
  </ButtonGroup>
);

const meta = {
  title: 'Components/BottomSheet',
  component: BottomSheet,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: FIGMA_DESCRIPTION } },
  },
  argTypes: {
    height: { control: 'radio', options: ['S', 'M', 'L'] },
  },
  args: {
    height: 'S',
    middleSection: middle,
    bottomSection: actions,
    'aria-label': 'Voice recall',
  },
  // The sheet sits at the bottom of a dimmed screen in real use; the wrapper
  // stands in for scaffold's Bottom-sheet background so the surface doesn't
  // float on Storybook's default white.
  decorators: [
    (Story) => (
      <div
        style={{
          width: '390px',
          height: '844px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          background: 'var(--color-background-page)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const S: Story = {
  name: 'height=S',
  args: { height: 'S' },
};

export const M: Story = {
  name: 'height=M',
  args: { height: 'M' },
};

export const L: Story = {
  name: 'height=L',
  args: { height: 'L' },
};

export const WithTitledAppBar: Story = {
  name: 'With a titled app bar',
  args: {
    height: 'M',
    appBar: <BottomSheetAppBar variant="dismissOnly" title="Voice recall" />,
  },
};
