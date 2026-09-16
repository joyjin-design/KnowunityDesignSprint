'use client';

import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { Button } from './Button';

export type ButtonVoiceState = 'Default' | 'Recording' | 'Loading' | 'Disabled';

const DEFAULT_CTA: Record<ButtonVoiceState, string> = {
  Default: 'Start',
  Recording: 'Stop',
  Loading: 'Analyzing',
  Disabled: 'Start',
};

/**
 * Default and Recording's real color (2026-09-16, your report — corrected
 * same day: the fix first only covered Recording, but 05Starting's own
 * placed instance turned out to carry the identical override, so Default
 * needs it too). `buttonVoice`'s own component set still binds both its
 * Default and Recording variants (Figma 13562:3327/13562:3328) to
 * `interactive/secondary` — but the actual placed instances (05Starting,
 * 07KeepTalking, 08Talking-finished) all carry a local instance override to
 * `background/inverse` / `text/inverse` instead, which is the real intended
 * look, just not yet propagated back into the component set. Loading and
 * Disabled are unaffected — confirmed against the component set's own
 * master, both still bind `background/surface`, matching this file's
 * existing note that those two reuse `button`'s real treatment directly. A
 * local override here (not a `Button.module.css` change) matches how this
 * component already works — "a local override, not a shared master edit"
 * (design-system.md). Inline `style`, not a CSS class, so it wins over
 * `Button.module.css`'s own `[data-variant='Secondary'][data-size='L']`
 * background rule without a specificity fight. */
const INVERSE_STYLE: CSSProperties = {
  background: 'var(--color-background-inverse)',
  color: 'var(--color-text-inverse)',
};

export interface ButtonVoiceProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  state?: ButtonVoiceState;
  /**
   * Not a real exposed Figma property (see Storybook docs) — the real
   * component overrides this CTA text per-instance (e.g. "Re-record") even
   * though it isn't formally exposed, so it's added here ahead of Figma's
   * own interface rather than locked to the state's own default text.
   */
  ctaText?: string;
  /**
   * Passed through to the wrapped `button`'s left icon (Figma's
   * `showLeftIcon`): Phosphor Microphone at Default, Waveform while
   * recording. Should paint with currentColor. Approved in SPEC.md.
   */
  leftIcon?: ReactNode;
}

/**
 * Figma `buttonVoice` component set (state: Default/Recording/Loading/
 * Disabled). The primary voice input control (Start/Stop) in the recall
 * loop — see the component's Storybook docs for the full brief.
 */
export const ButtonVoice = forwardRef<HTMLButtonElement, ButtonVoiceProps>(function ButtonVoice(
  { state = 'Default', disabled, ctaText, leftIcon, style, ...rest },
  ref
) {
  const inverse = state === 'Default' || state === 'Recording';
  // `disabled` is a plain HTML attribute already (ButtonVoiceProps extends
  // ButtonHTMLAttributes), independent of `state` — LoopScreen.tsx uses this
  // to freeze Recording's look through Processing (2026-09-16, your call)
  // rather than switching to a fifth, Figma-less "Recording, but disabled"
  // state value.
  const isDisabled = disabled ?? state === 'Disabled';
  return (
    <Button
      ref={ref}
      variant="Secondary"
      size="L"
      leftIcon={leftIcon}
      loading={state === 'Loading'}
      disabled={isDisabled}
      style={
        inverse
          ? {
              ...INVERSE_STYLE,
              // Button.module.css's own disabled treatment for Secondary
              // only dims the label/icon color, not the background — fine
              // normally, but this component's inline background override
              // (above) always wins over that rule, so a disabled
              // Default/Recording button needs its own dimming or it reads
              // as fully interactive. 0.4 matches `color/alpha/light-40`'s
              // own proportion, the same "disabled" amount `text/disabled`
              // already uses elsewhere, not a newly invented number.
              ...(isDisabled ? { opacity: 0.4 } : null),
              ...style,
            }
          : style
      }
      {...rest}
    >
      {ctaText ?? DEFAULT_CTA[state]}
    </Button>
  );
});
