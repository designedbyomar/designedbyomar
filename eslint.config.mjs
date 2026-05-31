import js from '@eslint/js';
import globals from 'globals';

const moduleLanguageOptions = {
  ecmaVersion: 'latest',
  sourceType: 'module',
};

const jsxLanguageOptions = {
  ...moduleLanguageOptions,
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
};

const noUnusedVars = ['error', {
  argsIgnorePattern: '^_',
  varsIgnorePattern: '^_',
}];

export default [
  {
    ignores: [
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ...jsxLanguageOptions,
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': noUnusedVars,
    },
  },
  {
    files: ['postbuild.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': noUnusedVars,
    },
  },
  {
    files: [
      '*.config.js',
      '*.config.mjs',
      'eslint.config.mjs',
      'scripts/**/*.mjs',
      'tests/**/*.mjs',
    ],
    languageOptions: {
      ...moduleLanguageOptions,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': noUnusedVars,
    },
  },
];
