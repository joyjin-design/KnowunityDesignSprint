import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { TranscriptDisplay } from './TranscriptDisplay';

const FIGMA_DESCRIPTION = `
The live and post-recording transcript surface inside the recall loop's middle content. Shows what Knowie heard, so a wrong answer reads as heard wrong rather than the app being broken. Not a general purpose paragraph container, only for a literal transcript of what the student said. States: Empty (placeholder, dimmed), Filled (real transcript), Overflow (a transcript longer than the box: anchored to the newest text, so older lines clip off the top while the student keeps talking and the latest words stay visible; decided 2026-09-14. Scrolling after send is not built), Silence (recovery copy for when nothing was heard, same dimmed treatment as Empty, replaces the flatter 'No answer recorded' still sitting on the un-migrated Silence03 screen). Text bound to Greed/Headline XS Regular throughout. Empty and Silence differ from Filled/Overflow only by color (text/secondary vs text/primary). Frame width/height (358/448) match the box size already used seven times across the recall screens, not newly invented. Each state's content is fixed per variant, not an exposed override property, an earlier version exposed a shared text property across all three original states and it collapsed their distinct content into one value, don't repeat that.

- States (\`state\` axis): \`Empty\`, \`Filled\`, \`Overflow\`, \`Silence\`.
- What each state means: Empty is before the student has said anything. Filled is a normal transcript. Overflow demonstrates what happens when the transcript is too long for the box (it clips, nothing further is designed for this yet). Silence is the recovery copy shown when the recall loop timed out without hearing anything.
- What not to do with it: don't expose the transcript text as a shared component property across states again, each state needs its own fixed content, a shared property collapses them into one value. Don't reuse this for any paragraph of copy that isn't a literal transcript, that's what \`textBlock\` or plain text is for.

---

Notes from the React build, for anything the Figma description above doesn't cover — and where this build diverges from Figma, with why:

- **\`transcript\` is a real exposed prop for Filled and Overflow, despite the description above saying content is fixed.** That instruction is read here as "don't collapse every state into one shared property" (the real bug it describes), not "the transcript can never vary" — this component's entire purpose is to show the student's actual spoken words, so hardcoding Figma's demo copy ("Mitochondria is a cell.. em.") into the real component would make it unusable. Empty and Silence stay genuinely fixed (real system copy, not student input), matching the description's intent exactly. This is the same kind of pragmatic, ahead-of-Figma addition as MascotSlot's \`expression\` and ButtonVoice's \`ctaText\`.
- **Text style is \`Greed/Body S Regular\` (15/20px) in every state**, changed in Figma on 2026-09-15. The description above still says Headline XS Regular, and its text/secondary for Empty and Silence is also stale: both are text/tertiary.
- **Overflow's clip window is 320px** (\`size.illustration.4000\`, reused across categories like \`buttonIcon\`'s circle diameter). 320px has no bound Figma variable of its own.
- **Padding, updated 2026-09-15 to match Figma:** every state has 24px on top (\`Space/600\`; it was \`Space/800\` earlier the same day) and 12px on the left (\`Space/300\`), so the text is 12px narrower than the component. Overflow keeps 96px (\`Space/2400\`) below its window, so it measures 440px in total (24 + 320 + 96). Not matched: Figma's Overflow is now top-aligned (\`primaryAxisAlignItems: MIN\`), which would clip the newest words; the build keeps them anchored to the bottom, as decided. Overflow's padding sits on an outer wrapper, so the visible window stays exactly 320px.
- **Overflow shows the newest words and fades the oldest out** (2026-09-15). The text is anchored to the bottom of the window, so while the student keeps talking the latest words stay visible and older lines move up and clip off the top. The top 48px (\`space.1200\`, about two lines) fades from transparent, so lines leave gradually rather than being cut. The fade is a mask, so it works over any background. Figma draws no fade.
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

// At Body S, Figma's own Overflow demo copy (the component default) is shorter
// than the 320px window, so this story passes a longer answer to show the
// newest-words anchoring and the fade.
const LONG_ANSWER =
  "Mitochondria is the powerhouse of the cell, it converts glucose and oxygen into ATP through cellular respiration, which the cell then uses as energy for basically everything it does, like moving stuff around and building proteins and dividing. It also has its own DNA separate from the nucleus, which is one of the reasons scientists think it used to be a free living bacteria that got absorbed by a bigger cell a really long time ago, and the two of them just started working together instead of one eating the other, that's the endosymbiotic theory. Every cell has a different number of them depending on how much energy that part of the body needs, so muscle cells and heart cells have way more than something like a skin cell. And the folds on the inside, the cristae, give it way more surface area so it can make more ATP at once, which is why the inner membrane is all folded up like that. Oh and if you exercise a lot your muscle cells can actually build more mitochondria over time.";

export const Overflow: Story = {
  args: { state: 'Overflow', transcript: LONG_ANSWER },
  play: async ({ canvasElement }) => {
    const text = canvasElement.querySelector<HTMLElement>('p[data-state="Overflow"]');
    await expect(text).not.toBeNull();
    const window = text!.getBoundingClientRect();
    // The newest words (the end of the text) sit at the bottom of the window.
    const range = document.createRange();
    range.selectNodeContents(text!);
    const lines = range.getClientRects();
    const end = lines[lines.length - 1];
    await expect(end.bottom).toBeLessThanOrEqual(window.bottom + 1);
    await expect(window.bottom - end.bottom).toBeLessThan(parseFloat(getComputedStyle(text!).lineHeight));
    // And the text really is longer than the window: the oldest lines start
    // above it and clip off the top.
    await expect(lines[0].top).toBeLessThan(window.top);
  },
};

export const Silence: Story = {
  args: { state: 'Silence' },
};
