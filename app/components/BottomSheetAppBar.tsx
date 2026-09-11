'use client';

import type { CSSProperties, ReactNode } from 'react';
import styles from './BottomSheetAppBar.module.css';
import { ButtonIcon } from './ButtonIcon';

export type BottomSheetAppBarVariant = 'Default' | 'withTitle' | 'dismissOnly' | 'dismissAndAction';

export interface BottomSheetAppBarProps {
  variant?: BottomSheetAppBarVariant;
  title?: string;
  caption?: string;
  showCaption?: boolean;
  /** Figma leaves this icon as the unassigned `square` iconSlot placeholder —
   * pass a real icon here. Omitting it renders that same placeholder. */
  dismissIcon?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  /** Trailing action, `dismissAndAction` only. Same unassigned-placeholder
   * caveat as `dismissIcon`. */
  actionIcon?: ReactNode;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
  style?: CSSProperties;
}

/** Figma's iconSlot default — a plain square, not a real dismiss glyph. */
function PlaceholderIcon() {
  return (
    <svg className={styles.placeholderIcon} viewBox="0 0 20 20" aria-hidden="true">
      <rect x="1" y="1" width="18" height="18" rx="2" />
    </svg>
  );
}

/**
 * Figma `Bottom-sheet App Bar` component set (variant: Default/withTitle/
 * dismissOnly/dismissAndAction). The grab handle + header row at the top of
 * a `BottomSheet`.
 */
export function BottomSheetAppBar({
  variant = 'Default',
  title = 'Title',
  caption = 'Sub-title (optional)',
  showCaption = false,
  dismissIcon,
  onDismiss,
  dismissLabel = 'Close',
  actionIcon,
  onAction,
  actionLabel = 'More',
  className,
  style,
}: BottomSheetAppBarProps) {
  const showText = variant !== 'Default';
  const showDismiss = variant === 'dismissOnly' || variant === 'dismissAndAction';
  const showAction = variant === 'dismissAndAction';

  return (
    <div className={className ? `${styles.root} ${className}` : styles.root} style={style}>
      <span className={styles.handle} aria-hidden="true" />
      <div className={styles.topNav} data-variant={variant}>
        {showDismiss && (
          <ButtonIcon
            variant="Tertiary"
            size="M"
            icon={dismissIcon ?? <PlaceholderIcon />}
            aria-label={dismissLabel}
            onClick={onDismiss}
          />
        )}
        {showText && (
          <div className={styles.textSection}>
            <span className={styles.title}>{title}</span>
            {showCaption && <span className={styles.caption}>{caption}</span>}
          </div>
        )}
        {showAction && (
          <ButtonIcon
            variant="Tertiary"
            size="M"
            icon={actionIcon ?? <PlaceholderIcon />}
            aria-label={actionLabel}
            onClick={onAction}
          />
        )}
      </div>
    </div>
  );
}
