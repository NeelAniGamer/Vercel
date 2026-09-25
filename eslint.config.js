import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2024,
      },
      ecmaVersion: 2024,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'warn',
      'eqeqeq': ['warn', 'always', { null: 'ignore' }],
      'curly': ['warn', 'all'],
      'no-case-declarations': 'off',
      'no-empty': 'off',
      'no-func-assign': 'off',
      'no-undef': 'off',
      'eqeqeq': ['warn', 'always', { null: 'ignore' }],
      'no-fallthrough': 'off',
      'no-cond-assign': 'off',
      'no-prototype-builtins': 'off',
      'no-constant-condition': 'off',
      'no-control-regex': 'off',
      'no-dupe-keys': 'warn',
      'no-useless-escape': 'off',
      'no-var': 'off',
      'no-cond-assign': 'off',
      'no-prototype-builtins': 'off',
      'no-dupe-keys': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'dist-electron/**',
      'dist-web/**',
      'traffic-ts/**',
      'react-src/**',
      '*.ts',
      '*.tsx',
      '*.d.ts',
    ],
  },
];