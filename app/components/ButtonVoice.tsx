'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Button } from './Button';

export type ButtonVoiceState = 'Default' | 'Recording' | 'Loading' | 'Disabled';

const DEFAULT_CTA: Record<ButtonVoiceState, string> = {
  Default: 'Start',
  Recording: 'Stop',
  Loading: 'Analyzing',
  Disabled: 'Start',
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
  { state = 'Default', ctaText, leftIcon, ...rest },
  ref
) {
  return (
    <Button
      ref={ref}
      variant="Secondary"
      size="L"
      leftIcon={leftIcon}
      loading={state === 'Loading'}
      disabled={state === 'Disabled'}
      {...rest}
    >
      {ctaText ?? DEFAULT_CTA[state]}
    </Button>
  );
});
