import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TranscriptDisplay } from './TranscriptDisplay';

const FIGMA_DESCRIPTION = `
The live and post-recording transcript surface inside the recall loop's middle content. Shows what Knowie heard, so a wrong answer reads as heard wrong rather than the app being broken. Not a general purpose paragraph container, only for a literal transcript of what the student said. States: Empty (placeholder, dimmed), Filled (real transcript), Overflow (demonstrates clipping past the established 448px box height, no scroll behavior built, that's still an open decision), Silence (recovery copy for when nothing was heard, same dimmed treatment as Empty, replaces the flatter 'No answer recorded' still sitting on the un-migrated Silence03 screen). Text bound to Greed/Headline XS Regular throughout. Empty and Silence differ from Filled/Overflow only by color (text/secondary vs text/primary). Frame width/height (358/448) match the box size already used seven times across the recall screens, not newly invented. Each state's content is fixed per variant, not an exposed override property, an earlier version exposed a shared text property across all three original states and it collapsed their distinct content into one value, don't repeat that.

- States (\`state\` axis): \`Empty\`, \`Filled\`, \`Overflow\`, \`Silence\`.
- What each state means: Empty is before the student has said anything. Filled is a normal transcript. Overflow demonstrates what happens when the transcript is too long for the box (it clips, nothing further is designed for this yet). Silence is the recovery copy shown when the recall loop timed out without hearing anything.
- What not to do with it: don't expose the transcript text as a shared component property across states again, each state needs its own fixed content, a shared property collapses them into one value. Don't reuse this for any paragraph of copy that isn't a literal transcript, that's what \`textBlock\` or plain text is for.

---

Notes from the React build, for anything the Figma description above doesn't cover — and where this build diverges from Figma, with why:

- **\`transcript\` is a real exposed prop for Filled and Overflow, despite the description above saying content is fixed.** That instruction is read here as "don't collapse every state into one shared property" (the real bug it describes), not "the transcript can never vary" — this component's entire purpose is to show the student's actual spoken words, so hardcoding Figma's demo copy ("Mitochondria is a cell.. em.") into the real component would make it unusable. Empty and Silence stay genuinely fixed (real system copy, not student input), matching the description's intent exactly. This is the same kind of pragmatic, ahead-of-Figma addition as MascotSlot's \`expression\` and ButtonVoice's \`ctaText\`.
- **Overflow's clip window is 320px, not the 448px the description claims** — still true after a since-made Figma update added 96px top/bottom padding around it. Live inspection (both before and after that update) found the real component fixed the *visible* window at exactly 320px throughout; 448px has never matched any real bound value found in the file, before or after — it looks like a stale note in the description that the padding update didn't touch either. 320px has no bound Figma variable of its own, but matches \`size.illustration.4000\` exactly (reusing an existing box-size token across categories, same as \`buttonIcon\`'s circle diameter and \`mascotSlot\`'s box sizes did).
- **Overflow now has 96px of padding above and below the clip window** (\`size.space.2400\`, a real bound variable on the updated component — "Space/2400"), making the component's own total height 512px (96 + 320 + 96) where it was previously flush at 320px. Built as an outer padded wrapper around the clipped text, rather than baking padding into the clip window itself, so the visible 320px window stays exactly what it was.
- **Width is fluid (\`100%\`), not a fixed 358px.** 358px isn't bound to any Figma variable either, but it's consistently \`390 − 2 × 16px\` (the mobile width minus two \`size.space.400\` side margins) across every real instance checked — so rather than hardcode a pixel width that only happens to work at exactly 390px, the component fills whatever width its container provides.
- Empty/Filled/Silence have no fixed height in Figma either (\`layoutSizingVertical: HUG\` on every real instance) — they simply wrap to whatever height their own text needs, so this build doesn't hardcode a height for them.
- **Empty and Silence use \`text/tertiary\`, not \`text/secondary\`** — a since-made Figma update (2026-09-11) recolored both from \`text/secondary\` to \`text/tertiary\`, dimming them further. Worth knowing: \`aiDisclaimer\`'s own description explicitly rules \`text/tertiary\` out for "anything a student must read," and Empty/Silence are both instructional copy the student needs to read (what to do next), not decorative metadata — the same category \`text/tertiary\` is meant for. Built to match the real file as instructed; flagging the tension in case it wasn't the intended target of that change.
- Letter-spacing (1%) is skipped, same reasoning as every other text component built so far: tokens.json has no letter-spacing group, and CSS doesn't support \`%\` for it anyway.
`;

const meta = {
  title: 'Components/TranscriptDisplay',
  component: TranscriptDisplay,
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
    state: { control: 'radio', options: ['Empty', 'Filled', 'Overflow', 'Silence'] },
  },
  args: {
    state: 'Empty',
  },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--color-background-page)', padding: 'var(--size-space-600)', width: '358px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TranscriptDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { state: 'Empty' },
};

export const Filled: Story = {
  args: { state: 'Filled' },
};

export const Overflow: Story = {
  args: { state: 'Overflow' },
};

export const Silence: Story = {
  args: { state: 'Silence' },
};
