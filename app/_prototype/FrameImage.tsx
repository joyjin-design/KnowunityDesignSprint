'use client';

import Image from 'next/image';
import { useRef, type ReactNode } from 'react';
import { FRAME_SIZE, type PrototypeFrame, type ZoneId } from './frames';
import styles from './FrameImage.module.css';

/** How quickly repeated taps must follow each other to count together. */
const MULTI_TAP_WINDOW_MS = 500;

export interface FrameImageProps {
  frame: PrototypeFrame;
  onZone?: (zone: ZoneId) => void;
  /** Kept mounted but not shown, so the next frame is already loaded. */
  hidden?: boolean;
  /**
   * A real, live component composited over the still export (02Hint-animate's
   * animated Knowie) — not part of the exported image itself. Rendered after
   * the tap zones, inside the same `hidden`-toggled wrapper, so its CSS
   * animations restart every time this frame becomes current again.
   */
  children?: ReactNode;
}

/**
 * An exported Figma frame with invisible tap zones over it. Prototype
 * scaffolding for SPEC.md screen 3, not a design-system component.
 */
export function FrameImage({ frame, onZone, hidden, children }: FrameImageProps) {
  const taps = useRef<{ zone: ZoneId | null; count: number; last: number }>({ zone: null, count: 0, last: 0 });

  function handleTap(zone: ZoneId, needed: number, now: number) {
    const t = taps.current;
    const inSequence = t.zone === zone && now - t.last < MULTI_TAP_WINDOW_MS;
    t.count = inSequence ? t.count + 1 : 1;
    t.zone = zone;
    t.last = now;
    if (t.count >= needed) {
      t.count = 0;
      onZone?.(zone);
    }
  }

  return (
    <div className={styles.frame} hidden={hidden} data-frame={frame.id}>
      {/* The positioned ancestor for the image, tap zones and any overlay
          (badge/arrow) children — deliberately not `.frame` itself. A CSS
          `position: absolute` child's containing block is its ancestor's
          padding edge, which sits at the ancestor's border-box top regardless
          of how much padding-top that ancestor has — so if these children
          were positioned against `.frame` directly, `.frame`'s own
          safe-area padding-top (below) would shift the image down without
          shifting them, misaligning both by the safe-area inset on a real
          phone (invisible in Storybook, where the inset is 0). Nesting them
          in their own wrapper that starts right where the image starts
          keeps every image-relative coordinate correct in both places. */}
      <div className={styles.content}>
        {/* Served as exported (3×): recompressing would blur the UI text. */}
        <Image
          className={styles.image}
          src={frame.src}
          alt={frame.alt}
          width={FRAME_SIZE.width}
          height={FRAME_SIZE.height}
          loading="eager"
          unoptimized
        />
        {frame.zones.map((zone) => {
          const [x, y, w, h] = zone.box;
          return (
            <button
              key={zone.id}
              type="button"
              className={styles.zone}
              aria-label={zone.label}
              data-zone={zone.id}
              style={{
                left: `${(x / FRAME_SIZE.width) * 100}%`,
                top: `${(y / FRAME_SIZE.height) * 100}%`,
                width: `${(w / FRAME_SIZE.width) * 100}%`,
                height: `${(h / FRAME_SIZE.height) * 100}%`,
              }}
              onClick={(event) => handleTap(zone.id, zone.taps ?? 1, event.timeStamp)}
            />
          );
        })}
        {children}
      </div>
    </div>
  );
}
