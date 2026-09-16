/**
 * The exam plan screens are exported Figma frames with tap zones (SPEC.md
 * screen 3). Not design-system components: prototype scaffolding.
 *
 * Every box is in points of the 390×788 frame, read off the frame's own
 * layers, and rendered as a fraction of the image. That's image geometry,
 * not design values, so there are no tokens here. Zones smaller than the
 * 48pt tap minimum (space/1200) are grown around their element's centre.
 *
 * The frame is 788pt, not Figma's 844: each export originally baked in its
 * own iOS status bar (Screen's exact problem — see Screen.tsx's
 * `showStatusBar` doc comment — but never fixed here, since these frames
 * render bare, not inside Screen). On the real iPhone that doubled the real
 * status bar, same as Screen's did before 2026-09-14. Fixed the same way:
 * the top 56pt is cropped off every PNG in public/frames/, FrameImage pads
 * that space with env(safe-area-inset-top) instead, and every zone below is
 * shifted up 56pt from its original Figma position to match.
 */

export type FrameId = '00Homescreen' | '01Exam' | '02Hint-animate' | '03VoicerecallON';

export type ZoneId =
  | 'exam-tab'
  | 'show-me'
  | 'voice-recall-toggle'
  | 'node-1'
  | 'node-2'
  | 'facilitator-log';

export interface TapZone {
  id: ZoneId;
  /** Accessible name; the image itself carries the visible label. */
  label: string;
  /** [x, y, width, height] in Figma frame points. */
  box: readonly [number, number, number, number];
  /** Taps needed in quick succession. Defaults to 1. */
  taps?: number;
}

export interface PrototypeFrame {
  id: FrameId;
  figmaNode: string;
  src: string;
  alt: string;
  zones: readonly TapZone[];
}

/** The cropped frame every export is cut from, in points (844 Figma height
 * minus the 56pt status-bar strip removed from each PNG — see the doc
 * comment above). */
export const FRAME_SIZE = { width: 390, height: 788 } as const;

export const FRAMES: Record<FrameId, PrototypeFrame> = {
  '00Homescreen': {
    id: '00Homescreen',
    figmaNode: '13619:3109',
    src: '/frames/00-homescreen.png',
    alt: 'Knowunity home screen. Knowie asks "Study session?", above Scan, Flashcards and Quiz shortcuts, an Ask anything field and the tab bar.',
    zones: [
      // Navigation Button 183,775 40×40, grown to 48, shifted up 56 for the crop.
      { id: 'exam-tab', label: 'Exam. New: voice recall available', box: [179, 715, 48, 48] },
      // Hidden facilitator entry to /log (sprint-context.md, 2026-09-14).
      // Was the top-left corner, over the status bar, where nothing else was
      // tappable — that spot is now the real iOS status bar, not part of
      // this image, so it moved into the blank band below the header row
      // (hamburger/PRO/streak/history icons end by y≈28pt; next content
      // starts past y≈150pt), confirmed empty by sampling the export.
      { id: 'facilitator-log', label: 'Open turn log (facilitator)', box: [0, 40, 64, 48], taps: 3 },
    ],
  },
  '01Exam': {
    id: '01Exam',
    figmaNode: '13548:6324',
    src: '/frames/01-exam.png',
    alt: 'Biology exam plan. A banner reads "Voice recall is ready for Biology. Try say it out loud." with a Show me button, above the Eukaryotic and Prokaryotic Cells section: Organelle Identification and Comparing Cell Types.',
    zones: [
      // "Show me" chips 274,282 85×32, grown to 48 tall, shifted up 56 for the crop.
      { id: 'show-me', label: 'Show me', box: [274, 218, 85, 48] },
    ],
  },
  '02Hint-animate': {
    id: '02Hint-animate',
    figmaNode: '13547:5824',
    src: '/frames/02-hint-animate.png',
    alt: 'The Biology exam plan dimmed, with Knowie below the Voice recall chip at the top, pointing it out.',
    zones: [
      // "Voice recall" chip, 129×40, sat at y=56 (right at the old status
      // bar's bottom edge) so the crop puts its visible top at y≈0. Grown
      // downward instead of centred — there's no room above it any more.
      { id: 'voice-recall-toggle', label: 'Voice recall', box: [119, 0, 129, 48] },
    ],
  },
  '03VoicerecallON': {
    id: '03VoicerecallON',
    figmaNode: '13548:6325',
    src: '/frames/03-voicerecall-on.png',
    alt: 'Biology exam plan with Voice recall on. The Organelle Identification and Comparing Cell Types nodes each show a microphone.',
    zones: [
      // Node circle and its label together (Frame 14, Frame 12), shifted up 56 for the crop.
      { id: 'node-1', label: 'Organelle Identification, voice recall', box: [107, 298, 118, 162] },
      { id: 'node-2', label: 'Comparing Cell Types, voice recall', box: [166, 484, 118, 162] },
    ],
  },
};
