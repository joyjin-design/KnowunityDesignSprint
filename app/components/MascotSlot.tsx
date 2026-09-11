'use client';

import type { CSSProperties } from 'react';
import styles from './MascotSlot.module.css';

export type MascotSlotSize = 'XL' | '2XL' | '3XL' | '4XL';

export type MascotExpression =
  | 'standby'
  | 'amazed'
  | 'angry'
  | 'approving'
  | 'confused'
  | 'dazed'
  | 'determined'
  | 'excited'
  | 'giggling'
  | 'laughing'
  | 'overIt'
  | 'questioning'
  | 'sad'
  | 'thinking';

export interface MascotSlotProps {
  size?: MascotSlotSize;
  /**
   * Not a real exposed Figma property (see Storybook docs) — added ahead of
   * Figma's own interface because real instances already vary this, using
   * the mascot expression assets already shipped in public/images.
   */
  expression?: MascotExpression;
  className?: string;
  style?: CSSProperties;
}

/**
 * Figma `mascotSlot` component set (size: XL/2XL/3XL/4XL). Sizing wrapper
 * around the mascot illustration for large, hero-scale moments — see the
 * component's Storybook docs for the full brief.
 */
export function MascotSlot({ size = 'XL', expression = 'standby', className, style }: MascotSlotProps) {
  const classes = className ? `${styles.mascotSlot} ${className}` : styles.mascotSlot;

  return (
    <div className={classes} style={style} data-size={size}>
      <img className={styles.image} src={`/images/${expression}.svg`} alt="" />
    </div>
  );
}
