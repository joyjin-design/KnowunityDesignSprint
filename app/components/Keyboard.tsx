'use client';

import type { CSSProperties } from 'react';
import styles from './Keyboard.module.css';

export type KeyboardType = 'Default' | 'Search' | 'Numbers' | 'Emoji';

const LETTER_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

const NUMBER_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
  ['.', ',', '?', '!', "'"],
];

const EMOJI = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
  '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
  '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
];

const SUGGESTIONS = ['I', 'The', "I'm"];

function ShiftGlyph() {
  return (
    <svg className={styles.glyph} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.2 3.6 11.6a1 1 0 0 0 .7 1.7H8v5.5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-5.5h3.7a1 1 0 0 0 .7-1.7L12 3.2Z" />
    </svg>
  );
}

function DeleteGlyph() {
  return (
    <svg className={styles.glyph} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.4 4.5a1.6 1.6 0 0 0-1.2.55L2.5 11a1.5 1.5 0 0 0 0 2l4.7 5.95a1.6 1.6 0 0 0 1.2.55H20a1.6 1.6 0 0 0 1.6-1.6V6.1A1.6 1.6 0 0 0 20 4.5H8.4Zm2.9 4.1L13.6 11l2.3-2.4 1.4 1.45L15 12.4l2.3 2.35-1.4 1.45-2.3-2.4-2.3 2.4-1.4-1.45 2.3-2.35-2.3-2.35 1.4-1.45Z" />
    </svg>
  );
}

/** The send arrow on the blue key. The real screen uses this, not a return glyph. */
function SendGlyph() {
  return (
    <svg className={styles.glyph} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.6 20.2 11.8l-1.5 1.5-5.6-5.6V20.4h-2.2V7.7l-5.6 5.6-1.5-1.5L12 3.6Z" />
    </svg>
  );
}

function SmileyGlyph() {
  return (
    <svg className={styles.glyph} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16ZM8.8 8.4a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Zm6.4 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6ZM6.9 13.7a5.4 5.4 0 0 0 10.2 0H6.9Z" />
    </svg>
  );
}

function GlobeGlyph() {
  return (
    <svg className={styles.accessoryIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-2.85a15.6 15.6 0 0 0-1.35-3.6A8.05 8.05 0 0 1 18.9 8ZM12 4.1c.62.9 1.3 2.2 1.75 3.9h-3.5C10.7 6.3 11.38 5 12 4.1ZM4.25 14a8 8 0 0 1 0-4h3.3a17 17 0 0 0 0 4h-3.3Zm.85 2h2.85c.32 1.28.78 2.5 1.35 3.6A8.05 8.05 0 0 1 5.1 16Zm2.85-8H5.1a8.05 8.05 0 0 1 4.2-3.6A15.6 15.6 0 0 0 7.95 8ZM12 19.9c-.62-.9-1.3-2.2-1.75-3.9h3.5c-.45 1.7-1.13 3-1.75 3.9Zm2.15-5.9h-4.3a15.3 15.3 0 0 1 0-4h4.3a15.3 15.3 0 0 1 0 4Zm.55 5.6c.57-1.1 1.03-2.32 1.35-3.6h2.85a8.05 8.05 0 0 1-4.2 3.6Zm1.75-5.6a17 17 0 0 0 0-4h3.3a8 8 0 0 1 0 4h-3.3Z" />
    </svg>
  );
}

function MicGlyph() {
  return (
    <svg className={styles.accessoryIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM6 11a1 1 0 0 0-2 0 8 8 0 0 0 7 7.94V21H8.5a1 1 0 0 0 0 2h7a1 1 0 0 0 0-2H13v-2.06A8 8 0 0 0 20 11a1 1 0 0 0-2 0 6 6 0 0 1-12 0Z" />
    </svg>
  );
}

export interface KeyboardProps {
  /**
   * Mirrors the `Type` axis on Figma's `Keyboard` component set, with the
   * same four options. Note this is the one component in the library whose
   * axis isn't `variant`/`size`/`state` — the axis belongs to Apple's kit,
   * not to this design system, and renaming it would break the mapping back
   * to Figma.
   */
  type?: KeyboardType;
  className?: string;
  style?: CSSProperties;
}

/**
 * A static picture of the iOS keyboard, for prototype screens only. Not a
 * design-system component and not a real input — see the component's
 * Storybook docs before reaching for it.
 */
export function Keyboard({ type = 'Default', className, style }: KeyboardProps) {
  const classes = className ? `${styles.keyboard} ${className}` : styles.keyboard;
  const isNumbers = type === 'Numbers';
  const rows = isNumbers ? NUMBER_ROWS : LETTER_ROWS;

  // Figma's Numbers variant is 24px shorter than Default — exactly this row
  // plus the padding under it.
  const showSuggestions = type === 'Default' || type === 'Search';

  return (
    <div className={classes} style={style} data-type={type} aria-hidden="true">
      {showSuggestions && (
        <div className={styles.suggestions}>
          {SUGGESTIONS.flatMap((word, i) =>
            i === 0
              ? [
                  <span key={word} className={styles.suggestion}>
                    {word}
                  </span>,
                ]
              : [
                  <span key={`sep-${word}`} className={styles.separator} />,
                  <span key={word} className={styles.suggestion}>
                    {word}
                  </span>,
                ],
          )}
        </div>
      )}

      {type === 'Emoji' ? (
        <>
          <div className={styles.emojiGrid}>
            {EMOJI.map((glyph) => (
              <span key={glyph} className={styles.emojiCell}>
                {glyph}
              </span>
            ))}
          </div>
          <div className={styles.keys}>
            <div className={styles.row}>
              <span className={styles.key} data-key="switch">
                ABC
              </span>
              <span className={styles.key} />
              <span className={styles.key} data-key="wide">
                <DeleteGlyph />
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.keys}>
          <div className={styles.row}>
            {rows[0].map((k) => (
              <span key={k} className={styles.key}>
                {k}
              </span>
            ))}
          </div>

          <div className={styles.row} data-row="home">
            {rows[1].map((k) => (
              <span key={k} className={styles.key}>
                {k}
              </span>
            ))}
          </div>

          <div className={styles.row}>
            <span className={styles.key} data-key="wide">
              {isNumbers ? '#+=' : <ShiftGlyph />}
            </span>
            {rows[2].map((k) => (
              <span key={k} className={styles.key}>
                {k}
              </span>
            ))}
            <span className={styles.key} data-key="wide">
              <DeleteGlyph />
            </span>
          </div>

          {/* Four keys, matching the real screen: the emoji key sits between
              the 123 switch and the space bar, which is why the accessory row
              below carries the globe rather than a second smiley. */}
          <div className={styles.row}>
            <span className={styles.key} data-key="switch">
              {isNumbers ? 'ABC' : '123'}
            </span>
            <span className={styles.key} data-key="smiley">
              <SmileyGlyph />
            </span>
            <span className={styles.key} data-key="space">
              space
            </span>
            <span className={styles.key} data-key="send">
              {type === 'Search' ? 'search' : <SendGlyph />}
            </span>
          </div>
        </div>
      )}

      {type !== 'Emoji' && (
        <div className={styles.accessoryRow}>
          <GlobeGlyph />
          <MicGlyph />
        </div>
      )}
    </div>
  );
}
