import { addons } from 'storybook/manager-api';

// Screens (app/screens/*.stories.tsx) and Prototype (app/_prototype/, the
// joined-up running flow) are prototype walkthroughs, not design-system
// components — kept out of the published sidebar so the Chromatic link reads
// as a component library.
// Direct story/docs URLs still work and the stories still index for
// test-run/Chromatic snapshots (sidebar.filters only affects the tree UI).
addons.setConfig({
  sidebar: {
    filters: {
      patterns: (item) => {
        const title = item.title ?? '';
        return !title.startsWith('Screens/') && !title.startsWith('Prototype/');
      },
    },
  },
});
