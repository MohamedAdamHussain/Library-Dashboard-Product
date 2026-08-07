import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      // أمان الوصول — أخطاء حرجة فقط
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      // label-has-associated-control: شائع في shadcn/ui (Label component منفصل)، نحوّله لتحذير
      'jsx-a11y/label-has-associated-control': 'warn',
      // heading-has-content: CardTitle في shadcn يكون فارغ افتراضياً، نحوّله لتحذير
      'jsx-a11y/heading-has-content': 'warn',

      // ترتيب الاستيرادات (warnings فقط — لا تحظر CI)
      'import/order': 'off',

      // React Hooks — فعّل extra rules
      'react-hooks/exhaustive-deps': 'warn',
      // set-state-in-effect: شائع في pagination/filter reset، نحوّله لتحذير
      'react-hooks/set-state-in-effect': 'warn',

      // react-refresh: عطّله لأن ملفات shadcn/ui تخلط بين المكونات والتصديرات (exports)
      'react-refresh/only-export-components': 'off',

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
  },
])
