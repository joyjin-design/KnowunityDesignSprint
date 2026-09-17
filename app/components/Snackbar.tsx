'use client';

import type { ReactNode } from 'react';
import { Info } from '@phosphor-icons/react/dist/csr/Info';
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { WarningCircle } from '@phosphor-icons/react/dist/csr/WarningCircle';
import styles from './Snackbar.module.css';
import { Button } from './Button';
import { Chip } from './Chip';

export type SnackbarVariant = 'Default' | 'Success' | 'Error';

export interface SnackbarAction {
  label: string;
  onClick: () => void;
}

export interface SnackbarProps {
  variant?: SnackbarVariant;
  /** The message text (Figma's exposed Text property). Up to 2 lines; keep it short. */
  children: ReactNode;
  /** The chip action — present in every real instance found. */
  action: SnackbarAction;
  /** The hidden-by-default secondary action (a real Tertiary Button in the
   * file, not documented in the component's own Figma description — found by
   * walking the actual tree). Omit to keep it hidden, matching the default. */
  secondaryAction?: SnackbarAction;
  className?: string;
}

// `size="100%"` matches every other Phosphor icon usage in the file (e.g.
// LoopScreen.tsx's <X size="100%">) — without it these default to Phosphor's
// own 1em, which resolved to 16px against this box's real 24px
// (`--size-icon-300`, `.icon` below), sitting undersized and flush at the
// span's top-left corner rather than filling and centering in it (found
// 2026-09-16 double-checking the Error icon swap against Figma 13719:9060,
// but the same missing prop affected Default/Success too).
const STATUS_ICON: Record<SnackbarVariant, ReactNode> = {
  Default: <Info weight="fill" size="100%" />,
  Success: <CheckCircle weight="fill" size="100%" />,
  // Outline, not filled, unlike Default/Success (2026-09-16, your edit to
  // the real placed instance, Figma 13719:9060) — the mainComponent is
  // still named `warning-circle`, same icon concept, just a stroke weight
  // instead of a solid one now.
  Error: <WarningCircle weight="regular" size="100%" />,
};

// The action chip was blue/green/red per variant in the file, but that came
// from a stale, orphaned chips component with color options the real one
// doesn't have (Primary/pro only). This reproduces the original per-variant
// color intent with real tokens, applied as a style override on Chip rather
// than through its own color prop.
const ACTION_CHIP_STYLE: Record<SnackbarVariant, { background: string; color: string }> = {
  Default: { background: 'var(--color-accent-blue-bold)', color: 'var(--color-accent-blue-on-bold)' },
  Success: { background: 'var(--color-feedback-success-bold)', color: 'var(--color-feedback-success-on-bold)' },
  Error: { background: 'var(--color-feedback-error-bold)', color: 'var(--color-feedback-error-on-bold)' },
};

/**
 * Figma `snackbar` component set (Default/Success/Error). Not built anywhere
 * in the file yet — see the component's Storybook docs for the real
 * description and what's confirmed vs. not.
 */
export function Snackbar({
  variant = 'Default',
  children,
  action,
  secondaryAction,
  className,
}: SnackbarProps) {
  return (
    <div className={className ? `${styles.wrapper} ${className}` : styles.wrapper}>
      <div className={styles.pill} data-variant={variant}>
        <span className={styles.icon}>{STATUS_ICON[variant]}</span>
        <div className={styles.textContainer}>
          <p className={styles.message}>{children}</p>
          {secondaryAction && (
            <Button variant="Tertiary" size="S" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
        <Chip size="S" onClick={action.onClick} style={ACTION_CHIP_STYLE[variant]} className={styles.actionHitArea}>
          {action.label}
        </Chip>
      </div>
    </div>
  );
}
