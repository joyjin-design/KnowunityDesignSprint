import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BottomSheetAppBar } from './BottomSheetAppBar';

const FIGMA_DESCRIPTION = `
**WHAT:** The top of a \`bottomSheet\` — an always-present grab handle plus, depending on variant, a centred title/caption and up to two 48px icon buttons. variant=Default is handle-only.

**WHEN TO USE:** Always inside \`bottomSheet\`, never on its own. Prefer Default: the file's own placed instance carries the note "Let's avoid titles & buttons up top" / "Let's avoid captions whenever possible". Reach for withTitle / dismissOnly / dismissAndAction only when the sheet genuinely can't be understood or dismissed without them.

**DON'T:** Don't rely on the icon buttons showing a real glyph — their iconSlot is still the unassigned \`square\` placeholder. Don't reach for this as a screen-level top nav; that's \`appBar\`.

---

Notes from the React build, for anything the Figma description above doesn't cover:
- **This description didn't exist.** The Figma set carried an empty description, as did all four of its variants. The text above was written during this build and pushed back into the component set's Description field in Figma, per design-system.md's own rule ("write the finished description directly into the Description field, not just in chat").
- **Reused \`ButtonIcon\` for both icon buttons** rather than building a new one. Figma's \`App Bar Button Icon\` is a separate component set, but it resolves to exactly what \`ButtonIcon\` variant=Tertiary size=M already renders: a 48px tap target (\`size.space.1200\`) wrapping a transparent 40px \`radius/Full\` circle (\`size.illustration.500\`), no bezel nudge. Its \`state\` axis (Default/Pressed/Disabled/Loading) also maps 1:1 onto \`ButtonIcon\`'s existing model — Pressed is CSS \`:active\`, Disabled and Loading are real props — the same convention \`Button\` established.
- One deviation from that reuse: Figma's iconSlot frame is 24px with a 20px glyph inside it; \`ButtonIcon\` size=M sizes its icon box at 20px (\`size.icon.250\`). The painted glyph is 20px either way, so this only changes the invisible box around it.
- **The icons are not real.** All four variants point at iconSlot's unassigned \`square\` placeholder — there's no dismiss/close glyph anywhere in the set. \`dismissIcon\`/\`actionIcon\` are therefore props, and omitting them renders that same square placeholder rather than inventing an X. Flagged as an open gap, same treatment as \`buttonVoice\`'s unwired mic icon.
- **Axis name:** Figma originally called this axis \`Type\`, which broke design-system.md's own rule that the three standard axes are \`variant\`, \`size\` and \`state\`. It was renamed to \`variant\` in Figma during this build (all four variants now read \`variant=…\`, and every nested instance followed automatically), so the source and this component agree.
- **The file's own copy argues against using most of these variants.** The single placed \`bottomSheet\` instance sets this app bar to dismissAndAction purely to carry the text "Let's avoid titles & buttons up top" and "Let's avoid captions whenever possible" — a note to the reader rather than real content. Treat Default as the intended default and the other three as exceptions.
- **Inline padding shifts per Type, and that's deliberate:** 16px (\`space.400\`) on an edge that holds text, 4px (\`space.100\`) on an edge that holds a 48px icon button, so the glyph still optically lines up with the 16px content margin. Default is the exception at 12px on both sides, unbound to any variable — invisible, since Default renders no content.
- **Handle reconciled with \`resultBtm\`.** Geometry was already identical to the handle built there (32×4, centred, \`space.150\` from the top, ABSOLUTE), but this set bound its fill to \`background/floating\` — \`#3d3d3d\` at 60%, which composites to roughly \`#323337\` on \`background/surface\` and is nearly invisible — where resultBtm uses \`background/stacking\` (white at 10.2%, roughly \`#393a44\`, clearly legible). By your decision the fill was changed to \`background/stacking\` **in Figma** across all four variants, and its 2px radius bound to \`Stroke/Heavy Border\` where it had been an unbound raw \`2\`. The two sheets now agree.
- The header's background is a \`background/surface\` → transparent gradient so content can scroll under it. Figma stacks two identical copies of that gradient, which looks accidental — built as one. It's invisible either way while the sheet's own background is also \`background/surface\`.
- The app bar's own vertical gap isn't reproduced: the handle is \`layoutPositioning: ABSOLUTE\`, leaving a single flow child for the gap to act on.
`;

const meta = {
  title: 'Components/BottomSheetAppBar',
  component: BottomSheetAppBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: FIGMA_DESCRIPTION } },
  },
  argTypes: {
    variant: { control: 'radio', options: ['Default', 'withTitle', 'dismissOnly', 'dismissAndAction'] },
    showCaption: { control: 'boolean' },
  },
  args: {
    variant: 'Default',
    title: 'Title',
    caption: 'Sub-title (optional)',
    showCaption: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '390px', background: 'var(--color-background-surface)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BottomSheetAppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'variant=Default',
  args: { variant: 'Default' },
};

export const WithTitle: Story = {
  name: 'variant=withTitle',
  args: { variant: 'withTitle' },
};

export const DismissOnly: Story = {
  name: 'variant=dismissOnly',
  args: { variant: 'dismissOnly' },
};

export const DismissAndAction: Story = {
  name: 'variant=dismissAndAction',
  args: { variant: 'dismissAndAction' },
};

export const WithCaption: Story = {
  name: 'showCaption=true',
  args: { variant: 'withTitle', showCaption: true, caption: 'Pick one to keep going' },
};
