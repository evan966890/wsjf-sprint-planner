module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'react'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // 强制要求按钮必须有 type 属性（防止自动下载文件bug）
    'react/button-has-type': ['error', {
      button: true,
      submit: true,
      reset: true,
    }],
    // 禁止使用 alert, confirm, prompt
    'no-alert': 'error',
    'no-restricted-globals': ['error', 'confirm', 'prompt'],
    // React 相关
    'react/react-in-jsx-scope': 'off', // React 17+ 不需要
    'react/prop-types': 'off', // 使用 TypeScript
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
