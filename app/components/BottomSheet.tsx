'use client';

import type { CSSProperties, ReactNode } from 'react';
import styles from './BottomSheet.module.css';
import { BottomSheetAppBar } from './BottomSheetAppBar';

export type BottomSheetHeight = 'S' | 'M' | 'L';

export interface BottomSheetProps {
  /** Detent the sheet is capped at. Figma's three variants hug their content
   * rather than enforcing a size, so these map to viewport fractions — see
   * the Storybook docs. */
  height?: BottomSheetHeight;
  /** Figma slot `middleSection`. Scrolls once the detent cap is reached. */
  middleSection?: ReactNode;
  /** Figma slot `bottomSection`. Omitted entirely when empty, rather than
   * rendering a bare 32px padded strip. */
  bottomSection?: ReactNode;
  /** The header. Figma embeds `Bottom-sheet App Bar` variant=Default on
   * height M and L; pass your own to use a titled or dismissible one. */
  appBar?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Required: `role="dialog"` has no accessible name without it. This
   * component does not trap focus or mark background content inert — whoever
   * mounts it modally owns that, along with `aria-modal` and Esc-to-close. */
  'aria-label': string;
}

/**
 * Figma `bottomSheet` component set (height: S/M/L, plus the `middleSection`
 * and `bottomSection` slots).
 */
export function BottomSheet({
  height = 'S',
  middleSection,
  bottomSection,
  appBar,
  className,
  style,
  ...rest
}: BottomSheetProps) {
  return (
    <div
      className={className ? `${styles.sheet} ${className}` : styles.sheet}
      style={style}
      data-height={height}
      role="dialog"
      {...rest}
    >
      {appBar ?? <BottomSheetAppBar variant="Default" />}
      {/* tabIndex so a keyboard user can reach and scroll this region once
       * its content passes the height detent and it actually scrolls
       * (axe scrollable-region-focusable) — found building screen 8, the
       * first `middleSection` content tall enough to trigger it. */}
      {middleSection && (
        <div className={styles.middleSection} tabIndex={0}>
          {middleSection}
        </div>
      )}
      {bottomSection && <div className={styles.bottomSection}>{bottomSection}</div>}
    </div>
  );
}
