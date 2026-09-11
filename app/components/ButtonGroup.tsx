'use client';

import type { CSSProperties, ReactNode } from 'react';
import styles from './ButtonGroup.module.css';

export type ButtonGroupVariant = 'Horizontal' | 'Vertical';
export type ButtonGroupSize = 'M' | 'L';

export interface ButtonGroupProps {
  variant?: ButtonGroupVariant;
  size?: ButtonGroupSize;
  /** Exactly two actions — the real component hardcodes two nested button
   * instances, not a flexible list. */
  children: readonly [ReactNode, ReactNode];
  className?: string;
  style?: CSSProperties;
}

/**
 * Figma `buttonGroup` component set (variant: Horizontal/Vertical, size:
 * M/L). A container for exactly a primary + secondary action pair — see
 * the component's Storybook docs for what's confirmed vs. not.
 */
export function ButtonGroup({
  variant = 'Vertical',
  size = 'M',
  children,
  className,
  style,
}: ButtonGroupProps) {
  const classes = className ? `${styles.buttonGroup} ${className}` : styles.buttonGroup;
  const [first, second] = children;

  return (
    <div className={classes} style={style} data-variant={variant} data-size={size}>
      {first}
      {second}
    </div>
  );
}
