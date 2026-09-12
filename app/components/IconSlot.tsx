'use client';

import type { CSSProperties, ReactNode } from 'react';
import styles from './IconSlot.module.css';

export type IconSlotSize = '100' | '150' | '200' | '250' | '300' | '400';

export interface IconSlotProps {
  /** Figma's axis is literally named `Size (IGNORE)` — not a usable JS
   * identifier, so it's `size` here. The values are unchanged. See the
   * Storybook docs: the "(IGNORE)" label is an open question for Harry, not
   * an instruction to avoid this axis. */
  size?: IconSlotSize;
  /** The icon itself — Figma models this as an instance-swap property.
   * Expected to paint with `currentColor` so it inherits its parent's tint,
   * the same contract `Button` and `ButtonIcon` already use. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Figma `iconSlot` component set (`Size (IGNORE)`: 100/150/200/250/300/400,
 * plus an instance-swap for the icon). The base wrapper for every icon in
 * the system.
 */
export function IconSlot({ size = '400', children, className, style }: IconSlotProps) {
  return (
    <span
      className={className ? `${styles.slot} ${className}` : styles.slot}
      style={style}
      data-size={size}
    >
      {children}
    </span>
  );
}
