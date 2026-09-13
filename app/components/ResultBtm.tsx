'use client';

import type { CSSProperties } from 'react';
import styles from './ResultBtm.module.css';
import { Button } from './Button';
import { ButtonIcon } from './ButtonIcon';
import { ButtonGroup } from './ButtonGroup';
import { ButtonVoice, type ButtonVoiceState } from './ButtonVoice';

export type ResultBtmVariant = 'Success' | 'Partial' | 'Error' | 'Silence';

export interface ResultBtmProps {
  variant?: ResultBtmVariant;
  onWhy?: () => void;
  onContinue?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  onSkip?: () => void;
  onReRecord?: () => void;
  onTypeInstead?: () => void;
  /** Only meaningful for the Silence variant's re-record action. */
  voiceState?: ButtonVoiceState;
  className?: string;
  style?: CSSProperties;
}

const TITLE: Record<ResultBtmVariant, string> = {
  Error: 'Incorrect',
  Partial: 'Partial right',
  Success: 'Nice!',
  Silence: "Didn't catch that",
};

// Action button color per variant — a local override on top of the real
// `button` component's own Primary look, not a formal Button variant. See
// the Storybook docs for why.
const ACTION_COLOR: Record<Exclude<ResultBtmVariant, 'Silence'>, CSSProperties> = {
  Error: { background: 'var(--color-feedback-error-bold)', color: 'var(--color-feedback-error-on-bold)' },
  Partial: { background: 'var(--color-accent-blue-bold)', color: 'var(--color-accent-blue-on-bold)' },
  Success: { background: 'var(--color-feedback-success-bold)', color: 'var(--color-feedback-success-on-bold)' },
};

// This sheet's Secondary actions paint `interactive/secondary`, not the
// `button` master's own `background/surface`. Matching the master here made
// the button invisible on the Error and Silence sheets, which are themselves
// `background/surface` — a 10%-white overlay reads on every variant instead.
// Same local-override mechanism as ACTION_COLOR above.
const SECONDARY_COLOR: CSSProperties = {
  background: 'var(--color-interactive-secondary)',
  color: 'var(--color-interactive-on-secondary)',
};

// Silence's re-record action alone is overridden to the error red in Figma
// (`feedback/error/bold` + `text/inverse`). Its siblings — the skip icon
// button and "Try typing instead" — stay `interactive/secondary`.
const SILENCE_ACTION_COLOR: CSSProperties = {
  background: 'var(--color-feedback-error-bold)',
  color: 'var(--color-text-inverse)',
};

function CloseIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.67827 0.000000401H16.3217C17.3951 -0.0000129323 18.2808 -0.0000263403 19.0024 0.0589337C19.7519 0.12016 20.4408 0.251574 21.088 0.581307C22.0915 1.09263 22.9073 1.90852 23.4187 2.91205C23.7484 3.55917 23.8799 4.24811 23.9411 4.99757C24 5.71916 24 6.60496 24 7.67824V16.3217C24 17.3951 24 18.2808 23.9411 19.0024C23.8799 19.7519 23.7484 20.4408 23.4187 21.088C22.9073 22.0915 22.0915 22.9073 21.088 23.4187C20.4408 23.7484 19.7519 23.8799 19.0024 23.9411C18.2808 24 17.3951 24 16.3217 24H7.67824C6.60496 24 5.71916 24 4.99757 23.9411C4.24811 23.8799 3.55917 23.7484 2.91205 23.4187C1.90852 22.9073 1.09263 22.0915 0.581307 21.088C0.251574 20.4408 0.12016 19.7519 0.0589337 19.0024C-0.0000263403 18.2808 -0.0000129323 17.3951 0.000000401 16.3217V7.67825C-0.0000129323 6.60497 -0.0000263403 5.71915 0.0589337 4.99757C0.12016 4.24811 0.251574 3.55917 0.581307 2.91205C1.09263 1.90852 1.90852 1.09263 2.91205 0.581307C3.55917 0.251574 4.24811 0.12016 4.99757 0.0589337C5.71915 -0.0000263403 6.605 -0.0000129323 7.67827 0.000000401ZM8.94281 7.05719C8.42211 6.53649 7.57789 6.53649 7.05719 7.05719C6.53649 7.57789 6.53649 8.42211 7.05719 8.94281L10.1144 12L7.05719 15.0572C6.53649 15.5779 6.53649 16.4221 7.05719 16.9428C7.57789 17.4635 8.42211 17.4635 8.94281 16.9428L12 13.8856L15.0572 16.9428C15.5779 17.4635 16.4221 17.4635 16.9428 16.9428C17.4635 16.4221 17.4635 15.5779 16.9428 15.0572L13.8856 12L16.9428 8.94281C17.4635 8.42211 17.4635 7.57789 16.9428 7.05719C16.4221 6.53649 15.5779 6.53649 15.0572 7.05719L12 10.1144L8.94281 7.05719Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.67827 0.000000401H16.3217C17.3951 -0.0000129323 18.2808 -0.0000263403 19.0024 0.0589337C19.7519 0.12016 20.4408 0.251574 21.088 0.581307C22.0915 1.09263 22.9073 1.90852 23.4187 2.91205C23.7484 3.55917 23.8799 4.24811 23.9411 4.99757C24 5.71916 24 6.60496 24 7.67824V16.3217C24 17.3951 24 18.2808 23.9411 19.0024C23.8799 19.7519 23.7484 20.4408 23.4187 21.088C22.9073 22.0915 22.0915 22.9073 21.088 23.4187C20.4408 23.7484 19.7519 23.8799 19.0024 23.9411C18.2808 24 17.3951 24 16.3217 24H7.67824C6.60496 24 5.71916 24 4.99757 23.9411C4.24811 23.8799 3.55917 23.7484 2.91205 23.4187C1.90852 22.9073 1.09263 22.0915 0.581307 21.088C0.251574 20.4408 0.12016 19.7519 0.0589337 19.0024C-0.0000263403 18.2808 -0.0000129323 17.3951 0.000000401 16.3217V7.67825C-0.0000129323 6.60497 -0.0000263403 5.71915 0.0589337 4.99757C0.12016 4.24811 0.251574 3.55917 0.581307 2.91205C1.09263 1.90852 1.90852 1.09263 2.91205 0.581307C3.55917 0.251574 4.24811 0.12016 4.99757 0.0589337C5.71915 -0.0000263403 6.605 -0.0000129323 7.67827 0.000000401ZM17.6052 9.9428C18.1259 9.42213 18.1259 8.57791 17.6052 8.0572C17.0844 7.53651 16.2403 7.53651 15.7196 8.0572L10.6624 13.1144L8.93849 11.3905C8.41779 10.8699 7.57358 10.8699 7.05288 11.3905C6.53217 11.9112 6.53217 12.7555 7.05288 13.2761L9.7196 15.9428C10.2403 16.4635 11.0844 16.4635 11.6052 15.9428L17.6052 9.9428Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InfoCircleIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C15.9706 20 20 15.9706 20 11ZM10 15V11C10 10.4477 10.4477 10 11 10C11.5523 10 12 10.4477 12 11V15C12 15.5523 11.5523 16 11 16C10.4477 16 10 15.5523 10 15ZM11.0098 6C11.5621 6 12.0098 6.44772 12.0098 7C12.0098 7.55228 11.5621 8 11.0098 8H11C10.4477 8 10 7.55228 10 7C10 6.44772 10.4477 6 11 6H11.0098ZM22 11C22 17.0751 17.0751 22 11 22C4.92487 22 0 17.0751 0 11C0 4.92487 4.92487 0 11 0C17.0751 0 22 4.92487 22 11Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* Figma's real `skip-forward` glyph: a filled 16x16 vector inset 4px inside a
   24px iconSlot, transcribed from the Silence variant's own instance. What was
   here before drew an X, which is a close/dismiss glyph, not a skip one. */
function SkipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" aria-hidden="true">
      <g transform="translate(4, 4)">
        <path d="M 14 15 L 14 1 C 14 0.45 14.45 0 15 0 C 15.55 0 16 0.45 16 1 L 16 15 C 16 15.55 15.55 16 15 16 C 14.45 16 14 15.55 14 15 Z M 2 0.08 C 2.49 0.08 2.89 0.31 3.17 0.5 C 3.47 0.69 3.82 0.98 4.22 1.3 L 10.06 5.97 C 10.32 6.17 10.56 6.36 10.74 6.54 C 10.93 6.72 11.15 6.96 11.27 7.3 C 11.44 7.75 11.44 8.25 11.27 8.7 C 11.15 9.04 10.93 9.28 10.74 9.46 C 10.56 9.64 10.32 9.83 10.06 10.03 L 4.22 14.7 C 3.82 15.02 3.47 15.31 3.17 15.5 C 2.89 15.69 2.49 15.92 2 15.92 C 1.39 15.92 0.82 15.64 0.44 15.17 C 0.13 14.79 0.06 14.33 0.03 13.99 C -0 13.64 0 13.18 0 12.67 L 0 3.33 C 0 2.82 -0 2.36 0.03 2.01 C 0.06 1.67 0.13 1.21 0.44 0.83 C 0.82 0.36 1.39 0.08 2 0.08 Z M 2 12.67 C 2 13.22 2 13.57 2.02 13.81 C 2.02 13.83 2.03 13.84 2.03 13.86 C 2.04 13.85 2.06 13.84 2.07 13.83 C 2.27 13.7 2.54 13.48 2.97 13.14 L 8.81 8.47 C 9.09 8.24 9.25 8.12 9.36 8.01 C 9.37 8.01 9.37 8 9.37 8 C 9.37 8 9.37 7.99 9.36 7.99 C 9.25 7.88 9.09 7.76 8.81 7.53 L 2.97 2.86 C 2.54 2.52 2.27 2.3 2.07 2.17 C 2.06 2.16 2.04 2.15 2.03 2.14 C 2.03 2.16 2.02 2.17 2.02 2.19 C 2 2.43 2 2.78 2 3.33 L 2 12.67 Z" fill="currentColor" fillRule="nonzero" />
      </g>
    </svg>
  );
}

function ThumbsDownIcon() {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M15.4581 1V12M20.4581 8.8V4.2C20.4581 3.07989 20.4581 2.51984 20.2401 2.09202C20.0483 1.71569 19.7424 1.40973 19.366 1.21799C18.9382 1 18.3782 1 17.2581 1H6.57607C5.11459 1 4.38385 1 3.79364 1.26743C3.27346 1.50314 2.83136 1.88242 2.5193 2.36072C2.16523 2.90339 2.05412 3.62564 1.83189 5.07012L1.30881 8.47012C1.0157 10.3753 0.869152 11.3279 1.15186 12.0691C1.4 12.7197 1.86671 13.2637 2.47198 13.6079C3.16159 14 4.12539 14 6.053 14H6.85806C7.41811 14 7.69814 14 7.91205 14.109C8.10021 14.2049 8.25319 14.3578 8.34907 14.546C8.45806 14.7599 8.45806 15.0399 8.45806 15.6V18.5342C8.45806 19.896 9.56205 21 10.9239 21C11.2487 21 11.5431 20.8087 11.675 20.5119L15.0358 12.9502C15.1886 12.6062 15.265 12.4343 15.3859 12.3082C15.4926 12.1967 15.6238 12.1115 15.769 12.0592C15.9333 12 16.1215 12 16.4979 12H17.2581C18.3782 12 18.9382 12 19.366 11.782C19.7424 11.5903 20.0483 11.2843 20.2401 10.908C20.4581 10.4802 20.4581 9.9201 20.4581 8.8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ThumbsUpIcon() {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M6 21V10M1 12V19C1 20.1046 1.89543 21 3 21H16.4262C17.907 21 19.1662 19.9197 19.3914 18.4562L20.4683 11.4562C20.7479 9.6389 19.3418 8 17.5032 8H14C13.4477 8 13 7.55228 13 7V3.46584C13 2.10399 11.896 1 10.5342 1C10.2093 1 9.91498 1.1913 9.78306 1.48812L6.26394 9.40614C6.10344 9.76727 5.74532 10 5.35013 10H3C1.89543 10 1 10.8954 1 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const HEADER_ICON: Record<ResultBtmVariant, () => React.JSX.Element> = {
  Error: CloseIcon,
  Silence: CloseIcon,
  Success: CheckIcon,
  Partial: InfoCircleIcon,
};

/**
 * Figma `resultBtm` component set (variant: Success/Partial/Error/
 * Silence). The result sheet shown after a student answers — see the
 * component's Storybook docs for the full brief and known gaps.
 */
export function ResultBtm({
  variant = 'Error',
  onWhy,
  onContinue,
  onThumbsUp,
  onThumbsDown,
  onSkip,
  onReRecord,
  onTypeInstead,
  voiceState = 'Default',
  className,
  style,
}: ResultBtmProps) {
  const classes = className ? `${styles.sheet} ${className}` : styles.sheet;
  const HeaderIcon = HEADER_ICON[variant];

  return (
    <div className={classes} style={style} data-variant={variant}>
      <div className={styles.handle} />
      <div className={styles.appBar}>
        <div className={styles.topNav}>
          <div className={styles.textSection}>
            <div className={styles.iconBox} data-variant={variant}>
              <HeaderIcon />
            </div>
            <p className={styles.title}>{TITLE[variant]}</p>
          </div>
          <div className={styles.thumbs}>
            <button type="button" className={styles.thumbButton} onClick={onThumbsDown} aria-label="Thumbs down">
              <ThumbsDownIcon />
            </button>
            <button type="button" className={styles.thumbButton} onClick={onThumbsUp} aria-label="Thumbs up">
              <ThumbsUpIcon />
            </button>
          </div>
        </div>
      </div>

      {variant === 'Silence' && (
        <p className={styles.supportText}>No worries, this one doesn&apos;t count against you.</p>
      )}

      <div className={styles.bottomCta}>
        {variant === 'Silence' ? (
          <>
            <ButtonGroup variant="Horizontal" size="L">
              <ButtonIcon
                variant="Secondary"
                size="L"
                icon={<SkipIcon />}
                aria-label="Skip"
                className={styles.skipButton}
                onClick={onSkip}
              />
              <ButtonVoice
                state={voiceState}
                ctaText="Re-record"
                style={SILENCE_ACTION_COLOR}
                onClick={onReRecord}
              />
            </ButtonGroup>
            <Button variant="Secondary" size="L" style={SECONDARY_COLOR} onClick={onTypeInstead}>
              Try typing instead
            </Button>
          </>
        ) : (
          <ButtonGroup variant="Horizontal" size="L">
            <Button variant="Secondary" size="L" style={SECONDARY_COLOR} onClick={onWhy}>
              Why?
            </Button>
            <Button variant="Primary" size="L" style={ACTION_COLOR[variant]} onClick={onContinue}>
              Continue
            </Button>
          </ButtonGroup>
        )}
      </div>
    </div>
  );
}
