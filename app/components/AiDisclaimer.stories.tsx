import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AiDisclaimer } from './AiDisclaimer';

const FIGMA_DESCRIPTION = `
The responsible-AI overreliance disclaimer: 'AI-generated content may be incorrect. Check it for accuracy.' Bound to Greed/Caption M Regular and text/secondary, not text/tertiary, text/tertiary's own description explicitly rules out anything a student must read, and this is compliance copy, not decorative metadata. Copy is fixed, not exposed as an editable text property, on purpose: this is regulatory-adjacent content and shouldn't vary per instance the way a button's label does. Reach for it anywhere AI-generated or AI-judged content is shown to a student. Don't reword or shorten the copy per screen, don't swap it to a different text style to make it stand out less, that defeats the point of it.

- No variant axis, no other properties. One fixed component, single text layer.
- What not to do: don't expose its copy as an editable property, and don't reach for \`text/tertiary\` for it or anything like it, \`text/tertiary\`'s own description already rules that out.

---

Notes from the React build, for anything the Figma description above doesn't cover:

- **The real copy still doesn't match the quote above.** The description quotes "AI-generated content may be incorrect. Check it for accuracy.", but the component's actual bound text reads **"Knowie is AI and can make mistakes."** This build uses the real bound text, not the description's quote, following the same rule applied to every other component built so far: the live file is the source of truth, the description is notes about it and can drift.
- That real text previously read "Konwie" (a typo for "Knowie", the mascot's name) — confirmed consistent across the master and all 11 real placed instances at the time. Fixed directly in Figma (2026-09-11) rather than silently corrected in code, since this is regulatory-adjacent copy and a wording fix belongs at the source.
- Padding is real and consistent across every instance checked: \`size.space.100\` (4px) on top, \`size.space.800\` (32px) on bottom, none on the sides — bound directly on the component, not incidental to one demo placement.
- Letter-spacing (1%) is skipped, same reasoning as every other text component built so far: tokens.json has no letter-spacing group, and CSS doesn't support \`%\` for it anyway.
- No exposed props at all — matches the real component exactly, which has zero \`componentPropertyDefinitions\`. Nothing pragmatic was added ahead of Figma's interface here, unlike \`mascotSlot\`'s \`expression\` or \`transcriptDisplay\`'s \`transcript\`: this copy is genuinely fixed compliance text, not something that should vary by instance.
`;

const meta = {
  title: 'Components/AiDisclaimer',
  component: AiDisclaimer,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: FIGMA_DESCRIPTION,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--color-background-page)', padding: 'var(--size-space-600)', width: '358px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AiDisclaimer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
