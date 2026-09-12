'use client';

import { useId, useLayoutEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { ButtonIcon } from './ButtonIcon';
import styles from './AnswerInput.module.css';

export type AnswerInputState = 'Empty' | 'Filled' | 'Focused' | 'Error' | 'Disabled';

const PLACEHOLDER = 'Type your answer…';

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="100%" height="100%">
      <path
        d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM6 11a1 1 0 0 0-2 0 8 8 0 0 0 7 7.94V21H8.5a1 1 0 0 0 0 2h7a1 1 0 0 0 0-2H13v-2.06A8 8 0 0 0 20 11a1 1 0 0 0-2 0 6 6 0 0 1-12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="100%" height="100%">
      <path
        d="M4.4 3.1 21 12 4.4 20.9a1 1 0 0 1-1.45-1.1L4.8 13.2 14 12l-9.2-1.2-1.85-6.6a1 1 0 0 1 1.45-1.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

export interface AnswerInputProps {
  /**
   * Ahead of Figma's own interface — no input component exists in the file
   * yet, so this axis is defined here first, using `state` because that's the
   * axis `transcriptDisplay` already uses for the same kind of surface.
   * `Focused` and `Disabled` are presentational only; real focus is still the
   * browser's, and `Disabled` also disables the control.
   */
  state?: AnswerInputState;
  value?: string;
  onChange?: (value: string) => void;
  onSend?: () => void;
  /**
   * The way back to voice. This is the text fallback's own escape hatch — the
   * student who tapped "Try typing instead" by mistake shouldn't be stuck in
   * a modality they didn't want.
   */
  onUseVoice?: () => void;
  /** Shown under the bar when `state` is `Error`. */
  hint?: string;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * The typed-answer bar for the recall loop's text fallback. Modelled on the
 * "Ask Knowie…" bar in the shipped beta — see the component's Storybook docs.
 */
export function AnswerInput({
  state = 'Empty',
  value,
  onChange,
  onSend,
  onUseVoice,
  hint,
  placeholder = PLACEHOLDER,
  className,
  style,
}: AnswerInputProps) {
  const hintId = useId();
  const classes = className ? `${styles.bar} ${className}` : styles.bar;
  const disabled = state === 'Disabled';
  const showHint = state === 'Error' && Boolean(hint);

  // Works controlled or not. The send/mic swap used to read `value` directly,
  // so when nothing passed `value` in — i.e. anyone just typing into the
  // prototype — it stayed empty and send never appeared. The field now keeps
  // its own draft and only defers to `value` when one is given.
  const [draft, setDraft] = useState('');
  const text = value ?? draft;

  // Sending an empty answer would post silence as the student's response,
  // which is the one thing the Silence sheet exists to recover from.
  const canSend = !disabled && Boolean(text.trim());

  // Grow one line at a time, then scroll. A `rows={1}` textarea never grows on
  // its own, and the CSS `max-height` only caps it — so the height is
  // re-measured from `scrollHeight` whenever the text changes, and the CSS cap
  // (four lines of Body M) takes over from there, handing off to
  // `overflow-y: auto`. Resetting to `auto` first is what lets it shrink back
  // when text is deleted. Not `field-sizing: content`: that would do this in
  // one CSS line, but Safari doesn't support it, and this is an iOS prototype.
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fitToContent = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };
  useLayoutEffect(fitToContent, [text]);

  return (
    <div>
      <div className={classes} style={style} data-state={state}>
        <div className={styles.field}>
          <textarea
            ref={inputRef}
            className={styles.input}
            rows={1}
            value={text}
            placeholder={placeholder}
            disabled={disabled}
            aria-label="Your answer"
            aria-invalid={state === 'Error' || undefined}
            aria-describedby={showHint ? hintId : undefined}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
              if (value === undefined) setDraft(e.target.value);
              onChange?.(e.target.value);
            }}
          />

          {/* Empty rests on the mic, so the way back to voice is the visible
              affordance until there's actually something to send. Once the
              student has typed, send takes that slot rather than sitting
              beside it — two trailing buttons in a pill this size crowd the
              text, and sending is unambiguously the next action by then. */}
          <div className={styles.actions}>
            {canSend ? (
              <ButtonIcon
                variant="Primary"
                size="S"
                icon={<SendIcon />}
                aria-label="Send answer"
                onClick={onSend}
              />
            ) : (
              <ButtonIcon
                variant="Tertiary"
                size="S"
                icon={<MicIcon />}
                aria-label="Answer with voice instead"
                disabled={disabled}
                onClick={onUseVoice}
              />
            )}
          </div>
        </div>
      </div>

      {showHint && (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}
