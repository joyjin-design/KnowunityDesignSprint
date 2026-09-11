import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ButtonGroup } from './ButtonGroup';
import { Button } from './Button';
import { ButtonIcon } from './ButtonIcon';

function SkipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" aria-hidden="true">
      <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const FIGMA_DESCRIPTION = `
**WHAT:** A frame holding exactly two nested button instances. Variants: Horizontal/Vertical x M/L.

**WHEN TO USE:** Confirmed instances are all Horizontal, size L, wrapping the primary button + secondary buttonIcon pair. No confirmed usage of Vertical or size M yet.

**DON'T:** Don't expect more than two slots. Every variant hardcodes exactly two nested button instances, not a flexible list.

---

Notes from the React build, for anything the Figma description above doesn't cover:
- \`children\` is typed as a two-element tuple, matching the real component's hardcoded two-slot structure — there's no flexible list to build for.
- Horizontal's sizing isn't symmetric: the real component's first slot hugs its own content width and the second fills the remaining row width (confirmed from the real buttonIcon + button pair's own bound sizing, not assumed). Vertical stacks both slots at full width instead.
- Gap is \`size.space.100\` (4px) at Horizontal M, \`size.space.200\` (8px) at Horizontal L and Vertical L, and \`size.space.0\` (0px) at Vertical M — each read straight off the real component's own bound spacing variable, including the M/Vertical zero-gap, which looks like an edge case but is what the file actually has.
`;

const meta = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
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
    variant: { control: 'radio', options: ['Horizontal', 'Vertical'] },
    size: { control: 'radio', options: ['M', 'L'] },
  },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--color-background-page)', padding: 'var(--size-space-600)', width: '334px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

// The one confirmed real pattern: buttonIcon (secondary) + button (primary).
export const HorizontalL: Story = {
  name: 'Horizontal, L',
  args: {
    variant: 'Horizontal',
    size: 'L',
    children: [
      <ButtonIcon key="skip" variant="Secondary" size="L" icon={<SkipIcon />} aria-label="Skip" />,
      <Button key="continue" variant="Primary" size="L">
        Continue
      </Button>,
    ],
  },
};

export const HorizontalM: Story = {
  name: 'Horizontal, M',
  args: {
    variant: 'Horizontal',
    size: 'M',
    children: [
      <ButtonIcon key="skip" variant="Secondary" size="M" icon={<SkipIcon />} aria-label="Skip" />,
      <Button key="continue" variant="Primary" size="M">
        Continue
      </Button>,
    ],
  },
};

export const VerticalL: Story = {
  name: 'Vertical, L',
  args: {
    variant: 'Vertical',
    size: 'L',
    children: [
      <Button key="a" variant="Secondary" size="L">
        Why?
      </Button>,
      <Button key="b" variant="Primary" size="L">
        Continue
      </Button>,
    ],
  },
};

export const VerticalM: Story = {
  name: 'Vertical, M',
  args: {
    variant: 'Vertical',
    size: 'M',
    children: [
      <Button key="a" variant="Secondary" size="M">
        Why?
      </Button>,
      <Button key="b" variant="Primary" size="M">
        Continue
      </Button>,
    ],
  },
};
