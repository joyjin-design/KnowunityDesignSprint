import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ResultBtm } from './ResultBtm';

const FIGMA_DESCRIPTION = `
The result sheet shown after a student answers: Success, Partial, Error, or Silence (nothing was heard). Variant axis reused from the same Success/Error vocabulary already established on \`snackbar\`, extended with Partial and Silence. Success and Error backgrounds/titles bind to \`feedback/success\` and \`feedback/error\` tokens. Partial has no dedicated feedback token in this file, its background and title currently reuse \`accent/blue\` as a stand-in (this was already in place before this build, not invented here). Silence reuses \`feedback/error\` for its title and icon, no dedicated 'neutral recovery' token exists either, same kind of stand-in as Partial.

- States (\`variant\` axis): \`Success\`, \`Partial\`, \`Error\`, \`Silence\`.
- What each state means: Success is a fully correct recall, Error is a fully incorrect one, Partial is a partial-credit recall, Silence is the recovery sheet for when nothing was heard at all. All four carry a header icon, title, thumbs up/down feedback control, and a two-button CTA row.
- What not to do with it: don't add a third button to the CTA row inside \`buttonGroup\`, \`buttonGroup\` is capped at two slots by design. Don't invent a color or icon for Partial, flag the gap instead. Don't reach for a generic \`button\` where the action is actually voice input, reuse \`buttonVoice\` the way Silence does.

---

Notes from the React build, for anything the Figma description above doesn't cover — and where this build **diverges from the current Figma file**, with why:

- **The CTA row is built from real \`button\`/\`buttonGroup\` instances in all four variants, not just Silence.** Live inspection of the file found the "every variant's action buttons are real component instances, not hand-drawn" claim above is only true for Silence — Error, Partial, and Success each hand-draw a pill frame that mimics \`button\`'s anatomy without being wired to it. Those hand-drawn frames also don't match the real \`button\` component's own colors (\`interactive/secondary\`+\`interactive/onSecondary\` here vs. \`background/surface\`+\`text/primary\` on the real component), and Error's version uses a font — "Greed VF-TRIAL" Condensed Heavy at 24px — that has no matching token anywhere in tokens.json. Per design-system.md's own rule ("never let two definitions of the same component exist, one visible and one wired — reattach the real one, don't document both as valid") and by your explicit choice, this build reattaches the real \`button\`/\`buttonGroup\` components instead of reproducing the stale hand-drawn state.
- **The action button's color (feedback/error/success/bold or accent/blue/bold per variant) is a local override on top of \`button\`'s real Primary look**, the same pattern already established for \`buttonVoice\` — not a new formal Button variant, since none of \`button\`'s own real variants (Primary/Secondary/Tertiary) carry these colors.
- **The header "Descriptor" subtitle is dropped.** It exists as a text layer in all four variants' headers, but is always literally the placeholder "Sub-title (optional)" — confirmed never given real content in any of the 3 real placed instances checked, or in any of the 4 component definitions. design-system.md's own description never mentions a subtitle either.
- **Silence's separate supporting text is kept, as fixed copy.** This is a *different* text layer from the header Descriptor above — its own frame, with real content ("No worries, this one doesn't count against you.") that only exists on Silence. Treated as fixed per-variant content, not an exposed prop, the same way \`transcriptDisplay\`'s per-state content is fixed.
- **Silence's title reads "Didn't catch it", not Figma's "Didn't catch that"** (2026-09-14). After the font family moved from Greed to Inter, the full title measured 226px against its 222px one-line box and ended in an ellipsis. Shortening the copy was chosen over letting titles wrap, tightening the header gap, or dropping to a smaller title style. Figma's copy should be updated to match.
- **\`buttonGroup\` and \`buttonVoice\` were built as prerequisites** — neither existed as a React component yet, despite being real, already-described components in design-system.md. See their own Storybook docs.
- The drag handle is real \`layoutPositioning: ABSOLUTE\`, centered independent of its position in the layer list — the file has it ordered inconsistently (before vs. after the top nav row) across variants, but since it's absolutely positioned that has no effect on the rendered result.
- Thumbs up/down have no design for an active/selected state anywhere in the file — built as plain icon buttons with callbacks, no toggled visual state. Flagged as an open gap, the same way \`badge\`'s missing VoiceOver label was flagged rather than invented.
- The drag handle's 2px corner radius is bound to a variable literally named "Stroke/Heavy Border" (\`size.stroke.heavy-border\`) in the real file, not a radius token — a real, if oddly-named, bound value, reproduced as-is rather than substituted with a same-numbered radius token that isn't what's actually bound.
- Background tinting is more asymmetric than the Figma description states: Success tints (\`feedback/success/subtle\`) **and Partial tints** (\`accent/blue/subtle\`, not called out above) — only Error (and Silence) stay neutral (\`background/surface\`).
`;

const meta = {
  title: 'Components/ResultBtm',
  component: ResultBtm,
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
    variant: { control: 'radio', options: ['Success', 'Partial', 'Error', 'Silence'] },
  },
  args: {
    variant: 'Error',
  },
  // A verdict sheet rises from the bottom edge — in real use scaffold's
  // bottomSheetOnly slot pins it there. This wrapper stands in for that slot
  // so the sheet is previewed where it actually sits, rather than floating at
  // the top of the canvas. Same wrapper BottomSheet's stories already use.
  decorators: [
    (Story) => (
      <div
        style={{
          width: '390px',
          // 100dvh, not a hardcoded 844: that only lined up with the bottom
          // of the viewport because the configured mobile390 viewport is also
          // 844 tall. This tracks the real viewport, so the sheet stays
          // bottom-flush at any window size. Same call Screen.module.css makes.
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          background: 'var(--color-background-page)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResultBtm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: { variant: 'Success' },
};

export const Partial: Story = {
  args: { variant: 'Partial' },
};

export const Error: Story = {
  args: { variant: 'Error' },
};

export const Silence: Story = {
  args: { variant: 'Silence' },
};
