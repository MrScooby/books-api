// Flat config, required since ESLint 9 — the project is on ESLint 10, which no
// longer reads the old .eslintrc.js at all. Rule set is carried over unchanged
// from that file: @typescript-eslint's `recommended` plus the five overrides.
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')

module.exports = [
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      // Prisma's generated client — thousands of lines we neither write nor fix.
      'src/generated/**',
      // This file is CommonJS by necessity; linting it with the TS ruleset only
      // flags its own require() calls. The old .eslintrc.js excluded itself too.
      'eslint.config.js'
    ]
  },

  ...tsPlugin.configs['flat/recommended'],

  {
    files: ['src/**/*.ts', 'test/**/*.ts', 'prisma/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module'
      }
    },
    rules: {
      // interface-name-prefix was removed from @typescript-eslint in v3; keeping a
      // rule entry for it would now be a config error rather than a no-op.
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn'
    }
  }
]
