import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ButtonIcon } from './ButtonIcon';

const FIGMA_DESCRIPTION = `
**WHAT:** Same size/state matrix as button, icon-only. Wraps a nested iconSlot instance instead of a label.

**WHEN TO USE:** Secondary action next to a primary button. Only observed as Secondary, size L, Default, paired 1:1 with the primary button/buttonGroup pattern.

**DON'T:** Don't try to change the icon by editing buttonIcon directly. The actual icon choice happens one layer down, inside the nested iconSlot.

---

Notes from the React build, for anything the Figma description above doesn't cover:
- Reuses \`Button\`'s own \`Spinner\` for Loading, rather than a second copy — its color is now an explicit prop since this component tints it differently for Tertiary (\`text/primary\` here, vs. \`text/link\` on \`Button\`).
- \`icon\` is required and should paint with \`currentColor\`, so it automatically picks up the right tint per variant/state (\`interactive/onPrimary\` for Primary, \`text/primary\` for Secondary/Tertiary, \`text/disabled\` when disabled).
- \`aria-label\` is required — this button never has visible text, so it needs its own accessible name.
- Primary has a real 1px \`border/default\` ring here, which plain \`Button\` never has on any variant. Confirmed from the real strokes data, not assumed.
- The circle's fixed diameter per size (32px/40px/56px) isn't derived from padding, the same way \`Button\`'s 48px tap-target minimum isn't. 32px and 40px happen to match existing tokens (\`size.space.800\`, \`size.illustration.500\`); 56px matched nothing, so \`size.illustration.700\` was added for it.
`;

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const meta = {
  title: 'Components/ButtonIcon',
  component: ButtonIcon,
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
    icon: <PlusIcon />,
    'aria-label': 'Add',
  },
} satisfies Meta<typeof ButtonIcon>;

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
