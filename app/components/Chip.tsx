'use client';

import type { CSSProperties, ReactNode } from 'react';
import styles from './Chip.module.css';

export type ChipSize = 'XXS' | 'XS' | 'S' | 'M';
export type ChipColor = 'Primary' | 'pro';

export interface ChipProps {
  size?: ChipSize;
  color?: ChipColor;
  /** Selected/toggled-on look. Visually identical for both colors until active. */
  active?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  /** Renders as a real <button> with aria-pressed when given (filter-chip use).
   * Omit it for a static tag/badge use (e.g. a PRO label) — then it renders
   * as a plain, non-interactive <span>. */
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
}

/**
 * Figma `chips` component set (size × color × active). Real usage is thin —
 * see the component's Storybook docs for what's confirmed vs. not.
 */
export function Chip({
  size = 'XXS',
  color = 'Primary',
  active = false,
  leftIcon,
  rightIcon,
  children,
  onClick,
  className,
  ...rest
}: ChipProps) {
  const classes = className ? `${styles.chip} ${className}` : styles.chip;
  const content = (
    <>
      {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
      <span className={styles.label}>{children}</span>
      {rightIcon && <span className={styles.icon}>{rightIcon}</span>}
    </>
  );

  const dataProps = {
    'data-size': size,
    'data-color': color,
    'data-active': active ? 'true' : undefined,
  } as const;

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} aria-pressed={active} {...dataProps} {...rest}>
        {content}
      </button>
    );
  }

  return (
    <span className={classes} {...dataProps} {...rest}>
      {content}
    </span>
  );
}
