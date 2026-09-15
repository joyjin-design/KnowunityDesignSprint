'use client';

import { Button } from '@/app/components/Button';
import { ButtonGroup } from '@/app/components/ButtonGroup';
import { BottomSheet } from '@/app/components/BottomSheet';
import { BottomSheetAppBar } from '@/app/components/BottomSheetAppBar';
import { MascotSlot } from '@/app/components/MascotSlot';
import { Screen, type ScreenProps } from '@/app/components/Screen';
import { TextBlock } from '@/app/components/TextBlock';
import styles from './GateScreen.module.css';

export type GateState = 'firstTime' | 'permissionSheetOpen' | 'afterDenial';

export interface GateScreenProps {
  /** Figma parity in Storybook; the app passes false on the test iPhone. */
  showStatusBar?: ScreenProps['showStatusBar'];
  state?: GateState;
  /** firstTime only → opens the permission sheet. */
  onTurnOnMicrophone?: () => void;
  /** Every state → 01Exam. */
  onCantTalk?: () => void;
  /** permissionSheetOpen only → the real iOS prompt. */
  onAllow?: () => void;
  /** permissionSheetOpen only → closes the sheet, back to the gate. */
  onDontAllow?: () => void;
  /** afterDenial only → checks permission again. */
  onIveTurnedOnMic?: () => void;
}

const SETTINGS_CAPTION = 'Open Settings, find Voice recall, then turn on Microphone.';

/**
 * SPEC.md screen 6: the full-screen mic primer. Figma 13575:1934 ("gate
 * alone") and 13555:8294 ("gate with its permission sheet open") — both in
 * the first-run section.
 */
export function GateScreen({
  showStatusBar = true,
  state = 'firstTime',
  onTurnOnMicrophone,
  onCantTalk,
  onAllow,
  onDontAllow,
  onIveTurnedOnMic,
}: GateScreenProps) {
  const deniedBefore = state === 'afterDenial';
  const sheetOpen = state === 'permissionSheetOpen';

  return (
    <Screen
      showStatusBar={showStatusBar}
      showBottomSheetBackground={sheetOpen}
      middleContent={
        <div className={styles.content}>
          <TextBlock
            className={styles.textBlock}
            variant="L"
            title="Say it, don't just tap it"
            caption={
              deniedBefore
                ? SETTINGS_CAPTION
                : "Tap Start and explain it out loud, in your own words. Tap Stop when you're done. Knowie's listening for what you know, not perfect grammar."
            }
          />
        </div>
      }
      bottomContent={
        <div className={styles.bottomContent}>
          <MascotSlot className={styles.mascot} size="2XL" expression="approving" />
          <div className={styles.buttons}>
            <ButtonGroup variant="Vertical" size="L">
              {deniedBefore ? (
                <Button variant="Primary" size="L" onClick={onIveTurnedOnMic}>
                  I&apos;ve turned on the mic
                </Button>
              ) : (
                <Button variant="Primary" size="L" onClick={onTurnOnMicrophone}>
                  Turn on microphone
                </Button>
              )}
              <Button variant="Secondary" size="L" onClick={onCantTalk}>
                Can&apos;t talk right now
              </Button>
            </ButtonGroup>
          </div>
        </div>
      }
      bottomSheetOnly={
        sheetOpen ? (
          <BottomSheet
            aria-label="Allow microphone access?"
            appBar={
              <BottomSheetAppBar
                variant="withTitle"
                title="Allow microphone access?"
                caption="Knowie needs this to hear you explain answers out loud."
                showCaption
              />
            }
            bottomSection={
              <div className={styles.sheetButtons}>
                <ButtonGroup variant="Vertical" size="L">
                  <Button variant="Primary" size="L" onClick={onAllow}>
                    Allow
                  </Button>
                  <Button variant="Secondary" size="L" onClick={onDontAllow}>
                    Don&apos;t allow
                  </Button>
                </ButtonGroup>
              </div>
            }
          />
        ) : undefined
      }
    />
  );
}
