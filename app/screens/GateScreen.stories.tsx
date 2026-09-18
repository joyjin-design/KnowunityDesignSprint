import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { GateScreen } from './GateScreen';

const DESCRIPTION = `
**SPEC.md screen 6: the full-screen mic primer.** Figma **13575:1934** ("04bfull-screen gate (built)", the gate alone) and **13555:8294** ("04afull-screen gate (built)", the same gate with its permission sheet open) — both in the first-run section. The sheet is back in the build (decided 2026-09-15, reversing an earlier drop logged 2026-09-14).

**Third state, no frame:** after an earlier denial, the gate's body copy switches to Settings steps and the primary button becomes **I've turned on the mic**. Built to \`Voice-ux.md\`'s default (don't trap the student) and to the mic-off sheet's own placeholder Settings copy, for consistency — both are still pending Open #2 (blocked on the Verification-step-0 spike).

**Components:** \`TextBlock\` (\`variant="L"\`), \`MascotSlot\` (\`size="2XL"\`, \`expression="approving"\` — the frame's own bound Homie swap), \`ButtonGroup\` (\`variant="Vertical"\`, \`size="L"\`) of \`Button\` Primary + Secondary. The permission sheet is \`BottomSheet\` + \`BottomSheetAppBar\` (\`variant="withTitle"\`) + \`ButtonGroup\` (\`variant="Vertical"\`, \`size="L"\`), the same composition screen 5 settled on — its 2026-09-15 padding/alignment fixes apply here too, since they changed the shared components rather than a local override.

**Revised 2026-09-15, second review pass** (you fixed the Secondary/L master and adjusted text size/spacing/button size directly in Figma):
- **\`Button\` Secondary/L's master is now bound to \`interactive/secondary\`,** not \`background/surface\` — the known gap (\`ResultBtm\`'s own Secondary actions, sprint-context.md 2026-09-11; screen 5's Skip button; this screen's own first pass) is fixed at the source for size L. Size S/M's masters are untouched. Changed in \`Button.module.css\` itself (a real default, not a local override), so \`ResultBtm\`'s inline \`SECONDARY_COLOR\` style is now redundant (same value, harmless, not touched here — out of scope for this screen).
- **Both button groups are now \`size="L"\`** — the gate's own bottom buttons included, matching the frame's real bound size (was M).
- **Text sizes now land exactly on real tokens, no substitution:** caption 15px Regular/20 (\`font-greed-body-s-regular\`, was body/M regular's 18/24). Title stepped down twice in review: first to 33px Bold/36 (\`headline-l\`), then to **28px Bold/28** (\`font-greed-headline-m\`, by explicit request) — same title-size change made to \`TypingPlaceholderScreen\`.
- **Both button groups' own gaps are hand-adjusted per instance,** not their master's real Vertical+L default (\`space.200\`, 8px, checked against 4893:5348): the gate's own is 12px (\`space.300\`), the sheet's is 16px (\`space.400\`) — different values, different placed instances.
- Title/caption gap (16px, \`space.400\`) and the mascot's ~41px hand-placed overlap (nearest token \`space.negative.600\`, -24px) are unchanged from the first pass.

**Fixed: the sheet's buttons weren't filling the sheet's width.** \`BottomSheet\`'s own \`.bottomSection\` centers children on the cross axis, so the wrapping \`div\` this screen added around the sheet's \`ButtonGroup\` (purely to scope the 16px gap override above) shrank to content instead of stretching — \`ButtonGroup\`'s own \`width: 100%\` then resolved against that shrunken box instead of the sheet. Fixed by giving the wrapper an explicit \`width: 100%\`, the same way the gate's own button wrapper already avoided this.

**Fixed: the title was flush-left, not centered.** \`textBlock\`'s own \`align-items: flex-start\` left-aligns each child as a block, not just its text. The caption wraps to 3 lines and ends up claiming the full width regardless, masking this — but the shorter title doesn't wrap, so it shrinks to its own text width and sits flush against \`textBlock\`'s left edge. \`.content\`'s \`text-align: center\` didn't reach this, since that only centers text within a box, not the (narrower) box itself. Fixed with a local \`align-items: center\` override on \`textBlock\`.

**Decision: the sheet dims the background.** Figma's own "sheet open" frame has \`showBottomSheetBackground\` set to \`false\` and its scrim layer hidden — but nothing in SPEC.md calls out the permission sheet as an exception to the general "every sheet dims" rule (only the verdict sheet is a documented exception), so this build dims it. Flagging in case that's an authoring gap rather than a deliberate choice, the same kind of slip found in the bottom-sheet app bar's height S variant (sprint-context.md, 2026-09-15).

**Not replicated:** a partial-width "Divider" instance inside the sheet's own app bar — the third time this exact artifact has shown up in an "invented — no system equivalent" mockup/frame (screen 5's build, its reference mockup, and now this frame), reinforcing that it's leftover from Figma's own authoring rather than a deliberate choice.

**Decision: a recheck that's still off shows a notice (resolving Open #5, 2026-09-15).** \`micStillOff\` adds "Still off — check Settings and try again." under the caption, in \`text/error\` — a tap that visibly did nothing read as broken. Owned by whoever wires this screen up (the app clears it on every node open, so a stale notice can't reappear on a later visit); \`GateScreen\` itself just renders it.

**Actions:** **Turn on microphone** → the permission sheet. **Can't talk right now** (every state) → 01Exam. **Allow** → the real iOS prompt. **Don't allow** → closes the sheet, back to the gate. **I've turned on the mic** (after an earlier denial) → checks permission again.
`;

const meta = {
  title: 'Screens/GateScreen',
  component: GateScreen,
  tags: ['autodocs', '!dev'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: DESCRIPTION } },
  },
  args: {
    onTurnOnMicrophone: fn(),
    onCantTalk: fn(),
    onAllow: fn(),
    onDontAllow: fn(),
    onIveTurnedOnMic: fn(),
  },
} satisfies Meta<typeof GateScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstTime: Story = {
  name: 'First time (13575:1934)',
  play: async ({ canvas, canvasElement, args }) => {
    await expect(canvas.getByText("Say it, don't just tap it")).toBeVisible();
    const caption = canvas.getByText(
      "Tap Start and explain it out loud, in your own words. Tap Stop when you're done. Knowie's listening for what you know, not perfect grammar."
    );
    await expect(caption).toBeVisible();
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(canvasElement.querySelector('[class*="bottomSheetBackground"]')).not.toBeInTheDocument();

    // 16px between the title and the body copy.
    const title = canvas.getByText("Say it, don't just tap it");
    const gap = caption.getBoundingClientRect().top - title.getBoundingClientRect().bottom;
    await expect(gap).toBeCloseTo(16, 0);

    // headline/M, 28px/28 — not textBlock's own headline/XL (44px/44).
    await expect(getComputedStyle(title).fontSize).toBe('28px');
    await expect(getComputedStyle(title).lineHeight).toBe('28px');

    // The title is centered, not flush-left. It doesn't wrap (unlike the
    // caption, which claims the full width by wrapping to 3 lines), so
    // without this it shrinks to its own text width and sits flush against
    // textBlock's left edge — the centering regression you caught.
    const textBlock = canvasElement.querySelector('[class*="textBlock"]')!;
    const leftMargin = title.getBoundingClientRect().left - textBlock.getBoundingClientRect().left;
    const rightMargin = textBlock.getBoundingClientRect().right - title.getBoundingClientRect().right;
    await expect(leftMargin).toBeCloseTo(rightMargin, 0);
    // body/S regular, 20px line height — not textBlock's own headline/XS (20px is
    // coincidentally the same as before, but the font-size itself now differs).
    await expect(getComputedStyle(caption).fontSize).toBe('15px');
    await expect(getComputedStyle(caption).lineHeight).toBe('20px');

    // The mascot peeks above the button stack, overlapping its top edge.
    const mascot = canvasElement.querySelector('[class*="mascot"] img')!;
    const buttons = canvasElement.querySelector('[class*="buttons"]')!;
    await expect(mascot.getBoundingClientRect().bottom).toBeGreaterThan(buttons.getBoundingClientRect().top);

    // size L (was M) — matches the frame's real bound button size now.
    const turnOn = canvas.getByRole('button', { name: 'Turn on microphone' });
    const cantTalk = canvas.getByRole('button', { name: "Can't talk right now" });
    await expect(turnOn).toHaveAttribute('data-size', 'L');
    await expect(cantTalk).toHaveAttribute('data-size', 'L');

    // 12px between the two buttons — not ButtonGroup's own real 8px default.
    const buttonGap = cantTalk.getBoundingClientRect().top - turnOn.getBoundingClientRect().bottom;
    await expect(buttonGap).toBeCloseTo(12, 0);

    // Secondary/L's own master fill now, not a local per-instance tint.
    await expect(getComputedStyle(cantTalk).backgroundColor).not.toBe(getComputedStyle(turnOn).backgroundColor);

    await userEvent.click(turnOn);
    await expect(args.onTurnOnMicrophone).toHaveBeenCalledTimes(1);
    await userEvent.click(cantTalk);
    await expect(args.onCantTalk).toHaveBeenCalledTimes(1);
  },
};

export const PermissionSheetOpen: Story = {
  name: 'Permission sheet open (13555:8294)',
  args: { state: 'permissionSheetOpen' },
  play: async ({ canvas, canvasElement, args }) => {
    const dialog = canvas.getByRole('dialog', { name: 'Allow microphone access?' });
    await expect(dialog).toBeVisible();
    await expect(canvas.getByText('Allow microphone access?')).toBeVisible();
    await expect(canvas.getByText('Knowie needs this to hear you explain answers out loud.')).toBeVisible();

    // Dimmed, unlike the verdict sheet — the general sheet rule, applied
    // here even though Figma's own frame has it off (see DESCRIPTION).
    await expect(canvasElement.querySelector('[class*="bottomSheetBackground"]')).toBeVisible();

    // The gate's own buttons stay reachable behind the sheet.
    await expect(canvas.getByText("Say it, don't just tap it")).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Turn on microphone' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: "Can't talk right now" })).toBeVisible();

    // "Don't allow" is tinted (Secondary/L's own fixed master fill now, not
    // a local per-instance override), not left invisible on the sheet's own
    // background.
    const allow = canvas.getByRole('button', { name: 'Allow' });
    const dontAllow = canvas.getByRole('button', { name: "Don't allow" });
    await expect(getComputedStyle(dontAllow).backgroundColor).not.toBe(getComputedStyle(dialog).backgroundColor);

    // 16px between the sheet's two buttons — not ButtonGroup's own real 8px
    // default, and a different hand-adjusted value from the gate's own 12px.
    const sheetButtonGap = dontAllow.getBoundingClientRect().top - allow.getBoundingClientRect().bottom;
    await expect(sheetButtonGap).toBeCloseTo(16, 0);

    // The buttons fill the available width, not just hug their own text —
    // the fill-width regression you caught (the wrapper around this
    // ButtonGroup was shrinking to content instead of stretching, which
    // shrinks the buttons inside it right along with it — comparing a
    // button to its own wrapper can't catch that, since both shrink
    // together). The gate's own button behind the sheet is an independent
    // reference: same 28px padding on both containers, so a correctly
    // filled sheet button should measure the same width.
    const turnOnBehindSheet = canvas.getByRole('button', { name: 'Turn on microphone' });
    await expect(allow.getBoundingClientRect().width).toBeCloseTo(turnOnBehindSheet.getBoundingClientRect().width, 0);
    await expect(dontAllow.getBoundingClientRect().width).toBeCloseTo(turnOnBehindSheet.getBoundingClientRect().width, 0);

    await userEvent.click(allow);
    await expect(args.onAllow).toHaveBeenCalledTimes(1);
    await userEvent.click(dontAllow);
    await expect(args.onDontAllow).toHaveBeenCalledTimes(1);
  },
};

export const AfterAnEarlierDenial: Story = {
  name: 'After an earlier denial (no frame)',
  args: { state: 'afterDenial' },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText("Say it, don't just tap it")).toBeVisible();
    await expect(canvas.getByText('Open Settings, find Voice recall, then turn on Microphone.')).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Turn on microphone' })).not.toBeInTheDocument();

    // No notice before a check has run.
    await expect(canvas.queryByText('Still off — check Settings and try again.')).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: "I've turned on the mic" }));
    await expect(args.onIveTurnedOnMic).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: "Can't talk right now" }));
    await expect(args.onCantTalk).toHaveBeenCalledTimes(1);
  },
};

/** A recheck (I've turned on the mic) came back still off (2026-09-15, resolving Open #5). */
export const StillOffAfterRechecking: Story = {
  name: 'Still off after rechecking',
  args: { state: 'afterDenial', micStillOff: true },
  play: async ({ canvas }) => {
    const notice = canvas.getByText('Still off — check Settings and try again.');
    await expect(notice).toBeVisible();
    // text/error, not the caption's own text/secondary.
    await expect(getComputedStyle(notice).color).not.toBe(
      getComputedStyle(canvas.getByText('Open Settings, find Voice recall, then turn on Microphone.')).color
    );

    // Below the caption, not replacing it.
    const caption = canvas.getByText('Open Settings, find Voice recall, then turn on Microphone.');
    await expect(notice.getBoundingClientRect().top).toBeGreaterThan(caption.getBoundingClientRect().bottom);
  },
};

/** How the app renders it on the test iPhone, under the real status bar. */
export const OnDevice: Story = {
  name: 'showStatusBar=false',
  args: { showStatusBar: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('09:41')).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Turn on microphone' })).toBeVisible();
  },
};
