import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { TextField } from './TextField';

const FIGMA_DESCRIPTION = `
**Figma's \`Text Field\` component set (4517:2132) carries no description** — not on the set, and not on any of its three variants. There is nothing to transcribe, so the guidance below was written during this React build from the component's own structure and defaults, not copied from the file. It should be written into Figma's Description field and this block replaced with it.

**What it's for.** A single-line form field: an optional title above, an optional leading icon, the input, a clear button, and a caption underneath that turns into the error message when the field fails. Figma's own defaults ("E.g., Name", "Tell us more about yourself") point at profile and form entry.

**What not to do with it.**
- Don't use it for the recall answer. That's \`answerInput\`, which grows to four lines, swaps mic for send, and is scoped to answering one prompt. This field is one line.
- Don't rely on the default \`variant\`. Figma's own default is \`Error\`, kept here for parity, so a bare \`<TextField />\` renders as failed.
- Don't use \`Placeholder\` to mean something different from \`Default\`. In Figma it's the same field with nothing typed; here the placeholder text appears whenever the field is empty, whichever of the two you pass.
- Don't hide the title without leaving \`titleText\` meaningful — it becomes the field's accessible name when there's no visible label.

---

Notes from the React build, and where it diverges from Figma, with why. Every divergence below was a decision made on 2026-09-12 after reviewing the file (see \`sprint-context.md\`):

- **Two colour bindings in Figma are stale, so the live tokens are used instead.** Figma's field fill binds an old \`background/input\` that's no longer in the token collections and still renders as 10% white; this build uses the current \`background/input\`. Figma's error stroke and error caption bind \`feedback/error\`, which no longer exists at all (it split into \`bold\`/\`onBold\`/\`subtle\`/\`onSubtle\`). The stroke uses \`border/error\` ("invalid input edge; use for text fields") and the caption \`text/error\` ("the line under a failed field") — the two semantic tokens whose own descriptions name exactly these uses.
- **Typography is mapped onto Greed.** Figma sets everything in Inter Variable with no text style applied: title and input at 14px SemiBold (no 14px exists on the scale), captions at 11px Regular, both with auto line height. Title, input and placeholder use \`Body S Regular\` (15px) — regular rather than Figma's SemiBold, by decision on 2026-09-12; captions use \`Caption S Regular\` (11px, same size). With the clear button showing, the field is Figma's 48px exactly, because the 48px button sets the height either way. The line-height change shows up elsewhere: with the clear button hidden the field is 44px against Figma's 41px, and \`Error\` with its caption is 62px against 63px.
- **The stroke is drawn inside the field, as Figma does**, using an inset shadow rather than a CSS border. A border sits outside the content and made the field 50px.
- **Nested components are this library's own, not the orphaned copies Figma uses.** Figma's leading icon is an \`Icon Slot\` and its clear button a \`Button icon\` (\`Variant=Subtle\`) — both duplicate component sets that sit on no page in the file. This build uses \`iconSlot\` (size \`300\`, 24px) and \`buttonIcon\` (\`Tertiary\`, size \`S\`), which match them structurally: 48px tap target, 32px transparent circle, 16px icon.
- **The clear icon is light, not dark.** Figma's \`x-circle\` is coloured \`interactive/onPrimary\` (dark navy), which reads only because the Figma canvas is white; on the dark field it would all but vanish. \`buttonIcon\` \`Tertiary\` paints \`text/primary\`.
- **The search icon uses \`text/primary\`, not the \`background/inverse\` Figma binds.** Identical colour; that token is a surface fill, not an icon colour.
- **The 1px stroke is unbound in Figma**; \`size.stroke.border\` matches it exactly.
- **Added ahead of Figma**, because a field a person can type into needs them: \`value\`/\`defaultValue\`/\`onChange\`, \`onClear\` for the clear button, and \`caption\` — the \`Default\`/\`Placeholder\` caption is fixed text in Figma and can't be changed from an instance. Same class of call as \`transcriptDisplay\`'s \`transcript\` and \`buttonVoice\`'s \`ctaText\`.
- **A focus state is added.** Figma has none. The field's edge takes \`border/focus\` while focused, except on \`Error\`, which keeps its red edge because that's the only non-text sign the field failed.
- **The field frame is named "Error" in all three Figma variants.** Not reproduced; noted so it can be renamed at the source.
- **Width is fluid.** Figma's 334px is the 390px screen less two \`size.space.700\` margins, not a bound value, so the field fills its container.
`;

const meta = {
  title: 'Components/TextField',
  component: TextField,
  tags: ['autodocs'],
  parameters: {
    // Fullscreen with the screen's own side margins, rather than `centered`,
    // which adds 16px of padding and pushes a full-width field past a 390px
    // viewport — the bug the Keyboard and AnswerInput stories already hit.
    layout: 'fullscreen',
    docs: {
      description: {
        component: FIGMA_DESCRIPTION,
      },
    },
  },
  argTypes: {
    variant: { control: 'radio', options: ['Default', 'Error', 'Placeholder'] },
  },
  args: {
    variant: 'Default',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          boxSizing: 'border-box',
          background: 'var(--color-background-page)',
          width: '100%',
          paddingBlock: 'var(--size-space-600)',
          paddingInline: 'var(--size-space-700)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VariantDefault: Story = {
  name: 'Variant=Default',
  args: { variant: 'Default', defaultValue: 'User input...' },
};

export const VariantError: Story = {
  name: 'Variant=Error',
  args: { variant: 'Error', defaultValue: 'Something long' },
};

export const VariantPlaceholder: Story = {
  name: 'Variant=Placeholder',
  args: { variant: 'Placeholder' },
};

export const ShowTitle: Story = {
  name: 'showTitle=true',
  args: { variant: 'Default', showTitle: true, defaultValue: 'User input...' },
};

export const ShowCaption: Story = {
  name: 'showCaption=true',
  args: { variant: 'Default', showCaption: true, defaultValue: 'User input...' },
};

/** Interaction test: typing, then the clear button empties the field and fires `onClear`. */
export const ClearEmptiesTheField: Story = {
  name: 'Clear empties the field',
  args: { variant: 'Placeholder', onChange: fn(), onClear: fn() },
  play: async ({ args, canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'E.g., Name' });
    await userEvent.type(field, 'Joy');
    await expect(field).toHaveValue('Joy');
    await expect(args.onChange).toHaveBeenLastCalledWith('Joy');

    await userEvent.click(canvas.getByRole('button', { name: 'Clear' }));
    await expect(field).toHaveValue('');
    await expect(args.onClear).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenLastCalledWith('');
  },
};
