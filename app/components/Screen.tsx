'use client';

import type { CSSProperties, ReactNode } from 'react';
import styles from './Screen.module.css';

/** Figma's `size` axis carries 8 options. Only the default, `iPhone 13`
 * (390×844), is in scope — CLAUDE.md is 390px iOS only and design-system.md
 * rules out pulling a tablet or MacBook variant into a mobile screen. The
 * other 7 are listed in the Storybook docs. */
export type ScreenSize = 'iPhone 13';

export interface ScreenProps {
  /** Figma variant axis `size`. One option in scope; see ScreenSize. It
   * doesn't drive layout — the frame fills the viewport rather than
   * hardcoding Figma's unbound 390×844. */
  size?: ScreenSize;
  /** Figma slot `topNavigation` — "Placeholder for navigation items, such as
   * back buttons, home top nav with streaks & similar." */
  topNavigation?: ReactNode;
  /** Figma slot `middleContent` — the screen's actual content. */
  middleContent?: ReactNode;
  /** Figma slot `bottomContent` — "Placeholder for bottom navigation bar,
   * chat input field & similar." */
  bottomContent?: ReactNode;
  /** Figma slot `bottomSheetOnly`. Content that exists only while a sheet is
   * showing; it disappears with the sheet. */
  bottomSheetOnly?: ReactNode;
  /** Figma boolean `showTopNavSlot`. Note that every slot also carries
   * `displayEmptyByDefault: false` in Figma, so a slot with nothing in it
   * collapses even when its boolean is true. */
  showTopNavSlot?: boolean;
  /** Figma boolean `showBottomNavSlot`. In Figma this same boolean also
   * controls the `bottomSheetOnly` slot's visibility; that link is not
   * reproduced here — see the Storybook docs. */
  showBottomNavSlot?: boolean;
  /** Figma boolean `showBottomSheetBackground`. The `background/scrim` dim
   * behind a sheet. */
  showBottomSheetBackground?: boolean;
  /** Not a Figma component property: the `Scrim` layer inside `middleContent`
   * exists but is wired to nothing, so it can only be toggled by hand there.
   * A bottom fade of `background/page` over the content, off by default. */
  showScrim?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Figma `scaffold` component set (size: iPhone 13 + 7 out-of-scope sizes,
 * plus the topNavigation / middleContent / bottomContent / bottomSheetOnly
 * slots). The device frame every screen is built inside.
 */
export function Screen({
  size = 'iPhone 13',
  topNavigation,
  middleContent,
  bottomContent,
  bottomSheetOnly,
  showTopNavSlot = true,
  showBottomNavSlot = true,
  showBottomSheetBackground = false,
  showScrim = false,
  className,
  style,
}: ScreenProps) {
  return (
    <div
      className={className ? `${styles.screen} ${className}` : styles.screen}
      style={style}
      data-size={size}
    >
      <div className={styles.panelHeader}>
        {/* Mock device chrome, not content — hidden from assistive tech so a
            screen reader doesn't read a fake clock before the screen. */}
        <div className={styles.statusBar} aria-hidden="true">
          <span className={styles.time}>09:41</span>
        </div>
      </div>

      {showTopNavSlot && topNavigation && (
        <div className={styles.topNavigation}>{topNavigation}</div>
      )}

      {(middleContent || showScrim) && (
        <div className={styles.middleContent}>
          {middleContent}
          {showScrim && <div className={styles.scrim} aria-hidden="true" />}
        </div>
      )}

      {showBottomNavSlot && bottomContent && (
        <div className={styles.bottomContent}>{bottomContent}</div>
      )}

      {showBottomSheetBackground && (
        <div className={styles.bottomSheetBackground} aria-hidden="true" />
      )}

      {/* Figma ties this slot's visibility to showBottomNavSlot. Not copied:
          the bottom nav is normally hidden while a sheet is up, so honouring
          that link would hide the sheet exactly when it's needed. It renders
          on having content instead. */}
      {bottomSheetOnly && <div className={styles.bottomSheetOnly}>{bottomSheetOnly}</div>}
    </div>
  );
}
