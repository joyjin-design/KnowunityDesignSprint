'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'Primary' | 'Secondary' | 'Tertiary';
export type ButtonSize = 'S' | 'M' | 'L';

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner in place of the label and blocks interaction. */
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

/**
 * Figma `button` component set (variant × size × state). Pressed is CSS
 * `:active`, not a prop — see the component's Storybook docs for why.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'Primary',
    size = 'S',
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    children,
    className,
    ...rest
  },
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
      {loading ? (
        <>
          <Spinner size={size} colorVar={spinnerColorVar(variant)} />
          <span className={styles.visuallyHidden}>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className={styles.icon}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

/** Button's own spinner tint per variant (Tertiary uses text/link here). */
function spinnerColorVar(variant: ButtonVariant): string {
  return variant === 'Tertiary'
    ? 'var(--color-text-link)'
    : variant === 'Secondary'
      ? 'var(--color-text-primary)'
      : 'var(--color-interactive-on-primary)';
}

const SPINNER_SIZE_VAR: Record<ButtonSize, string> = {
  S: 'var(--size-icon-200)',
  M: 'var(--size-icon-250)',
  L: 'var(--size-icon-300)',
};

/**
 * Shared loading spinner, reused by ButtonIcon. Sized via an explicit inline
 * style (rather than an ancestor `[data-size]` selector) so it renders
 * correctly regardless of which component's CSS module wraps it. Color is
 * also explicit since Button and ButtonIcon tint it differently.
 */
export function Spinner({ size, colorVar }: { size: ButtonSize; colorVar: string }) {
  const dimension = SPINNER_SIZE_VAR[size];
  return (
    <svg
      className={styles.spinner}
      style={{ width: dimension, height: dimension, flexShrink: 0 }}
      viewBox="0 0 24 24"
      fill="none"
      role="presentation"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke={colorVar} strokeWidth="3" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke={colorVar} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
