// @ts-check

import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist', 'node_modules']
  },
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module'
      }
    }
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off'
    }
  }
];
