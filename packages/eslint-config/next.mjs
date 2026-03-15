import nextPlugin from '@next/eslint-plugin-next';

import reactConfig from './react.mjs';

export default [
  { plugins: { '@next/next': nextPlugin } },
  ...reactConfig,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@api/*'],
              message:
                'Frontend code must consume the NestJS API over HTTP instead of importing backend modules directly.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "Program > ExpressionStatement[directive='use server']",
          message:
            'Server actions are not allowed in the web app. Route business operations through the NestJS REST API.',
        },
      ],
    },
  },
  {
    ignores: ['.next/**/*'],
  },
];
