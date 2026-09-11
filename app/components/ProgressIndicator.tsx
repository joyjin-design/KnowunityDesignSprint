'use client';

import type { CSSProperties } from 'react';
import styles from './ProgressIndicator.module.css';

export type ProgressIndicatorVariant = 'Primary' | 'Coral';
export type ProgressIndicatorThickness = '24' | '16';
export type ProgressIndicatorStep = 0 | 25 | 50 | 75 | 100;

export interface ProgressIndicatorProps {
  variant?: ProgressIndicatorVariant;
  thickness?: ProgressIndicatorThickness;
  /** Five-step snap scale (0/25/50/75/100) — not a freeform percentage. */
  progress?: ProgressIndicatorStep;
  /** Reveals the step-count label, centered over the bar. Fixed placeholder text, not wired to
   * `progress`. Only has an effect at `thickness="24"` — the real Figma file has no label layer
   * on the `thickness="16"` variants at all, so this is a no-op there, matching the source. */
  showText?: boolean;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
}

/**
 * Figma `progressIndicator` component set (variant × thickness × progress).
 * Lesson/quiz progress, lives inside appBar's Slot in real use.
 */
export function ProgressIndicator({
  variant = 'Primary',
  thickness = '24',
  progress = 0,
  showText = false,
  className,
  style,
  'aria-label': ariaLabel = 'Lesson progress',
  ...rest
}: ProgressIndicatorProps) {
  const classes = className ? `${styles.root} ${className}` : styles.root;

  return (
    <div
      className={classes}
      style={style}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      data-thickness={thickness}
      {...rest}
    >
      <div
        className={styles.fill}
        data-variant={variant}
        data-thickness={thickness}
        data-progress={progress}
      />
      {showText && thickness === '24' && <span className={styles.label}>0/12</span>}
    </div>
  );
}
