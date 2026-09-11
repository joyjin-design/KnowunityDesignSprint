import type { ReactNode } from 'react';
import { NO_DESCRIPTION, type FoundationToken } from './tokens-data';

export function FoundationPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--color-background-page)',
        color: 'var(--color-text-primary)',
        minHeight: '100vh',
        padding: 'var(--size-space-800)',
      }}
    >
      <h1 style={{ font: 'var(--font-greed-display-s)', margin: 0 }}>{title}</h1>
      {intro && (
        <p
          style={{
            font: 'var(--font-greed-body-m-regular)',
            color: 'var(--color-text-secondary)',
            maxWidth: 640,
            marginTop: 'var(--size-space-200)',
            marginBottom: 0,
          }}
        >
          {intro}
        </p>
      )}
      <div style={{ marginTop: 'var(--size-space-1200)' }}>{children}</div>
    </div>
  );
}

export function FoundationSection({
  heading,
  layout = 'grid',
  children,
}: {
  heading: string;
  layout?: 'grid' | 'stack';
  children: ReactNode;
}) {
  return (
    <section style={{ marginBottom: 'var(--size-space-1200)' }}>
      <h2
        style={{
          font: 'var(--font-greed-headline-s)',
          margin: 0,
          marginBottom: 'var(--size-space-400)',
          textTransform: 'capitalize',
        }}
      >
        {heading}
      </h2>
      <div
        style={{
          display: 'flex',
          flexDirection: layout === 'stack' ? 'column' : 'row',
          flexWrap: layout === 'grid' ? 'wrap' : 'nowrap',
          gap: 'var(--size-space-400)',
        }}
      >
        {children}
      </div>
    </section>
  );
}

export function TokenCard({ token, demo }: { token: FoundationToken; demo: ReactNode }) {
  const hasDescription = token.description !== NO_DESCRIPTION;
  return (
    <div
      style={{
        background: 'var(--color-background-surface)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--size-radius-200)',
        padding: 'var(--size-space-300)',
        width: 240,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--size-space-200)',
      }}
    >
      {demo}
      <div style={{ font: 'var(--font-greed-caption-m-bold)' }}>{token.name}</div>
      <div style={{ font: 'var(--font-greed-caption-m-regular)', color: 'var(--color-text-secondary)' }}>
        {token.resolvedValue}
      </div>
      <div
        style={{
          font: 'var(--font-greed-caption-s-regular)',
          color: 'var(--color-text-secondary)',
          fontStyle: hasDescription ? 'normal' : 'italic',
        }}
      >
        {token.description}
      </div>
    </div>
  );
}
