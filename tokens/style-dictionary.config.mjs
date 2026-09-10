export default {
  source: ['tokens/tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      transforms: ['name/kebab', 'color/css', 'size/px', 'fontFamily/css', 'typography/css/shorthand'],
      buildPath: 'build/css/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
            fileHeader: () => [
              'GENERATED FILE — DO NOT EDIT BY HAND.',
              'Source of truth is tokens/tokens.json.',
              'Regenerate with `npm run tokens`.',
            ],
          },
        },
      ],
    },
  },
};
