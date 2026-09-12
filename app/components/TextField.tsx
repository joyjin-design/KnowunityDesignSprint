'use client';

import { useId, useState, type ChangeEvent, type CSSProperties } from 'react';
import { ButtonIcon } from './ButtonIcon';
import { IconSlot } from './IconSlot';
import styles from './TextField.module.css';

export type TextFieldVariant = 'Default' | 'Error' | 'Placeholder';

/** Transcribed from the `search-lg` icon inside Figma's leading `Icon Slot`. */
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="100%" height="100%">
      <path
        d="M19 11.5C19 7.35786 15.6421 4 11.5 4C7.35786 4 4 7.35786 4 11.5C4 15.6421 7.35786 19 11.5 19C13.5199 19 15.3517 18.1999 16.7002 16.9014C16.7284 16.8638 16.7588 16.8272 16.793 16.793C16.8271 16.7588 16.8638 16.7284 16.9014 16.7002C18.1999 15.3517 19 13.5199 19 11.5ZM21 11.5C21 13.7631 20.2068 15.8398 18.8857 17.4717L21.707 20.293C22.0975 20.6835 22.0976 21.3165 21.707 21.707C21.3165 22.0975 20.6835 22.0976 20.293 21.707L17.4717 18.8857C15.8398 20.2068 13.7631 21 11.5 21C6.25329 21 2 16.7467 2 11.5C2 6.25329 6.25329 2 11.5 2C16.7467 2 21 6.25329 21 11.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Transcribed from the `x-circle` icon inside Figma's trailing `Button icon`. */
function ClearIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="100%" height="100%">
      <path
        d="M13.9998 8C13.9998 4.68629 11.3135 2 7.99984 2C4.68613 2 1.99984 4.68629 1.99984 8C1.99984 11.3137 4.68613 14 7.99984 14C11.3135 14 13.9998 11.3137 13.9998 8ZM9.52848 5.52864C9.78883 5.26829 10.2108 5.26829 10.4712 5.52864C10.7315 5.78899 10.7315 6.211 10.4712 6.47135L8.94255 8L10.4712 9.52864C10.7315 9.78899 10.7315 10.211 10.4712 10.4714C10.2108 10.7317 9.78883 10.7317 9.52848 10.4714L7.99984 8.94271L6.47119 10.4714C6.21084 10.7317 5.78883 10.7317 5.52848 10.4714C5.26813 10.211 5.26813 9.78899 5.52848 9.52864L7.05713 8L5.52848 6.47135C5.26813 6.211 5.26813 5.78899 5.52848 5.52864C5.78883 5.26829 6.21084 5.26829 6.47119 5.52864L7.99984 7.05729L9.52848 5.52864ZM15.3332 8C15.3332 12.0501 12.0499 15.3333 7.99984 15.3333C3.94975 15.3333 0.666504 12.0501 0.666504 8C0.666504 3.94991 3.94975 0.666664 7.99984 0.666664C12.0499 0.666664 15.3332 3.94991 15.3332 8Z"
        fill="currentColor"
      />
    </svg>
  );
}

export interface TextFieldProps {
  /**
   * Figma's `Variant` axis, same three options. Defaults to `Error` because
   * that's the component set's own default in Figma — kept for parity, same
   * convention as `IconSlot` and `Chip`, but it means a bare `<TextField />`
   * renders as failed. Pass `variant` explicitly.
   */
  variant?: TextFieldVariant;
  /** Figma `showTitle`. */
  showTitle?: boolean;
  /** Figma `Title Text`. Also the field's accessible name when the title is hidden. */
  titleText?: string;
  /** Figma `Placeholder`. */
  placeholder?: string;
  /** Figma `showLeadingIcon`. */
  showLeadingIcon?: boolean;
  /** Figma `showTrailingIcon` — the clear button. */
  showTrailingIcon?: boolean;
  /**
   * Figma `showCaption`. Applies to `Default` and `Placeholder` only: Figma's
   * `Error` caption has no visibility binding, so it always shows.
   */
  showCaption?: boolean;
  /** Figma `(Error) caption`. Shown on `Error` only. */
  errorCaption?: string;
  /**
   * Ahead of Figma: the `Default`/`Placeholder` caption is fixed text
   * ("Explanation text") in Figma and can't be changed from an instance.
   */
  caption?: string;
  /** Ahead of Figma, as with any real input. Pass with `onChange` to control it. */
  value?: string;
  /** Ahead of Figma. Starting text when uncontrolled. */
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Ahead of Figma: what the trailing clear button does besides emptying the field. */
  onClear?: () => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * Figma `Text Field` component set (Variant: Default/Error/Placeholder). A
 * single-line form field. The set carries no description in Figma; see the
 * component's Storybook docs for what it's for and where this build diverges.
 */
export function TextField({
  variant = 'Error',
  showTitle = false,
  titleText = 'E.g., Name',
  placeholder = 'Tell us more about yourself',
  showLeadingIcon = true,
  showTrailingIcon = true,
  showCaption = false,
  errorCaption = 'Explanation message',
  caption = 'Explanation text',
  value,
  defaultValue = '',
  onChange,
  onClear,
  className,
  style,
}: TextFieldProps) {
  const inputId = useId();
  const captionId = useId();
  const [draft, setDraft] = useState(defaultValue);
  const text = value ?? draft;

  const isError = variant === 'Error';
  const captionText = isError ? errorCaption : caption;
  const captionVisible = isError || showCaption;

  const setText = (next: string) => {
    if (value === undefined) setDraft(next);
    onChange?.(next);
  };

  const classes = className ? `${styles.root} ${className}` : styles.root;

  return (
    <div className={classes} style={style} data-variant={variant}>
      {showTitle && (
        <label className={styles.title} htmlFor={inputId}>
          {titleText}
        </label>
      )}

      <div className={styles.body}>
        <div className={styles.field}>
          {showLeadingIcon && (
            <span className={styles.leading}>
              <IconSlot size="300">
                <SearchIcon />
              </IconSlot>
            </span>
          )}

          <div className={styles.inputWrap}>
            <input
              id={inputId}
              className={styles.input}
              type="text"
              value={text}
              placeholder={placeholder}
              aria-label={showTitle ? undefined : titleText}
              aria-invalid={isError || undefined}
              aria-describedby={captionVisible ? captionId : undefined}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
            />
          </div>

          {showTrailingIcon && (
            <ButtonIcon
              variant="Tertiary"
              size="S"
              icon={<ClearIcon />}
              aria-label="Clear"
              onClick={() => {
                setText('');
                onClear?.();
              }}
            />
          )}
        </div>

        {captionVisible && (
          <p className={styles.caption} id={captionId}>
            {captionText}
          </p>
        )}
      </div>
    </div>
  );
}
