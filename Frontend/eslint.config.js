import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
export default [
  {
    ignores: ['dist/**', 'dist-fixtures/**', 'node_modules/**', 'Frontend/**'],
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        __APP_VERSION__: 'readonly',
        __BUILD_DATE__: 'readonly',
      },
    },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      'no-undef': 'error',
      'no-unreachable': 'error',
      'react/jsx-no-undef': 'error',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
];
