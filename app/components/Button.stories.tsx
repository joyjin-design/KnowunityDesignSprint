import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './Button';

const FIGMA_DESCRIPTION = `
**WHAT:** Label plus optional left/right/center icon containers. 36 variants: Primary/Secondary/Tertiary × S/M/L × Default/Pressed/Disabled/Loading.

**WHEN TO USE:** Confirmed in Entry points exploration: Primary, size L, Default, paired with a Secondary buttonIcon and a horizontal buttonGroup. Small sample (4 instances) but a real, repeated pattern.

**DON'T:** Don't combine the Center Icon Container with the Left/Right Icon Containers assuming they layer together. No instance combines them; unconfirmed what happens if you try.

---

Notes from the React build, for anything the Figma description above doesn't cover:
- Pressed is CSS \`:active\`, not a prop — a real press drives it, the way a real button should work, rather than a setting someone flips.
- Disabled and Loading both set the real HTML \`disabled\` attribute (loading implies disabled), but they look different on purpose: Loading keeps the variant's normal fill and swaps the label for a spinner; Disabled mutes to \`background/surface\` / \`text/disabled\`.
- Secondary's 3px stroke weight in Figma has an empty \`strokes\` array — no visible border in the real component — so this is built borderless to match, not bordered to match the number.
- The pill's inner-shadow bezel (black @15% opacity, −2px offset at S/M, −4px at L) is included on Primary and Secondary. It had no matching token at first — added \`color.alpha.dark-15\` and \`size.depth.Negative 050\` to tokens/tokens.json to cover it, rather than approximate with an existing one.
`;

const meta = {
  title: 'Components/Button',
  component: Button,
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
    variant: { control: 'radio', options: ['Primary', 'Secondary', 'Tertiary'] },
    size: { control: 'radio', options: ['S', 'M', 'L'] },
  },
  args: {
    variant: 'Primary',
    size: 'S',
    children: 'Continue',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pressed: Story = {
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button');
    // Press and hold (no release) so the real :active state stays visible.
    await userEvent.pointer({ keys: '[MouseLeft>]', target: button });
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Loading: Story = {
  args: { loading: true },
};
