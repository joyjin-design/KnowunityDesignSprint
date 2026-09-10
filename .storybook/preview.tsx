import type { Preview } from '@storybook/nextjs-vite'
import '../build/css/tokens.css'
import './preview.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },

    // Only one background on offer, on purpose: this prototype is dark mode
    // only (see CLAUDE.md hard rules), so there is nothing to switch to.
    backgrounds: {
      options: {
        dark: { name: 'Dark', value: 'var(--color-background-page)' },
      },
    },

    // Component stories default to the 390px width this whole prototype is
    // designed at. Docs pages ignore this and always render at full width
    // (that's Storybook's own built-in behavior, not something set here).
    viewport: {
      options: {
        mobile390: {
          name: 'Mobile (390px)',
          styles: { width: '390px', height: '844px' },
          type: 'mobile',
        },
      },
    },
  },

  initialGlobals: {
    backgrounds: { value: 'dark' },
    viewport: { value: 'mobile390', isRotated: false },
  },
};

export default preview;