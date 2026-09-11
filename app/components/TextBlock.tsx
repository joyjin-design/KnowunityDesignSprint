'use client';

import type { CSSProperties } from 'react';
import styles from './TextBlock.module.css';

export type TextBlockVariant = 'XL' | 'L' | 'M' | 'S';

export interface TextBlockProps {
  variant?: TextBlockVariant;
  /** Toggles the caption line. Title always renders. */
  showCaption?: boolean;
  title?: string;
  caption?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Figma `textBlock` component set (variant: XL/L/M/S, showCaption toggle).
 * A short emotional headline plus one specific supporting stat, used next to
 * a mascot moment — see the component's Storybook docs for the full brief.
 */
export function TextBlock({
  variant = 'XL',
  showCaption = true,
  title = 'Header',
  caption = 'Caption',
  className,
  style,
}: TextBlockProps) {
  const classes = className ? `${styles.textBlock} ${className}` : styles.textBlock;

  return (
    <div className={classes} style={style} data-variant={variant}>
      <p className={styles.title}>{title}</p>
      {showCaption && <p className={styles.caption}>{caption}</p>}
    </div>
  );
}
