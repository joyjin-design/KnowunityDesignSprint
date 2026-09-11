import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TextBlock } from './TextBlock';

const FIGMA_DESCRIPTION = `
**WHAT:** Title text layer plus optional caption text layer, four sizes (XL/L/M/S), showCaption toggle.

**WHEN TO USE:** Real precedent exists as plain text (not yet this component): a short emotional headline plus a specific supporting stat, next to a celebratory mascotSlot. Example: "Perfect lesson!" as title, "You made 0 mistakes. How?!" as caption. Follow this pattern (title = feeling, caption = specific detail, paired with mascot) when possible, and prefer the real component over hand-built text where you can.

**DON'T:** Don't keep hand-building title/caption pairs instead of switching to the real component. Every instance built as plain text instead of a textBlock instance won't inherit future updates to size steps or spacing.

---

Notes from the React build, for anything the Figma description above doesn't cover:
- Each \`variant\` pairs a fixed title/caption type combo, read straight off the real component's bound text styles: XL = \`Greed/Display M\` title + \`Greed/Headline XS Regular\` caption, L = \`Greed/Headline XL\` title + \`Greed/Headline XS Regular\` caption, M = \`Greed/Body M Bold\` title + \`Greed/Caption M Regular\` caption, S = \`Greed/Body S Bold\` title + \`Greed/Caption S Regular\` caption.
- Title binds \`text/primary\`, caption binds \`text/secondary\` (an alpha-68 wash over the same base color), matching the real component's fills exactly.
- Gap between title and caption is \`size.space.100\` (4px) at XL/L, \`size.space.050\` (2px) at M/S — the real component's own bound spacing, not a guess.
- The real component's title/caption letter-spacing (±1%) is skipped, same as Button's own build: tokens.json has no letter-spacing group, and CSS doesn't support \`%\` for it anyway.
- The frame hugs its content (Figma's own auto-width/auto-height sizing) rather than carrying a fixed box size, so this doesn't force a width — size it by placing it in context.
`;

const meta = {
  title: 'Components/TextBlock',
  component: TextBlock,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: FIGMA_DESCRIPTION,
      },
    },
  },
  argTypes: {
    variant: { control: 'radio', options: ['XL', 'L', 'M', 'S'] },
  },
  // TextBlock paints no fill of its own — it always sits on a dark screen
  // background in real use (next to a mascot moment). Without this wrapper
  // the isolated Storybook canvas renders it on white, which makes the a11y
  // color-contrast check flag text/primary and text/secondary as failing
  // against a background they're never actually placed on.
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--color-background-page)', padding: 'var(--size-space-600)' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    variant: 'XL',
    showCaption: true,
    title: 'Perfect lesson!',
    caption: 'You made 0 mistakes. How?!',
  },
} satisfies Meta<typeof TextBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const XL: Story = {
  args: { variant: 'XL' },
};

export const L: Story = {
  args: { variant: 'L' },
};

export const M: Story = {
  args: { variant: 'M' },
};

export const S: Story = {
  args: { variant: 'S' },
};

export const NoCaption: Story = {
  args: { variant: 'XL', showCaption: false },
};
