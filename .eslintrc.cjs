/**
 * Module-boundary enforcement (see docs/ARCHITECTURE.md §1.4): a module under
 * src/modules/<name>/ may only be imported from outside via its index.ts public
 * API barrel — never by reaching into another module's domain/application/
 * infrastructure/interface folders directly.
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'boundaries'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  env: {
    node: true,
    jest: true,
  },
  settings: {
    'import/resolver': {
      node: { extensions: ['.js', '.ts'] },
    },
    'boundaries/elements': [
      { type: 'shared', mode: 'full', pattern: 'src/shared/**' },
      { type: 'config', mode: 'full', pattern: 'src/config/**' },
      { type: 'module-api', mode: 'full', pattern: 'src/modules/*/index.ts', capture: ['module'] },
      { type: 'module-internal', mode: 'full', pattern: 'src/modules/*/**', capture: ['module'] },
    ],
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'error',
    'boundaries/element-types': [
      'error',
      {
        default: 'allow',
        rules: [
          {
            from: 'module-internal',
            disallow: [['module-internal', { module: '!${from.module}' }]],
            message:
              "Do not import another module's internals directly — import its public API (index.ts) instead.",
          },
        ],
      },
    ],
  },
  ignorePatterns: ['dist', 'node_modules', 'src/generated', '.eslintrc.cjs', 'jest.config.js'],
};
