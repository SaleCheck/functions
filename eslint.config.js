// eslint.config.js

import js from "@eslint/js";

export default [
  js.configs.recommended,

  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        process: "readonly",
        __dirname: "readonly",
        console: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
      },
    },
    rules: {
      // Relax rules so it matches your existing codebase
      quotes: ["error", "single", { allowTemplateLiterals: true }],
      "no-undef": "off",
      "no-prototype-builtins": "off",
      "no-unused-vars": "warn",
    },
  },

  {
    files: ["**/*.test.js", "**/*.int.test.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        before: "readonly",
        after: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
  },
];