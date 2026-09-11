import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRadiusScale } from './tokens-data';
import { FoundationPage, FoundationSection, TokenCard } from './FoundationPage';

function RadiusFoundation() {
  const tokens = getRadiusScale();
  return (
    <FoundationPage
      title="Radius"
      intro="size.radius from tokens/tokens.json, ascending. Every box is the same fixed size so the change in roundness is the only thing that varies between cards."
    >
      <FoundationSection heading="Radius scale">
        {tokens.map((token) => (
          <TokenCard
            key={token.name}
            token={token}
            demo={
              <div
                style={{
                  width: 'var(--size-illustration-800)',
                  height: 'var(--size-illustration-800)',
                  background: 'var(--color-interactive-secondary)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: `var(${token.cssVar})`,
                }}
              />
            }
          />
        ))}
      </FoundationSection>
    </FoundationPage>
  );
}

const meta = {
  title: 'Foundations/Radius',
  component: RadiusFoundation,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof RadiusFoundation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
