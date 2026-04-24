const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      'react': require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks'),
      'import': require('eslint-plugin-import'),
      'prettier': require('eslint-plugin-prettier'),
    },
    rules: {
      // ── Prettier ────────────────────────────────────────────────────
      'prettier/prettier': 'warn',

      // ── TypeScript ───────────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

      // ── React ────────────────────────────────────────────────────────
      'react/react-in-jsx-scope': 'off',          // Not needed with React 17+
      'react/prop-types': 'off',                  // TypeScript handles this
      'react/display-name': 'warn',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-key': 'error',

      // ── React Hooks ──────────────────────────────────────────────────
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ── Imports ──────────────────────────────────────────────────────
      'import/no-duplicates': 'error',
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // ── General ──────────────────────────────────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    // Relax rules for config and utility files
    files: ['babel.config.js', 'metro.config.js', '*.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'android/**',
      'ios/**',
      'dist/**',
      '**/*.d.ts',
    ],
  },
]);

