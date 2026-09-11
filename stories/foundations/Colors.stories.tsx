import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getSemanticColorGroups } from './tokens-data';
import { FoundationPage, FoundationSection, TokenCard } from './FoundationPage';

function ColorsFoundation() {
  const groups = getSemanticColorGroups();
  return (
    <FoundationPage
      title="Colors"
      intro="Semantic color tokens from tokens/tokens.json, grouped the way the file itself groups them (every semantic group under color, excluding the raw primitive palettes). Each swatch is filled through the real generated CSS custom property in build/css/tokens.css, not a hardcoded hex value."
    >
      {groups.map(({ group, tokens }) => (
        <FoundationSection key={group} heading={group}>
          {tokens.map((token) => (
            <TokenCard
              key={token.name}
              token={token}
              demo={
                <div
                  style={{
                    width: 'var(--size-illustration-800)',
                    height: 'var(--size-illustration-800)',
                    borderRadius: 'var(--size-radius-200)',
                    border: '1px solid var(--color-border-default)',
                    background: `var(${token.cssVar})`,
                  }}
                />
              }
            />
          ))}
        </FoundationSection>
      ))}
    </FoundationPage>
  );
}

const meta = {
  title: 'Foundations/Colors',
  component: ColorsFoundation,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ColorsFoundation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
