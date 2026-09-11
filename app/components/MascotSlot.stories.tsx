import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MascotSlot } from './MascotSlot';

const FIGMA_DESCRIPTION = `
**WHAT:** Sizing wrapper around the mascot illustration. Variants: XL/2XL/3XL/4XL only, no color or state control.

**WHEN TO USE:** All 11 real instances use 2XL, 3XL, or 4XL, including the "approving" celebration moment paired with a title+caption text pattern. XL (the component's own default) never appears in practice. Reserved for large, hero-scale mascot moments.

**DON'T:** Don't reach for this at small sizes expecting it to look right. Nothing in the file demonstrates that, and XL being the smallest option suggests small appearances aren't this component's job.

---

Notes from the React build, for anything the Figma description above doesn't cover:
- \`size\` is the only real *exposed* component property — the real instances all expose exactly this and nothing else (confirmed by instantiating the component and reading back its \`componentProperties\`).
- \`expression\` is **not** a real exposed Figma property, added here ahead of Figma's own interface. Internally the box wraps a nested instance-swap ("Homie") bound to \`standby\` by default, and that property isn't exposed up to \`mascotSlot\`'s own instances — but designers already override it by hand per-instance anyway: a sweep of all 28 real \`mascotSlot\` instances in the file found \`standby\`, \`thinking\`, \`excited\`, and \`approving\` all in active use (including the "approving" celebration moment the WHEN TO USE note calls out). Since the real file already needs this and the artwork already exists as local assets, \`expression\` was added as a pragmatic prop rather than left broken. The right long-term fix is still to ask Harry to expose the Homie property formally in Figma and rebuild to match — this prop should be treated as ahead of the source of truth, not a mirror of it.
- \`expression\`'s options are the full mascot expression set already shipped at \`public/images/*.svg\` (amazed, angry, approving, confused, dazed, determined, excited, giggling, laughing, overIt, questioning, sad, standby, thinking). Only \`standby\`, \`thinking\`, \`excited\`, and \`approving\` are confirmed real usage; the rest are available since the assets exist, but treat them as unproven the same way Chip's thin real usage is flagged — don't assume they're validated for a specific screen just because the file exists.
- Box size is a fixed square per variant (XL 64 / 2XL 120 / 3XL 200 / 4XL 320), matching \`size.illustration.{800,1500,2500,4000}\` exactly. Padding is a constant 12px (\`size.space.300\`) on all sides at every size, not scaled — read straight off the real component's bound padding variable.
`;

const EXPRESSION_OPTIONS = [
  'standby',
  'amazed',
  'angry',
  'approving',
  'confused',
  'dazed',
  'determined',
  'excited',
  'giggling',
  'laughing',
  'overIt',
  'questioning',
  'sad',
  'thinking',
] as const;

const meta = {
  title: 'Components/MascotSlot',
  component: MascotSlot,
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
    size: { control: 'radio', options: ['XL', '2XL', '3XL', '4XL'] },
    expression: { control: 'select', options: EXPRESSION_OPTIONS },
  },
  args: {
    size: 'XL',
    expression: 'standby',
  },
  // MascotSlot renders no fill of its own; real usage is always on the dark
  // screen background (hero-scale mascot moments), so give the isolated
  // Storybook canvas that same context instead of the default white.
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--color-background-page)', padding: 'var(--size-space-600)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MascotSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const XL: Story = {
  args: { size: 'XL' },
};

export const TwoXL: Story = {
  name: '2XL',
  args: { size: '2XL' },
};

export const ThreeXL: Story = {
  name: '3XL',
  args: { size: '3XL' },
};

export const FourXL: Story = {
  name: '4XL',
  args: { size: '4XL' },
};

// The three non-default expressions confirmed in real use, at the sizes
// they're actually found at in the file — not the component's own default.
export const Thinking: Story = {
  args: { size: '3XL', expression: 'thinking' },
};

export const Excited: Story = {
  args: { size: '3XL', expression: 'excited' },
};

export const Approving: Story = {
  args: { size: '4XL', expression: 'approving' },
};
