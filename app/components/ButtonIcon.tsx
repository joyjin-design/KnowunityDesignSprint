'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './ButtonIcon.module.css';
import { Spinner, type ButtonVariant, type ButtonSize } from './Button';

export interface ButtonIconProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner in place of the icon and blocks interaction. */
  loading?: boolean;
  /** The icon graphic. Should paint with `currentColor` so it picks up the
   * right tint per variant/state automatically. */
  icon: ReactNode;
  /** Required: this button has no visible label, so it needs its own
   * accessible name. */
  'aria-label': string;
}

function spinnerColorVar(variant: ButtonVariant): string {
  // Secondary and Tertiary share text/primary here (unlike Button, where
  // Tertiary's spinner is tinted text/link instead).
  return variant === 'Primary' ? 'var(--color-interactive-on-primary)' : 'var(--color-text-primary)';
}

/**
 * Figma `buttonIcon` component set: same variant × size × state matrix as
 * `Button`, icon-only. Pressed is CSS `:active`, not a prop, for the same
 * reason as `Button` — see the component's Storybook docs.
 */
export const ButtonIcon = forwardRef<HTMLButtonElement, ButtonIconProps>(function ButtonIcon(
  { variant = 'Primary', size = 'S', loading = false, disabled = false, icon, className, ...rest },
  ref
) {
  const blocked = disabled || loading;
  return (
    <button
      ref={ref}
      type="button"
      className={className ? `${styles.button} ${className}` : styles.button}
      data-variant={variant}
      data-size={size}
      data-disabled={disabled && !loading ? 'true' : undefined}
      disabled={blocked}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span className={styles.circle}>
        {loading ? (
          <Spinner size={size} colorVar={spinnerColorVar(variant)} />
        ) : (
          <span className={styles.icon}>{icon}</span>
        )}
      </span>
    </button>
  );
});
