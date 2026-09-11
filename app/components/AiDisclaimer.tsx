'use client';

import type { CSSProperties } from 'react';
import styles from './AiDisclaimer.module.css';

// The real, currently bound copy in Figma — not the description's quoted
// text. Previously read "Konwie" (a typo), fixed directly in Figma.
const DISCLAIMER_COPY = 'Knowie is AI and can make mistakes.';

export interface AiDisclaimerProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Figma `aiDisclaimer` component (no variants, no exposed properties). The
 * responsible-AI overreliance disclaimer — see the component's Storybook
 * docs for the full brief.
 */
export function AiDisclaimer({ className, style }: AiDisclaimerProps) {
  const classes = className ? `${styles.disclaimer} ${className}` : styles.disclaimer;
  return (
    <p className={classes} style={style}>
      {DISCLAIMER_COPY}
    </p>
  );
}
