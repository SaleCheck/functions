const js = require("@eslint/js");
const globals = require("globals");

module.exports = [

  // Base recommended rules (equivalent to eslint:recommended)
  js.configs.recommended,

  // Config files
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },

  // Main project config (Node, CommonJS)
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-restricted-globals': ['error', 'name', 'length'],
      'prefer-arrow-callback': 'off',
      'no-prototype-builtins': 'off',
      'no-unused-vars': 'error',
      'no-undef': 'off',
      quotes: ['error', 'single', { allowTemplateLiterals: true }],
    },
  },

  // Mocha test files
  {
    files: ['**/*.spec.*', '**/*.test.js', '**/*.int.test.js'],
    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
  },

  // Ignore this file
  {
    ignores: ['eslint.config.cjs'],
  },
];