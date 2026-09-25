import js from '@eslint/js';
import globals from 'globals';

const sharedGlobals = {
  ...globals.browser,
  ...globals.node,
  ...globals.es2024,
  // Injected by the Qt WebEngine host when logic.js is embedded. Guarded with
  // `typeof` at the call site, so they are declared globals, not typos.
  QWebChannel: 'readonly',
  qt: 'readonly',
};

export default [
  {
    // Only first-party runtime and tooling code is linted. Everything else in
    // the repo is generated, vendored, or local agent tooling, and linting it
    // produced thousands of findings that were never actionable.
    ignores: [
      'node_modules/**',
      'dist/**',
      'Traffic/dist/**',
      'Traffic/dist-web/**',
      'Traffic/dist-electron/**',
      'Terra3D/dist/**',
      // Local agent skill libraries. Untracked, not shipped, not ours to fix.
      '.agents/**',
      '.opencode/**',
      '.codex/**',
      '.superpowers/**',
      'Traffic/.agents/**',
      // The TypeScript port is not wired to the runtime; tsc covers it.
      'Traffic/src/**',
      // The old unowned reference library. Copied raw by build.js.
      'traffic-ts/**',
      // TypeScript is covered by tsc, not ESLint's JS parser.
      '**/*.ts',
      '**/*.tsx',
      'react-src/**',
      // Terra3D is a separate standalone Vite app with its own build.
      'Terra3D/**',
      // Vendored third-party runtime code, shipped as-is.
      '**/three.js',
      '**/OBJLoader.js',
      'Traffic/libs/**',
      'assets/js/**',
      'supabase.js',
      '**/*.min.js',
      'glass-bundle.js',
      // React sources are bundled by esbuild; tsc covers their types.
      '**/*.jsx',
    ],
  },

  js.configs.recommended,

  {
    // ES modules: this config, and logic.js which engine.html loads with
    // <script type="module">.
    files: ['eslint.config.js', 'logic.js'],
    languageOptions: {
      sourceType: 'module',
      globals: sharedGlobals,
    },
  },
  {
    // Everything else that is actually ours is a classic script.
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ignores: ['eslint.config.js', 'logic.js'],
    languageOptions: {
      globals: sharedGlobals,
      ecmaVersion: 2024,
      sourceType: 'commonjs',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'warn',
      'eqeqeq': ['warn', 'always', { null: 'ignore' }],
      'curly': ['warn', 'all'],
      // The Traffic engine predates most of these and uses empty catch blocks
      // as an intentional "optional subsystem not present" guard.
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-fallthrough': 'off',
      'no-cond-assign': 'off',
      'no-useless-assignment': 'warn',
      'no-control-regex': 'off',
      'no-prototype-builtins': 'off',
      'no-dupe-keys': 'warn',
      'no-unused-expressions': 'off',
      // These are dynamic-script or bridge globals, not typos.
      'no-undef': 'off',
      // Rethrowing a caught error without `cause` is deliberate in the auth
      // flow: the messages are user-facing copy, not internal diagnostics.
      'preserve-caught-error': 'off',
    },
  },
  {
    // logic.js is a pre-existing solar-system visualiser with a large amount of
    // authoring scaffolding (texture generators, orbit builders, Qt bridge
    // handles) that is referenced dynamically or kept for future use. Flagging
    // it produces noise rather than signal, and it is not under active work.
    files: ['logic.js'],
    rules: {
      'no-unused-vars': 'off',
      'no-useless-assignment': 'off',
    },
  },
];
