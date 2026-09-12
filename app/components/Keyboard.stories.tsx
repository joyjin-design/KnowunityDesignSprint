import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Keyboard } from './Keyboard';

const FIGMA_DESCRIPTION = `
**Figma's \`Keyboard\` component set (3086:16936) carries no description** — not on the set, and not on any of its four variants. There is nothing to transcribe here, so everything below was written during this React build rather than copied from the file. Treat it as this build's own documentation, not as the source of truth the other components' docs are.

**What it's for.** Prototype screens only. It is a picture of the iOS keyboard, used so a typing screen composes at the right height and reads as a real phone. On a device, iOS draws the real keyboard the moment a field takes focus — this never ships, and it is not part of the design system.

**What not to do with it.**
- Don't treat it as an input. Every key is an inert \`<span>\`, the whole thing is \`aria-hidden\`, and nothing is focusable or clickable. Typing happens in \`answerInput\` or \`textField\`.
- **Don't copy values out of \`Keyboard.module.css\`.** They are Apple's, quarantined there on purpose, and the file says so at the top. Every colour and size in it was transcribed from Figma's copy of Apple's kit, whose own variables resolve to remote collections named "Kit" and "Colors" (\`Liquid Glass/*\`, \`Labels - Vibrant/Primary\`, \`Miscellaneous/Keyboards/Glyphs - Primary\`). **None of them is a Yummy-Knowie token and none exists in tokens.json.** Never promote one into the token file — that would import Apple's palette into a design system that deliberately doesn't contain it.
- Don't reach for it in any real product surface. For the recall answer use \`answerInput\`; for a single-line form field use \`textField\`.

---

Notes from the React build, and where it diverges from Figma, with why:

- **This is the one component in the library whose variant axis isn't \`variant\`/\`size\`/\`state\`.** The prop is \`type\`, with Figma's own four options (\`Default\`, \`Search\`, \`Numbers\`, \`Emoji\`), because the axis belongs to Apple's kit rather than to this design system — renaming it would break the mapping back to the file. \`design-system.md\`'s "don't invent a fourth axis name" rule is about components this system owns; this isn't one.
- **Built as DOM, not as an exported asset.** Exporting the four variants as SVG was tried first, since that would have introduced no raw values at all (the same route \`public/images/\` already takes for the mascot). It failed: exporting all four times out even at 30s, because the Emoji variant is ~420px of emoji glyphs. A single \`Default\` SVG exports fine at 56KB, so if you only ever need that one variant, the asset route is still open and is strictly cleaner than this file.
- **Several details follow the real app screenshot rather than Figma's Apple kit**, which is a generic iOS keyboard and doesn't match what Knowunity actually renders: letters are uppercase (Figma shows lowercase); the bottom row has four keys — \`123\` · emoji · space · send — where Figma's has three; the blue key is a send arrow, not a return glyph; and the accessory row below carries the globe, not a second smiley, because the smiley has moved up into the bottom row. Suggestions read \`I · The · I'm\`, also from the real screen.
- **\`123\` on Default, \`ABC\` on Numbers — a deliberate divergence.** Figma's Default variant shows \`ABC\` on a letters keyboard, which is wrong on any real device and would read as a bug in a prototype. Transcribed as the correct label instead, and flagged here.
- **Geometry is proportional, not fixed.** Figma's artboard is 396px (Emoji 420px) against this project's 390px screen, so key widths are percentages of the row rather than the transcribed pixel widths. Row heights, gaps and radii are Figma's real numbers.
- **The autocorrection bar shows on Default and Search only.** Figma's Numbers variant is 318px to Default's 342px — exactly that row plus the padding under it — so its absence there is the file's own decision, not a simplification.
- **Key fill may read slightly darker than the screenshot.** \`rgba(153, 153, 153, 0.15)\` is the real transcribed value from Figma; the shipped app's keys look a little lighter. Kept Figma's number rather than eyeballing a new one off a screenshot, since that would be inventing a value.
- The SF Symbols glyphs Figma uses for shift, delete and return (\`􀆝\`, \`􁂈\`, \`􀅇\`) are private-use characters that only render with SF Pro on Apple platforms. Redrawn as inline SVG paths so they survive off-platform.
`;

const meta = {
  title: 'Components/Keyboard',
  component: Keyboard,
  tags: ['autodocs'],
  parameters: {
    // Fullscreen, not centered: the preview defaults to the 390px `mobile390`
    // viewport, and `centered` pads every story by 16px — so a 390px keyboard
    // inside it measured 422px and ran 16px off the right edge. Same call as
    // Screen's stories.
    layout: 'fullscreen',
    docs: {
      description: {
        component: FIGMA_DESCRIPTION,
      },
    },
  },
  argTypes: {
    type: { control: 'radio', options: ['Default', 'Search', 'Numbers', 'Emoji'] },
  },
  args: {
    type: 'Default',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          background: 'var(--color-background-page)',
          width: '100%',
          // Always flush to the bottom edge, the only place iOS ever draws a
          // keyboard: full viewport height, content pushed to the end. `dvh`
          // rather than `vh` so it tracks the visible viewport on a phone.
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Keyboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TypeDefault: Story = {
  name: 'Type=Default',
  args: { type: 'Default' },
};

export const TypeSearch: Story = {
  name: 'Type=Search',
  args: { type: 'Search' },
  parameters: {
    a11y: {
      config: {
        // Suppressed here and nowhere else. This variant is the only one whose
        // blue key carries a word rather than a glyph: "search" in white on
        // Apple's #0091ff measures ~3.2:1 against the 4.5:1 needed at 18px
        // regular. Left as-is on purpose — the real iOS keyboard has exactly
        // this contrast, this surface is aria-hidden and never ships, and
        // recolouring it would invent a value that is neither Apple's nor
        // this design system's. Reviewed and accepted 2026-09-12; see
        // sprint-context.md. Do not widen this to the other three variants —
        // they pass, and should keep having to.
        rules: [{ id: 'color-contrast', enabled: false }],
      },
    },
  },
};

export const TypeNumbers: Story = {
  name: 'Type=Numbers',
  args: { type: 'Numbers' },
};

export const TypeEmoji: Story = {
  name: 'Type=Emoji',
  args: { type: 'Emoji' },
};
