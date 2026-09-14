import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { AppBar } from './AppBar';
import { ProgressIndicator } from './ProgressIndicator';

const FIGMA_DESCRIPTION = `
**WHAT:** A top nav row. Formally offers one Slot inside "Top Nav Default"; real usage adds hand-placed elements beside it too.

**WHEN TO USE:** Lesson/quiz top nav. Confirmed real usage (Ai Chat/Quiz > Entry points, node 13499:3854): left icon button, a progressIndicator in the Slot (lesson progress), plus a chips+iconSlot pairing beside it (streak/lives count). Note: progressIndicator is NOT in the Slot's own declared preferred-values list (only chips matched); treat that list as incomplete, not authoritative.

**DON'T:** Don't expect picking one of the six variants alone to reproduce the real top nav. The working reference has elements outside the single formal Slot.

---

Notes from the React build, for anything the Figma description above doesn't cover:
- **Reused \`ButtonIcon\`** (variant=Tertiary, size=M) for every icon button. Figma's orphaned \`App Bar Button Icon\` set is the same thing: a 48px tap target around a transparent 40px \`radius/Full\` circle with a \`text/primary\` icon, and Default/Pressed/Disabled/Loading states. Two local overrides in AppBar match Figma's box and states (the glyphs still differ, since they're Phosphor, not Untitled): the icon box is 24px (\`Icon/300\`) instead of ButtonIcon M's 20px, and Pressed turns the icon \`text/secondary\`. Loading still renders ButtonIcon's spinner (ring and arc), not Figma's \`loading-01\` icon.
- **Reused \`Button\`** (variant=Tertiary, size=S) for the text button ("Skip"), standing in for Figma's orphaned \`App Bar Button\` (variant=text). Local overrides in AppBar match Figma: the \`Greed/Headline XXS Bold\` text style (15/16px), no baseline nudge, a label that hugs its text, and a \`text/secondary\` Pressed state. **Accessibility trade, by decision:** hugging the label drops Button's 48px minimum width, so "Skip" is only about 30px wide to tap (height stays 48px). Not matched: Figma's 1% letter spacing (tokens.json has no letter-spacing group), and the Loading spinner, which Button tints \`text/link\` where Figma's loading icon is \`text/primary\` (logged, left as-is).
- **Anything beside the Slot goes inside \`slot\`.** The description notes that real usage places a chip next to the progress bar, outside the formal Slot. Rather than invent a second slot prop, pass both into \`slot\`: it's a horizontal row with a 12px gap.
- **Icons are Phosphor**, by decision: ArrowLeft, DotsThreeVertical and Export (the box-with-arrow share glyph) stand in for Figma's Untitled-style \`arrow-left\`, \`dots-vertical\` and \`share-02\`, matching the icon family the code already uses. Every icon is replaceable through a prop. Flagged for Harry: the Figma library and the code use different icon families.
- **Width is fluid.** Figma frames the set at 375px, unbound to any variable (and not the project's 390px), so the row fills its container.
- **No fixed height.** Figma fixes the row at 56px with no binding. Here the 48px buttons, or the Slot's 48px min-height (\`size.space.1200\`), plus the \`space.200\` bottom padding add up to the same 56px.
- **Slot spacing, by decision:** Figma's Slot leaves a raw 10px on top/bottom and a raw 10px gap, and no 10px token exists. Built with 0 vertical padding (content is centred in the row either way) and a \`space.300\` (12px) gap; Figma's bindings were updated to match (Space/0, Space/300).
- **Background:** Figma stacks two identical \`background/page\` → transparent gradients (top to bottom). Both layers are reproduced, so content scrolling under the bar fades the way it does in Figma.
`;

const meta = {
  title: 'Components/AppBar',
  component: AppBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: FIGMA_DESCRIPTION } },
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: [
        'default',
        'leftIconButtonOnly',
        'leftAndRightIconButton',
        'leftAndRightButton',
        'leftAndTwoRightIconButtons',
        'leftAnd2RightButtons',
      ],
    },
    slot: { control: false },
    leftIcon: { control: false },
    rightIcon: { control: false },
    extraRightIcon: { control: false },
  },
  args: {
    variant: 'default',
    buttonText: 'Skip',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', background: 'var(--color-background-page)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'variant=default',
  args: { variant: 'default' },
};

export const LeftIconButtonOnly: Story = {
  name: 'variant=leftIconButtonOnly',
  args: { variant: 'leftIconButtonOnly' },
};

export const LeftAndRightIconButton: Story = {
  name: 'variant=leftAndRightIconButton',
  args: { variant: 'leftAndRightIconButton' },
};

export const LeftAndRightButton: Story = {
  name: 'variant=leftAndRightButton',
  args: { variant: 'leftAndRightButton' },
};

export const LeftAndTwoRightIconButtons: Story = {
  name: 'variant=leftAndTwoRightIconButtons',
  args: { variant: 'leftAndTwoRightIconButtons' },
};

export const LeftAnd2RightButtons: Story = {
  name: 'variant=leftAnd2RightButtons',
  args: { variant: 'leftAnd2RightButtons' },
};

/** The confirmed real usage from the description: a leading icon button with
 * lesson progress in the Slot. Shown with a close icon, as the voice recall
 * loop uses it. */
export const WithProgressInSlot: Story = {
  name: 'Slot with progressIndicator',
  args: {
    variant: 'leftIconButtonOnly',
    leftIcon: <X size="100%" aria-hidden="true" />,
    leftLabel: 'Close',
    slot: <ProgressIndicator thickness="16" progress={25} />,
  },
};
