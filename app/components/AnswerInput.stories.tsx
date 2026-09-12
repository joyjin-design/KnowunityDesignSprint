import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent } from 'storybook/test';
import { AnswerInput } from './AnswerInput';
import { Keyboard } from './Keyboard';

const FIGMA_DESCRIPTION = `
**There is no Figma source for this component.** An earlier version of this note said the Figma file contains no text field at all; that was wrong — a \`Text Field\` component set exists (4517:2132) and wasn't found by the sweep this build relied on. This bar is still not built from it, so unlike every other entry in this library, none of the text below is transcribed from a Figma description; it was written during this React build, and the component's shape comes from \`reference/AskforQuiz.png\` and the typing screenshot of the shipped beta instead. **Figma is not the source of truth for this one yet** — it should be designed there and this build reconciled against it.

**What it's for.** The typed-answer bar for the recall loop's text fallback: the surface a student lands on after "Try typing instead" or "Can't talk right now". Voice stays the primary affordance; this is the non-voice path that \`Voice-ux.md\` marks **Must** and "non-negotiable", framed as accessibility rather than a lesser option.

**What not to do with it.**
- Don't use it as a general chat composer or a form field. It's scoped to answering one recall prompt; for a single-line form field use \`textField\`.
- Don't remove the mic control. It's the way back to voice for a student who tapped into typing by mistake, and \`CLAUDE.md\`'s "every required action has a way out" applies to the modality too.
- Don't let it send an empty answer — sending silence is the exact thing the Silence sheet exists to recover from.

---

Notes from the React build:

- **The \`state\` axis is defined here first, ahead of Figma.** It uses \`state\` rather than \`variant\` because that's the axis \`transcriptDisplay\` already uses for the same kind of surface, per \`design-system.md\`'s "reuse an existing variant vocabulary before inventing a new one". Values: \`Empty\`, \`Filled\`, \`Focused\`, \`Error\`, \`Disabled\`. This is the same kind of ahead-of-Figma call as \`mascotSlot\`'s \`expression\` and \`buttonVoice\`'s \`ctaText\` — expect to reconcile it once the component exists in the file.
- \`Focused\` is presentational only, for documenting the state in isolation; real focus is still the browser's.
- **Two deliberate omissions from the reference bar.** The shipped composer has a \`+\` button outside the pill and a camera inside it. Both are dropped here: attaching a photo isn't an answer to a spoken-recall prompt, and a button that does nothing in this context is worse than no button. Easy to add back if you want exact visual parity with the composer.
- **The trailing control swaps rather than stacking.** Empty rests on the mic; once there's text, send takes that slot. Two trailing buttons crowd the text in a pill this size, and by the time something is typed, sending is unambiguously the next action.
- **Every value is token-bound.** The pill takes \`background/input\`, whose own description names this exact use ("fill of an editable field; use for text inputs, textareas, search fields at rest") and which nothing else in the library had claimed yet. The placeholder takes \`text/disabled\`, whose description likewise names "placeholder text in empty input fields" — not \`text/tertiary\`.
- **The field grows one line at a time up to four lines of Body M, then scrolls**, so a spoken-length answer fits without the bar swallowing the screen, and it shrinks back as text is deleted. The cap is \`calc(4 * var(--font-line-height-md))\` rather than a pixel height. Growth is measured from \`scrollHeight\` in a layout effect rather than CSS \`field-sizing: content\`, which would be one line but isn't supported in Safari — and this is an iOS prototype. Locked in by the **Typing grows to four lines** story's interaction test.
- **The pill's radius is \`radius/900\` (36px), not \`radius/full\`.** At one line the field is 66px tall, so 36px already exceeds half its height and renders as the identical pill (verified pixel-for-pixel). \`full\` only differs once the field grows: at four lines it turned both ends into semicircles that ran into the first and last lines of text.
- **Works controlled or uncontrolled.** Pass \`value\` + \`onChange\` to own the text, or pass neither and the field keeps its own draft. Either way the mic/send swap follows what's actually in the field — an earlier build read only the \`value\` prop, so anyone typing into an uncontrolled field never got a send button.
- Reuses \`buttonIcon\` for both trailing controls rather than hand-rolling a round button — \`design-system.md\`'s first rule for a new component, and the reason \`buttonVoice\` exists.
`;

const meta = {
  title: 'Components/AnswerInput',
  component: AnswerInput,
  tags: ['autodocs'],
  parameters: {
    // Fullscreen for the same reason as Keyboard's stories: `centered` adds
    // 16px of padding, which pushed a 390px-wide bar past a 390px viewport.
    layout: 'fullscreen',
    docs: {
      description: {
        component: FIGMA_DESCRIPTION,
      },
    },
  },
  argTypes: {
    state: { control: 'radio', options: ['Empty', 'Filled', 'Focused', 'Error', 'Disabled'] },
  },
  args: {
    state: 'Empty',
  },
} satisfies Meta<typeof AnswerInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// Per-story rather than on `meta`: Storybook wraps story decorators inside
// meta ones, so a padded meta wrapper also padded the full-height typing
// screen below and pushed its keyboard 16px past the bottom edge.
const onPage: Story['decorators'] = [
  (Story) => (
    <div style={{ background: 'var(--color-background-page)', width: '100%', paddingBlock: 'var(--size-space-400)' }}>
      <Story />
    </div>
  ),
];

export const Empty: Story = {
  args: { state: 'Empty' },
  decorators: onPage,
};

export const Filled: Story = {
  args: { state: 'Filled', value: 'Mitochondria makes energy for the cell' },
  decorators: onPage,
};

export const Focused: Story = {
  args: { state: 'Focused', value: 'Mitochondria' },
  decorators: onPage,
};

export const Error: Story = {
  args: {
    state: 'Error',
    value: 'Mitochondria',
    hint: "That didn't send. Check your connection and try again.",
  },
  decorators: onPage,
};

export const Disabled: Story = {
  args: { state: 'Disabled' },
  decorators: onPage,
};

/**
 * Interaction test for two bugs found during the build: the field used to stay
 * one line tall no matter how much was typed, and send never appeared unless
 * a `value` prop was passed in. Types into an uncontrolled field, the way a
 * person trying the prototype would.
 */
export const TypingGrowsToFourLines: Story = {
  name: 'Typing grows to four lines',
  args: { state: 'Empty' },
  decorators: onPage,
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Your answer' }) as HTMLTextAreaElement;
    const lineHeight = parseFloat(getComputedStyle(field).lineHeight);

    await expect(canvas.getByRole('button', { name: 'Answer with voice instead' })).toBeInTheDocument();

    await userEvent.type(field, 'Line 1');
    await expect(canvas.getByRole('button', { name: 'Send answer' })).toBeInTheDocument();
    await expect(field.clientHeight).toBe(lineHeight);

    await userEvent.type(field, '{Enter}Line 2{Enter}Line 3');
    await expect(field.clientHeight).toBe(3 * lineHeight);

    await userEvent.type(field, '{Enter}Line 4{Enter}Line 5{Enter}Line 6');
    await expect(field.clientHeight).toBe(4 * lineHeight);
    await expect(field.scrollHeight).toBeGreaterThan(field.clientHeight);

    await userEvent.clear(field);
    await expect(field.clientHeight).toBe(lineHeight);
    await expect(canvas.getByRole('button', { name: 'Answer with voice instead' })).toBeInTheDocument();
  },
};

/** The whole text-fallback screen: the answer bar resting on the keyboard. */
export const OnTheTypingScreen: Story = {
  name: 'On the typing screen',
  args: { state: 'Empty' },
  decorators: [
    (Story) => (
      <div
        style={{
          background: 'var(--color-background-page)',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          // The keyboard rests on the bottom edge of the screen, like the real
          // one — full viewport height, as Screen's stories use.
          minHeight: '100dvh',
        }}
      >
        <Story />
        <Keyboard type="Default" />
      </div>
    ),
  ],
};
