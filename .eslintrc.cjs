module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // ⭐ 强制所有按钮必须有 type 属性
    'react/button-has-type': ['error', {
      'button': true,
      'submit': true,
      'reset': true
    }],
    // 禁止未使用的变量（警告）
    '@typescript-eslint/no-unused-vars': ['warn', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    // 允许 any 类型（因为项目中有很多遗留代码）
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
