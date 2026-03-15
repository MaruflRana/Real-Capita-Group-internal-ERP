import js from '@eslint/js';
import nx from '@nx/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

const boundaryOptions = {
  allow: ['^.*/eslint\\.config\\.[cm]?[jt]s$'],
  enforceBuildableLibDependency: true,
  depConstraints: [
    {
      sourceTag: 'type:app',
      onlyDependOnLibsWithTags: [
        'type:config',
        'type:types',
        'type:ui',
        'type:domain',
        'type:data-access',
        'type:feature',
        'type:tooling',
      ],
    },
    {
      sourceTag: 'type:ui',
      onlyDependOnLibsWithTags: ['type:ui', 'type:types', 'type:config'],
    },
    {
      sourceTag: 'type:types',
      onlyDependOnLibsWithTags: ['type:types'],
    },
    {
      sourceTag: 'type:config',
      onlyDependOnLibsWithTags: ['type:config', 'type:types'],
    },
    {
      sourceTag: 'type:tooling',
      onlyDependOnLibsWithTags: ['type:tooling', 'type:config', 'type:types'],
    },
    {
      sourceTag: 'scope:web',
      onlyDependOnLibsWithTags: ['scope:web', 'scope:shared'],
    },
    {
      sourceTag: 'scope:api',
      onlyDependOnLibsWithTags: ['scope:api', 'scope:shared'],
    },
    {
      sourceTag: 'platform:web',
      onlyDependOnLibsWithTags: ['platform:web', 'platform:neutral'],
    },
    {
      sourceTag: 'platform:server',
      onlyDependOnLibsWithTags: ['platform:server', 'platform:neutral'],
    },
  ],
};

export default [
  ...nx.configs['flat/base'],
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  eslintConfigPrettier,
  {
    ignores: [
      '**/dist',
      '**/coverage',
      '**/.next',
      '**/out-tsc',
      '**/node_modules',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    rules: {
      '@nx/enforce-module-boundaries': ['error', boundaryOptions],
    },
  },
  {
    files: ['**/eslint.config.mjs'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
];
