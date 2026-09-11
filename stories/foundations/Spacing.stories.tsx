import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getSpacingScale, type FoundationToken } from './tokens-data';
import { FoundationPage, FoundationSection } from './FoundationPage';

function SpacingBar({ token, negative = false }: { token: FoundationToken; negative?: boolean }) {
  const width = Math.abs(parseFloat(token.resolvedValue));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-space-400)' }}>
      <div
        style={{
          width,
          minWidth: negative ? 1 : 0,
          height: 'var(--size-icon-100)',
          flexShrink: 0,
          borderRadius: 'var(--size-radius-100)',
          background: negative ? 'transparent' : 'var(--color-interactive-primary)',
          border: negative ? '1px dashed var(--color-interactive-primary)' : 'none',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ font: 'var(--font-greed-caption-m-bold)' }}>
          {token.name} — {token.resolvedValue}
        </span>
        <span style={{ font: 'var(--font-greed-caption-s-regular)', color: 'var(--color-text-secondary)' }}>
          {token.description}
        </span>
      </div>
    </div>
  );
}

function SpacingFoundation() {
  const { positive, negative } = getSpacingScale();
  return (
    <FoundationPage
      title="Spacing"
      intro="size.space from tokens/tokens.json, as bars sized to the real token width in ascending order. Negative values (used for negative margins, not gaps) can't be drawn as a negative-width bar, so they're shown dashed at their absolute width and listed separately below."
    >
      <FoundationSection heading="Spacing scale" layout="stack">
        {positive.map((token) => (
          <SpacingBar key={token.name} token={token} />
        ))}
      </FoundationSection>
      <FoundationSection heading="Negative spacing" layout="stack">
        {negative.map((token) => (
          <SpacingBar key={token.name} token={token} negative />
        ))}
      </FoundationSection>
    </FoundationPage>
  );
}

const meta = {
  title: 'Foundations/Spacing',
  component: SpacingFoundation,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SpacingFoundation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
