import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ProgressIndicator } from './ProgressIndicator';

const FIGMA_DESCRIPTION = `
**WHAT:** Ring/bar with five fixed progress snap-points (0/25/50/75/100), not a freeform percentage. Primary/Coral x thickness 24/16.

**WHEN TO USE:** All 7 confirmed instances use thickness 16 (never the component's own default of 24), progress values of 0 and 25 only. Confirmed real usage: inside the appBar's Slot, showing lesson/quiz progress in the top nav.

**DON'T:** Don't expect arbitrary progress values. It's a five-step variant, not a percentage input.

---

Notes from the React build, for anything the Figma description above doesn't cover:
- Checked Storybook first: nothing existing covers progress display, so this is a new component, matching design-system.md's own \`progressIndicator\` entry.
- The fill's width per step is implemented as CSS percentages (0/25/50/75/100%) rather than transcribing each variant's specific pixel width. Figma's own five variants aren't proportional to their container (25% measures 86px of a 346px track, 75% measures 260px — hand-placed, not a formula), so percentages reproduce the five-step *intent* more faithfully than copying one frame's rounding.
- The track's own width isn't fixed at Figma's 350px frame. Real usage is inside appBar's Slot (a flexible container), and — unlike \`transcriptDisplay\`'s 358×448 box, which is confirmed reused seven times — nothing here confirms 350px as a real, repeated dimension. Built as \`width: 100%\` so it sizes to whatever slot holds it.
- Track/fill corner radius: Figma's own frames use a raw \`12\`, not bound to any variable, and 12 isn't in \`tokens.json\`'s radius scale (4/6/8/16/24/32/36/9999). On a 16–24px-tall bar, 12px and \`radius/Full\` clamp to the exact same rendered pill, and \`radius/Full\` is already the bound token on this same component's fill rectangle — so it's reused here too rather than inventing a new value.
- Track thickness (16/24) reuses \`size.icon.200\`/\`size.icon.300\` (same 16/24px values) rather than a raw pixel number, since \`tokens.json\` has no dedicated bar-thickness scale — the same kind of token borrowing Chip did for its fixed control heights.
- The 2px inset around the fill exists only on the \`thickness=24\` variant in Figma (thickness=16 has none) — reproduced as-is via \`size.space.050\`, not normalized away. The progress=0 "nub" width matches the fill's own inset-adjusted content height (\`size.icon.250\`, 20px, at thickness=24; \`size.icon.200\`, 16px, at thickness=16) so it renders as a circle, not a stadium.
- Container's invisible stroke is bound to a \`border/subtle\` color variable in Figma, but \`tokens.json\`'s \`border\` group has no \`subtle\` entry (only default/strong/focus/error/success/selected) — a real token gap. Not implemented here since the stroke is invisible in every real variant anyway (opacity+visibility both off).
- \`showText\` reveals a real hidden text layer ("Unit Progress") whose fixed content is a step-count fraction, not a percentage — sampled as \`"0/12"\` directly from the file. It's absolutely positioned centered over the bar in Figma (not beside it), and only exists at all on \`thickness=24\` variants — \`thickness=16\` has no such layer, so \`showText\` is a no-op there, matching the source exactly. The label also renders identically across all five \`progress\` values in Figma today (not wired to the ring), so it's reproduced here as the same static placeholder rather than invented as a computed counter — flagged as an open gap, same category as \`buttonVoice\`'s unwired icon swap.
- Text token: font is \`Greed/Caption S Bold\` (\`font-greed-caption-s-bold\`: weight semibold, size 2xs/11px, lineHeight 2xs/12px — an exact match for the real text node's bound style), color \`interactive/onSecondary\`.
`;

const meta = {
  title: 'Components/ProgressIndicator',
  component: ProgressIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: FIGMA_DESCRIPTION,
      },
    },
  },
  argTypes: {
    variant: { control: 'radio', options: ['Primary', 'Coral'] },
    thickness: { control: 'radio', options: ['24', '16'] },
    progress: { control: 'radio', options: [0, 25, 50, 75, 100] },
    showText: { control: 'boolean' },
  },
  args: {
    // Real confirmed usage is thickness 16, not the component's own 24
    // default, per Figma's own "don't" note above.
    variant: 'Primary',
    thickness: '16',
    progress: 0,
    showText: false,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '390px',
          boxSizing: 'border-box',
          padding: 'var(--size-space-400)',
          background: 'var(--color-background-page)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Progress0: Story = {
  args: { progress: 0 },
};

export const Progress25: Story = {
  args: { progress: 25 },
};

export const Progress50: Story = {
  args: { progress: 50 },
};

export const Progress75: Story = {
  args: { progress: 75 },
};

export const Progress100: Story = {
  args: { progress: 100 },
};

export const Coral: Story = {
  args: { variant: 'Coral', progress: 25 },
};

export const WithText: Story = {
  // showText only has an effect at thickness=24 — the real file has no
  // label layer on the thickness=16 variants, per this component's docs.
  args: { thickness: '24', showText: true, progress: 25 },
};
