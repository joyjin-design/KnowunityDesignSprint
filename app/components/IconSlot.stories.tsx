import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Star } from '@phosphor-icons/react/dist/csr/Star';
import { IconSlot } from './IconSlot';

const FIGMA_DESCRIPTION = `
**WHAT:** Wrapper around a swappable icon instance. Variant axis is literally named "Size (IGNORE)" (100-400), plus an instance-swap property for the icon itself.

**WHEN TO USE:** The most-used primitive in the file, 99 real instances, nested inside buttonIcon, chips, and the appBar reference. Despite the "(IGNORE)" name, real usage actively varies this axis across 200/250/300.

**DON'T:** Don't assume "(IGNORE)" means there's a better way to size it elsewhere in this file, there isn't one. Either the label is stale or 99 instances are already doing it wrong; confirm with Harry before treating either reading as settled.

---

Notes from the React build, for anything the Figma description above doesn't cover:
- Checked Storybook first: nothing existing could build this — it's a primitive, not a composition. The reverse is true though, and worth knowing: \`Button\`, \`ButtonIcon\`, \`Chip\`, \`Snackbar\` and \`bottomSheetVerdict\` each already hand-roll their own icon box from the same \`size.icon.*\` scale (roughly 16 declarations across five stylesheets). This component is what they'd collapse onto. That refactor wasn't part of this build.
- **The axis name.** Figma calls it \`Size (IGNORE)\`, which isn't a usable JS identifier, so the prop is \`size\`; the six values are unchanged. Deliberately **not** renamed in Figma, unlike \`Bottom-sheet App Bar\`'s \`Type\` → \`variant\`: that one was purely a naming-convention fix, whereas this label encodes an open question the description itself raises ("confirm with Harry"). Renaming it now would quietly erase the flag that prompts that conversation. design-system.md already uses this axis as its cautionary example of why a warning shouldn't be baked into a property name.
- All six sizes bind cleanly to \`Size/Icon/*\` in Figma — 100/150/200/250/300/400 → 8/12/16/20/24/32px — and every one already exists as \`--size-icon-*\`. No token gaps.
- Two authoring inconsistencies in the real set, reproduced as the consistent version rather than copied: only the \`100\` variant binds both width *and* height (the other five bind width only, leaving height raw), and \`250\` is \`layoutSizingHorizontal: FILL\` where the other five are FIXED, so it would stretch instead of staying 20px square. All six are built here as fixed squares, which is what all six currently *render* as.
- The default is \`400\`, matching the component's own default, even though the description says real usage varies across 200/250/300 — the same convention \`Chip\` follows in keeping Figma's default over its confirmed real size.
- The slot paints nothing: no fill, no padding, no radius, no colour. The icon inside is expected to paint with \`currentColor\` so it inherits its parent's tint, the same contract \`Button\` and \`ButtonIcon\` already document.
`;

const meta = {
  title: 'Components/IconSlot',
  component: IconSlot,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: { description: { component: FIGMA_DESCRIPTION } },
  },
  argTypes: {
    size: { control: 'radio', options: ['100', '150', '200', '250', '300', '400'] },
  },
  args: {
    size: '400',
    children: <Star weight="fill" />,
  },
  // The slot has no colour of its own, so it needs a parent that sets one —
  // the same reason TextBlock and MascotSlot carry a background decorator.
  decorators: [
    (Story) => (
      <div
        style={{
          width: '390px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--size-space-600)',
          background: 'var(--color-background-page)',
          color: 'var(--color-text-primary)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IconSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Size100: Story = {
  name: 'Size (IGNORE)=100',
  args: { size: '100' },
};

export const Size150: Story = {
  name: 'Size (IGNORE)=150',
  args: { size: '150' },
};

export const Size200: Story = {
  name: 'Size (IGNORE)=200',
  args: { size: '200' },
};

export const Size250: Story = {
  name: 'Size (IGNORE)=250',
  args: { size: '250' },
};

export const Size300: Story = {
  name: 'Size (IGNORE)=300',
  args: { size: '300' },
};

export const Size400: Story = {
  name: 'Size (IGNORE)=400',
  args: { size: '400' },
};
