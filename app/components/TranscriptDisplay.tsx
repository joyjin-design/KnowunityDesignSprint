'use client';

import type { CSSProperties } from 'react';
import styles from './TranscriptDisplay.module.css';

export type TranscriptDisplayState = 'Empty' | 'Filled' | 'Overflow' | 'Silence';

const EMPTY_COPY = "I'm listening. Feel free to say your answer out loud";
const SILENCE_COPY = "Sorry, I didn't catch that. Can you repeat?";
const FILLED_DEMO = 'Mitochondria is a cell.. em.';
const OVERFLOW_DEMO =
  "Mitochondria is the powerhouse of the cell, it converts glucose and oxygen into ATP through cellular respiration, which the cell then uses as energy for basically everything it does, like moving stuff around and building proteins and dividing. It also has its own DNA separate from the nucleus, which is one of the reasons scientists think it used to be a free living bacteria that got absorbed by a bigger cell a really long time ago, and the two of them just started working together instead of one eating the other, that's the endosymbiotic theory. Every cell has a different number of them depending on how much energy that part of the body needs, so muscle cells and heart cells have way more than something like a skin cell.";

export interface TranscriptDisplayProps {
  state?: TranscriptDisplayState;
  /**
   * Not a real exposed Figma property — Empty and Silence are fixed system
   * copy there and stay fixed here too. Filled and Overflow are meant to
   * hold the student's actual spoken transcript, so this is added ahead of
   * Figma's own interface rather than hardcoding demo text into the real
   * component. Ignored for Empty/Silence. Defaults to Figma's own demo
   * copy for Filled/Overflow when omitted.
   */
  transcript?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Figma `transcriptDisplay` component set (state: Empty/Filled/Overflow/
 * Silence). The live and post-recording transcript surface inside the
 * recall loop's middle content — see the component's Storybook docs for
 * the full brief and known gaps.
 */
export function TranscriptDisplay({ state = 'Empty', transcript, className, style }: TranscriptDisplayProps) {
  const content =
    state === 'Empty'
      ? EMPTY_COPY
      : state === 'Silence'
        ? SILENCE_COPY
        : state === 'Filled'
          ? (transcript ?? FILLED_DEMO)
          : (transcript ?? OVERFLOW_DEMO);

  if (state === 'Overflow') {
    const wrapperClasses = className ? `${styles.overflowWrapper} ${className}` : styles.overflowWrapper;
    return (
      <div className={wrapperClasses} style={style}>
        <p className={styles.transcript} data-state={state}>
          {content}
        </p>
      </div>
    );
  }

  const classes = className ? `${styles.transcript} ${className}` : styles.transcript;
  return (
    <p className={classes} style={style} data-state={state}>
      {content}
    </p>
  );
}
