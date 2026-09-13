import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Screen } from './Screen';
import { AiDisclaimer } from './AiDisclaimer';
import { ResultBtm } from './ResultBtm';
import { ButtonVoice } from './ButtonVoice';
import { ProgressIndicator } from './ProgressIndicator';
import { TranscriptDisplay } from './TranscriptDisplay';

const FIGMA_DESCRIPTION = `
**WHAT (the component set's own Figma description, verbatim):** "Used to quickly create screens using our components, making use of Figma Slots. Allows for quickly testing how designs look on different device types."

**The \`size=iPhone 13\` variant's own description, verbatim:** "Default mobile screen size used for most designs."

**The slots' own Figma descriptions, verbatim:**
- \`topNavigation\` — "Placeholder for navigation items, such as back buttons, home top nav with streaks & similar."
- \`bottomContent\` — "Placeholder for bottom navigation bar, chat input field & similar."
- \`middleContent\` and \`bottomSheetOnly\` carry no description in Figma.

**DON'T** (from design-system.md's scaffold entry): don't put arbitrary content directly on the scaffold outside these four slots. Don't put persistent screen content in \`bottomSheetOnly\` — it disappears with the sheet. Don't pull a tablet or MacBook \`size\` into a mobile-iOS screen. The Panel Header's status bar is fixed device chrome, not a slot and not something a screen design touches.

---

Notes from the React build, for anything the Figma description above doesn't cover:

- **The node this was built from was a stale duplicate.** The link given (\`4589-35266\`) is an instance named \`scaffold\` on the Mascot & components page, but its main component is \`Screen/S - Pixel 2\` — 411×731 Android, no variant axis, orphaned off-canvas with \`parent === null\`, one single instance in the whole file. The live component set is \`scaffold\` (\`3085:9242\`), which all 15 example screens use and whose slot names match design-system.md exactly. This is precisely the split design-system.md's last "never" warns about ("never let two definitions of the same component exist, one visible and one actually wired"). **Built from the live set.** The stale \`Screen/S - Pixel 2\` should be deleted at the source — it still carries a \`Show nav scrim\` boolean wired to no layer at all, which is probably where design-system.md's claim of a scrim toggle came from.
- **Named \`Screen\`, where the live Figma set is named \`scaffold\`.** Your call, made after the build. It's the one place this repo's Figma-name-to-PascalCase mapping doesn't hold, and it collides with the stale \`Screen/S - Pixel 2\` copy described above — so until that stale component is deleted, "Screen" means two different things depending on whether you're in Figma or in this codebase.
- **\`size\` ships with one option.** Figma's axis has 8 — iPhone 13, L - 17 Pro Max, XS - iPhone SE, Tablet S - iPad Mini, Tablet S Landscape - iPad Mini, Tablet M Portrait - iPad 13, Tablet M Landscape - iPad 13, MacBook Air 13'. CLAUDE.md is 390px iOS only and design-system.md rules the non-phone sizes out, so by your decision only the default \`iPhone 13\` is exposed. The prop drives nothing visually: Figma's 390×844 frame isn't bound to any token, so the frame fills the viewport (\`width: 100%\`, \`height: 100dvh\`) instead of hardcoding two unbound numbers — the same call BottomSheet, TranscriptDisplay and ProgressIndicator each already made.
- **The status bar renders the time only.** Figma's Status Bar is an iOS device-kit instance (\`Mode=Night\`) holding "09:41" plus wifi, cellular and battery vectors. Its colours are token-bound (\`text/primary\`, \`background/inverse\`) and its 48px height is exactly \`space/1200\`, but the glyph geometry (15×11, 16×11, 24×11 on absolute offsets) and the time's -0.3px tracking have no tokens behind them. By your decision the glyphs are dropped rather than hardcoded. The time's 15px matches \`--font-size-sm\` exactly, rendered with Body S Regular; its 23px offset resolves to \`space/600\` (24px), the nearest real token. It's \`aria-hidden\` — a mock clock isn't content.
- **Real token gap: the Panel Header's bottom hairline.** Figma binds \`Core/Grayscale/Dividers\`, a remote primitive from another library at rgba(255,255,255,0.15) that isn't in tokens.json. By your decision it renders as \`border/default\` (rgba(255,255,255,0.102)) — the semantic token for exactly this role, and design-system.md forbids consuming a primitive directly anyway. The 0.15 → 0.102 drift is the one colour substitution in this build.
- **\`showScrim\` is this build's addition, and the layer isn't what design-system.md says it is.** \`middleContent\` does contain a \`Scrim\` layer, but it's a bottom-anchored linear gradient from transparent to \`background/page\` — a content fade-out. The modal dim is the separate \`Bottom-sheet background\` rectangle, which is the one bound to \`background/scrim\`. design-system.md describes the Scrim as "for dimming this content when a bottom sheet is showing over it", which conflates the two. The layer is also hidden by default and wired to no component property, so it can't be toggled from an instance at all — \`showScrim\` is added here ahead of Figma's interface, the same pattern as MascotSlot's \`expression\` and ButtonVoice's \`ctaText\`. Its 151px height has no token; \`--size-space-4000\` (160px) is the nearest real one, a 9px substitution rather than an invented value.
- **Empty slots collapse.** Every slot carries \`displayEmptyByDefault: false\` in Figma, so it renders nothing when nothing is inserted — even with its boolean on. Matched: \`bottomContent\` with no children would otherwise paint a bare 32px strip of its own \`space/400\` padding, which is exactly the empty-section case BottomSheet already omits. \`middleContent\` still renders when \`showScrim\` is on and it is otherwise empty, so the fade stays reachable.
- **Figma wires \`bottomSheetOnly\`'s visibility to \`showBottomNavSlot\`** — the same boolean as the bottom nav, on both the live set and the stale copy. Not reproduced: the bottom nav is normally hidden while a sheet is up, so honouring that link would hide the sheet exactly when it's needed. The slot renders on having content instead. Worth fixing at the source — it either needs its own boolean or none.
- **The root's \`itemSpacing: 10\` never renders.** The frame is SPACE_BETWEEN with a FILL child (\`middleContent\`), so Figma ignores itemSpacing entirely and the four sections stack flush — 48 + 60 + 702 + 34 = 844 exactly. Not transcribed as a \`gap\`, which would push the layout 30px past the frame; 10 isn't a token either way. Same reasoning as the \`Space/0\` bindings dropped from BottomSheet.
- **\`middleContent\` clips rather than scrolls**, matching Figma's \`clipsContent\` slot. No scroll behaviour is designed there — the same open question transcriptDisplay's Overflow state already flags. Safe here because a screen's actions live in \`bottomContent\`, outside this box, so clipping can't strand a student mid-flow.
- **No landmark elements.** The four slots render as plain \`<div>\`s rather than \`<header>\`/\`<main>\`/\`<footer>\`. Figma defines no semantics, and a docs page renders every story at once — multiple \`<main>\` elements on one page is itself an a11y violation. Whoever mounts a real screen owns its landmarks.
- **\`showBottomSheetBackground\` paints the dim but does not make the screen modal.** It doesn't trap focus, mark the content behind it inert, or handle Esc — exactly the division BottomSheet's docs already describe, where it says "the modality lives in scaffold". It doesn't live here yet either. Whoever mounts a sheet still owns focus trapping and Esc-to-close.
`;

const onContinue = fn();

const meta = {
  title: 'Components/Screen',
  component: Screen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: FIGMA_DESCRIPTION } },
  },
  argTypes: {
    size: { control: 'radio', options: ['iPhone 13'] },
  },
  args: {
    size: 'iPhone 13',
    showTopNavSlot: true,
    showBottomNavSlot: true,
    showBottomSheetBackground: false,
    showScrim: false,
    topNavigation: <ProgressIndicator variant="Primary" thickness="16" progress={50} />,
    middleContent: (
      <TranscriptDisplay
        state="Filled"
        transcript="The mitochondria is the part of the cell that makes energy, it turns glucose into ATP."
      />
    ),
    bottomContent: (
      <>
        <ButtonVoice state="Default" />
        <AiDisclaimer />
      </>
    ),
  },
} satisfies Meta<typeof Screen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IPhone13: Story = {
  name: 'size=iPhone 13',
  play: async ({ canvas }) => {
    // All three always-on slots render their content, and the mock clock is
    // hidden from assistive tech.
    await expect(canvas.getByRole('progressbar')).toBeInTheDocument();
    await expect(canvas.getByText(/mitochondria/i)).toBeVisible();
    await expect(canvas.getByRole('button', { name: /start/i })).toBeVisible();
    // The clock is inside an aria-hidden wrapper, so it never reaches the
    // accessibility tree — assert the ancestor, not the text node itself.
    await expect(canvas.getByText('09:41').closest('[aria-hidden="true"]')).toBeInTheDocument();
  },
};

export const TopNavHidden: Story = {
  name: 'showTopNavSlot=false',
  args: { showTopNavSlot: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('progressbar')).not.toBeInTheDocument();
    await expect(canvas.getByText(/mitochondria/i)).toBeVisible();
  },
};

export const BottomNavHidden: Story = {
  name: 'showBottomNavSlot=false',
  args: { showBottomNavSlot: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: /start/i })).not.toBeInTheDocument();
    await expect(canvas.getByRole('progressbar')).toBeInTheDocument();
  },
};

/**
 * The dim plus the sheet slot together — the recall loop's verdict moment.
 * Note the sheet still shows with the bottom nav hidden, which is the one
 * place this build deliberately departs from Figma's wiring.
 */
export const WithBottomSheet: Story = {
  name: 'showBottomSheetBackground=true',
  args: {
    showBottomSheetBackground: true,
    showBottomNavSlot: false,
    bottomSheetOnly: <ResultBtm variant="Partial" onContinue={onContinue} />,
  },
  play: async ({ canvas }) => {
    onContinue.mockClear();
    const sheet = canvas.getByRole('button', { name: 'Continue' });
    await expect(sheet).toBeVisible();
    await userEvent.click(sheet);
    await expect(onContinue).toHaveBeenCalled();
  },
};

export const WithScrim: Story = {
  name: 'showScrim=true',
  args: {
    showScrim: true,
    middleContent: (
      <TranscriptDisplay state="Overflow" />
    ),
  },
};
