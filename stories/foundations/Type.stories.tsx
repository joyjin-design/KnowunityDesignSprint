import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getTextStyles, NO_DESCRIPTION } from './tokens-data';
import { FoundationPage, FoundationSection } from './FoundationPage';

function TypeFoundation() {
  const styles = getTextStyles();
  return (
    <FoundationPage
      title="Type"
      intro={
        'Every named text style under font.Greed in tokens/tokens.json, largest to smallest (the order already ' +
        'authored in the file), each rendered with its real generated CSS shorthand (--font-greed-*). The family ' +
        'is Inter Variable, self-hosted from @fontsource-variable/inter, not Figma’s Greed: Greed had no webfont ' +
        'in this project, so it only rendered on machines with it installed. The style names still say Greed.'
      }
    >
      <FoundationSection heading="Text styles" layout="stack">
        {styles.map((token) => (
          <div
            key={token.name}
            style={{
              background: 'var(--color-background-surface)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--size-radius-200)',
              padding: 'var(--size-space-400)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--size-space-200)',
            }}
          >
            <div style={{ font: `var(${token.cssVar})` }}>{token.name}</div>
            <div
              style={{
                font: 'var(--font-greed-caption-m-regular)',
                color: 'var(--color-text-secondary)',
                fontStyle: token.description === NO_DESCRIPTION ? 'italic' : 'normal',
              }}
            >
              {token.description}
            </div>
          </div>
        ))}
      </FoundationSection>
    </FoundationPage>
  );
}

const meta = {
  title: 'Foundations/Type',
  component: TypeFoundation,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TypeFoundation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
