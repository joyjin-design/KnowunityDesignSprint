import { addons } from 'storybook/manager-api';

// Screens (app/screens/*.stories.tsx) are exam-plan prototype flows, not
// design-system components — kept out of the published sidebar so the
// Chromatic link reads as a component library, not a prototype walkthrough.
// Direct story/docs URLs still work and the stories still index for
// test-run/Chromatic snapshots (sidebar.filters only affects the tree UI).
addons.setConfig({
  sidebar: {
    filters: {
      patterns: (item) => !(item.title ?? '').startsWith('Screens/'),
    },
  },
});
