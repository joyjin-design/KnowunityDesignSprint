'use client';

import type { CSSProperties, ReactNode } from 'react';
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { DotsThreeVertical } from '@phosphor-icons/react/dist/csr/DotsThreeVertical';
import { Export } from '@phosphor-icons/react/dist/csr/Export';
import styles from './AppBar.module.css';
import { Button } from './Button';
import { ButtonIcon } from './ButtonIcon';

export type AppBarVariant =
  | 'default'
  | 'leftIconButtonOnly'
  | 'leftAndRightIconButton'
  | 'leftAndRightButton'
  | 'leftAndTwoRightIconButtons'
  | 'leftAnd2RightButtons';

export interface AppBarProps {
  variant?: AppBarVariant;
  /** Figma's `Slot`: the flexible middle of the row. Real usage puts a
   * `ProgressIndicator` here, and anything that sits beside it (a streak or
   * XP chip) goes in here too. */
  slot?: ReactNode;
  /** Leading icon button, every variant except `default`. Defaults to
   * Phosphor ArrowLeft (Figma shows `arrow-left`). */
  leftIcon?: ReactNode;
  onLeftClick?: () => void;
  leftLabel?: string;
  /** Trailing icon button: `leftAndRightIconButton`, `leftAndTwoRightIconButtons`
   * (the last one) and `leftAnd2RightButtons` (before the text button).
   * Defaults to Phosphor DotsThreeVertical (Figma shows `dots-vertical`). */
  rightIcon?: ReactNode;
  onRightClick?: () => void;
  rightLabel?: string;
  /** The extra icon button before `rightIcon`, `leftAndTwoRightIconButtons`
   * only. Defaults to Phosphor Export (Figma shows `share-02`). */
  extraRightIcon?: ReactNode;
  onExtraRightClick?: () => void;
  extraRightLabel?: string;
  /** Figma's `Text` on the nested text button, `leftAndRightButton` and
   * `leftAnd2RightButtons` only. */
  buttonText?: string;
  onButtonClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * Figma `appBar` component set (variant: default / leftIconButtonOnly /
 * leftAndRightIconButton / leftAndRightButton / leftAndTwoRightIconButtons /
 * leftAnd2RightButtons). The lesson/quiz top nav row.
 */
export function AppBar({
  variant = 'default',
  slot,
  leftIcon,
  onLeftClick,
  leftLabel = 'Back',
  rightIcon,
  onRightClick,
  rightLabel = 'More',
  extraRightIcon,
  onExtraRightClick,
  extraRightLabel = 'Share',
  buttonText = 'Skip',
  onButtonClick,
  className,
  style,
}: AppBarProps) {
  const showLeft = variant !== 'default';
  const showRightIcon =
    variant === 'leftAndRightIconButton' ||
    variant === 'leftAndTwoRightIconButtons' ||
    variant === 'leftAnd2RightButtons';
  const showExtraRight = variant === 'leftAndTwoRightIconButtons';
  const showTextButton = variant === 'leftAndRightButton' || variant === 'leftAnd2RightButtons';
  const groupRight = variant === 'leftAndTwoRightIconButtons' || variant === 'leftAnd2RightButtons';

  const rightIconButton = showRightIcon && (
    <ButtonIcon
      className={styles.iconButton}
      variant="Tertiary"
      size="M"
      icon={rightIcon ?? <DotsThreeVertical size="100%" aria-hidden="true" />}
      aria-label={rightLabel}
      onClick={onRightClick}
    />
  );

  const textButton = showTextButton && (
    <span className={styles.textButton} data-variant={variant}>
      <Button className={styles.textButtonLabel} variant="Tertiary" size="S" onClick={onButtonClick}>
        {buttonText}
      </Button>
    </span>
  );

  return (
    <div className={className ? `${styles.root} ${className}` : styles.root} style={style}>
      <div className={styles.topNav} data-variant={variant}>
        {showLeft && (
          <ButtonIcon
            className={styles.iconButton}
            variant="Tertiary"
            size="M"
            icon={leftIcon ?? <ArrowLeft size="100%" aria-hidden="true" />}
            aria-label={leftLabel}
            onClick={onLeftClick}
          />
        )}
        <div className={styles.slot}>{slot}</div>
        {groupRight ? (
          <div className={styles.rightButtons} data-variant={variant}>
            {showExtraRight && (
              <ButtonIcon
                className={styles.iconButton}
                variant="Tertiary"
                size="M"
                icon={extraRightIcon ?? <Export size="100%" aria-hidden="true" />}
                aria-label={extraRightLabel}
                onClick={onExtraRightClick}
              />
            )}
            {rightIconButton}
            {textButton}
          </div>
        ) : (
          <>
            {rightIconButton}
            {textButton}
          </>
        )}
      </div>
    </div>
  );
}
