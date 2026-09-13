import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ButtonVoice } from './ButtonVoice';

const FIGMA_DESCRIPTION = `
Built as a local override, not a shared master edit: each state variant wraps a real \`button\` instance (variant=Secondary, size=L) and overrides only its CTA text. Default and Recording reuse \`button\`'s own Default state (no shared 'Recording' state exists yet, this is a text-only override). Loading and Disabled reuse \`button\`'s real Loading and Disabled states directly, so their color, opacity, and spinner are already correctly token-bound. Icon swap (mic / waveform) is NOT wired yet, no real icon component exists for it. When Harry is available, propose folding 'Recording' into \`button\`'s own state axis instead of keeping this as a separate local set.

- States (\`state\` axis): \`Default\`, \`Recording\`, \`Loading\`, \`Disabled\`.
- No other properties beyond the inherited \`button\` instance's own (CTA text, showLeftIcon, showRightIcon), none of which are exposed at this component's own level yet.
- What Default and Recording mean: idle, ready to start (Default) versus actively capturing the student's spoken answer (Recording). Both are visually identical except for the CTA label, since no dedicated 'Recording' state exists on the shared \`button\` master, this is a known gap, not a finished design.
- What Loading and Disabled mean: Loading is the round-trip while the transcript is being judged, reuses \`button\`'s real Loading treatment (spinner, label hidden). Disabled is for when the mic can't be used (e.g. permission denied), reuses \`button\`'s real Disabled treatment.
- What not to do with it: don't add a fifth state without checking whether it belongs on \`button\`'s own shared \`state\` axis instead. Don't treat this component as the icon's home, the icon is still unbuilt and unwired, don't attach a raw vector to make it look finished.

---

Notes from the React build, for anything the Figma description above doesn't cover:
- \`state\` is the only real exposed property (confirmed by instantiating the real component and reading back its \`componentProperties\`) — CTA text is not formally exposed either, even though real usage already overrides it.
- \`ctaText\` is **not** a real exposed Figma property, added here ahead of Figma's own interface: the real component's own placed instance inside \`resultBtm\`'s Silence variant overrides the Default state's text to "Re-record" instead of "Start", proving the real file already needs this override even though it isn't formally exposed. Default text per state (Start/Stop/Analyzing/Start) comes straight from the real component's own bound CTA values.
`;

const meta = {
  title: 'Components/ButtonVoice',
  component: ButtonVoice,
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
    state: { control: 'radio', options: ['Default', 'Recording', 'Loading', 'Disabled'] },
  },
  args: {
    state: 'Default',
  },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--color-background-page)', padding: 'var(--size-space-600)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ButtonVoice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { state: 'Default' },
};

export const Recording: Story = {
  args: { state: 'Recording' },
};

export const Loading: Story = {
  args: { state: 'Loading' },
};

export const Disabled: Story = {
  args: { state: 'Disabled' },
};
