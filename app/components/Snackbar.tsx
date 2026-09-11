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

const STATUS_ICON: Record<SnackbarVariant, ReactNode> = {
  Default: <Info weight="fill" />,
  Success: <CheckCircle weight="fill" />,
  Error: <WarningCircle weight="fill" />,
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
        <Chip size="S" onClick={action.onClick} style={ACTION_CHIP_STYLE[variant]}>
          {action.label}
        </Chip>
      </div>
    </div>
  );
}
