import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Chip } from './Chip';

const FIGMA_DESCRIPTION = `
**WHAT:** Pill with optional leading/trailing icon slots, text label, Primary/pro color track, active/inactive toggle. 16 variants.

**WHEN TO USE:** Thin evidence, only one real instance found (size S, Primary, inactive). The "pro" color and "active" toggle suggest filter chips or a PRO tag, but neither use case is confirmed yet.

**DON'T:** Don't treat the component's own default (XXS, Primary, inactive) as the expected size. The one real usage is size S, not XXS.

---

Notes from the React build, for anything the Figma description above doesn't cover:
- This is a *different* component from the one actually wired into the snackbar instance found elsewhere in the file (a stale, orphaned single component named \`chips/S/Info/True\`, not part of this proper component set — its color options don't even exist here). This build follows this real, current \`chips\` component set, per design-system.md's own instruction to reattach to the real one rather than document a stale duplicate as valid.
- \`active\` maps to Figma's \`active\` variant (False/True) as a real \`boolean\` prop, the same way \`showLeftIcon\`/\`showRightIcon\` are booleans rather than string variants.
- Renders as a real \`<button>\` with \`aria-pressed\` when \`onClick\` is given (filter-chip use), or a plain non-interactive \`<span>\` when it isn't (static tag/PRO-badge use) — since the two confirmed-possible use cases need different semantics and neither is confirmed as *the* use yet.
- Inactive looks identical for both colors (\`background/surface\` + \`text/primary\`) — confirmed from the real file, not assumed. Only active swaps in the real color (\`interactive/primary\`/\`onPrimary\` for Primary, \`pro/bold\`/\`onBold\` for pro).
- The four fixed heights (20/24/32/40px by size) aren't derived from padding, the same way Button's tap-target minimums aren't — \`size.control.{XXS,XS,S,M}\` was added to tokens.json to cover them.
`;

const meta = {
  title: 'Components/Chip',
  component: Chip,
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
    size: { control: 'radio', options: ['XXS', 'XS', 'S', 'M'] },
    color: { control: 'radio', options: ['Primary', 'pro'] },
  },
  args: {
    // The real confirmed usage is size S, Primary — not the component's own
    // XXS default, per Figma's own "don't" note above.
    size: 'S',
    color: 'Primary',
    children: 'Retry',
    onClick: () => {},
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inactive: Story = {
  args: { active: false },
};

export const Active: Story = {
  args: { active: true },
};
