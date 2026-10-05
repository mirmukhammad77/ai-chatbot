import globals from 'globals';
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tsESLint from 'typescript-eslint';
import pluginImport from 'eslint-plugin-import';
import pluginPromise from 'eslint-plugin-promise';
import pluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import pluginPrettierConfig from 'eslint-plugin-prettier/recommended';
import pluginConstructor from 'eslint-plugin-max-params-no-constructor';
import pluginJest from 'eslint-plugin-jest';

/** @type {import('eslint').Linter.Config} */
const ignoresConfig = {
  ignores: [
    'eslint.config.mjs',
    'prettier.config.cjs',
    'jest.config.mjs',
    'lint-staged.config.mjs',
    'dist/**',
    'coverage/**',
    'node_modules/**',
    '**/*.d.ts',
    'sequelize.config.cjs',
    'drizzle.config.ts',
    'migrations/**',
    'vitest.config.e2e.ts',
    'vitest.config.ts',
  ],
};

/** @type {import('eslint').Linter.Config}*/
const mainConfig = {
  files: ['**/*.ts'],
  languageOptions: {
    parser: tsESLint.parser,
    ecmaVersion: 2020,
    sourceType: 'module',
    globals: {
      ...globals.node,
      ...globals.jest,
    },
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  plugins: {
    promise: pluginPromise,
    import: pluginImport,
    'simple-import-sort': pluginSimpleImportSort,
    'max-params-no-constructor': pluginConstructor,
  },
  settings: {
    'import/resolver': {
      node: true,
    },
  },
  rules: {
    // ==== Base ESLint Rules ==== //
    'array-callback-return': [
      'error',
      {
        allowImplicit: true,
      },
    ],
    complexity: ['error', 10],
    curly: ['error', 'all'],
    'default-case': 'error',
    eqeqeq: 'error',
    'grouped-accessor-pairs': ['error', 'getBeforeSet'],
    'guard-for-in': 'error',
    'no-async-promise-executor': 'error',
    'no-bitwise': 'error',
    'no-caller': 'error',
    'no-console': 'error',
    'no-constant-binary-expression': 'error',
    'no-constructor-return': 'error',
    'no-else-return': 'error',
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-extra-label': 'error',
    'no-implicit-coercion': [
      'error',
      {
        boolean: true,
        number: true,
        string: false,
      },
    ],
    'no-iterator': 'error',
    'no-label-var': 'error',
    'no-labels': 'error',
    'no-lone-blocks': 'error',
    'no-lonely-if': 'error',
    'no-multi-assign': 'error',
    'no-multi-str': 'error',
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-octal-escape': 'error',
    'no-param-reassign': 'error',
    'no-promise-executor-return': 'error',
    'no-proto': 'error',
    'no-prototype-builtins': 'error',
    'no-return-assign': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-template-curly-in-string': 'error',
    'no-throw-literal': 'error',
    'no-undef-init': 'error',
    'no-unneeded-ternary': 'error',
    'no-unreachable-loop': 'error',
    'no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true,
      },
    ],
    'no-useless-assignment': 'error',
    'no-useless-backreference': 'error',
    'no-useless-call': 'error',
    'no-useless-computed-key': 'error',
    'no-useless-concat': 'error',
    'no-useless-rename': 'error',
    'no-useless-return': 'error',
    'no-var': 'error',
    'no-void': [
      'error',
      {
        allowAsStatement: true,
      },
    ],
    'no-warning-comments': [
      'warn',
      {
        decoration: ['/', '*'],
      },
    ],
    'object-shorthand': ['error', 'always'],
    'prefer-const': 'error',
    'prefer-exponentiation-operator': 'error',
    'prefer-object-has-own': 'error',
    'prefer-promise-reject-errors': [
      'error',
      {
        allowEmptyReject: true,
      },
    ],
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    'prefer-template': 'error',
    radix: 'error',
    'require-atomic-updates': 'error',
    'use-isnan': 'error',
    'valid-typeof': [
      'error',
      {
        requireStringLiterals: true,
      },
    ],
    yoda: 'error',

    // ==== TypeScript ESLint Rules ==== //
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
      },
    ],
    'consistent-return': 'off',
    '@typescript-eslint/consistent-return': 'error',
    'default-param-last': 'off',
    '@typescript-eslint/default-param-last': 'error',
    '@typescript-eslint/method-signature-style': ['error', 'property'],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        format: ['PascalCase'],
        selector: ['enumMember', 'class', 'typeLike', 'interface'],
      },
      {
        format: ['camelCase', 'PascalCase'],
        selector: ['function'],
      },
      {
        format: ['camelCase'],
        selector: ['classProperty', 'objectLiteralMethod'],
      },
      {
        format: ['UPPER_CASE', 'camelCase', 'PascalCase'],
        selector: ['variable'],
        modifiers: ['const'],
        leadingUnderscore: 'allow',
      },
    ],
    'no-invalid-this': 'off',
    '@typescript-eslint/no-invalid-this': 'error',
    'no-loop-func': 'off',
    '@typescript-eslint/no-loop-func': 'error',
    'no-redeclare': 'off',
    '@typescript-eslint/no-redeclare': 'error',
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-unnecessary-qualifier': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': [
      'error',
      {
        functions: false,
        classes: false,
        allowNamedExports: true,
        variables: false,
      },
    ],
    '@typescript-eslint/no-useless-constructor': 'error',
    '@typescript-eslint/prefer-as-const': 'error',
    '@typescript-eslint/prefer-literal-enum-member': 'error',
    '@typescript-eslint/require-array-sort-compare': [
      'error',
      {
        ignoreStringArrays: true,
      },
    ],
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/restrict-template-expressions': [
      'error',
      {
        allowNumber: true,
        allowBoolean: true,
        allowAny: true,
        allowNullish: true,
        allowRegExp: true,
        allowNever: false,
        allowArray: true,
      },
    ],
    '@typescript-eslint/no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/deprecated/*'],
            message: 'Do not import from deprecated folder, it would be removed in the near future',
          },
        ],
      },
    ],
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: false,
      },
    ],
    '@typescript-eslint/no-unsafe-enum-comparison': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',

    // ==== Import Plugin Rules ==== //
    'import/export': 'error',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-commonjs': 'error',
    'import/no-default-export': 'error',
    'import/no-duplicates': ['error', { 'prefer-inline': true }],
    'import/no-extraneous-dependencies': 'error',
    'import/no-mutable-exports': 'error',
    'import/no-named-default': 'error',

    // ==== Simple Import Sort Plugin Rules ==== //
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          [
            // First: Node.js built-in modules (starting with node:)
            '^node:',
            // Second: External packages
            '^@?\\w',
            // Third: Import aliases (#/)
            '^#/',
            // Fourth: Side effect imports,
            '^\\u0000',
            // Fifth: Relative imports (deepest nesting first)
            '^\\.\\.\/\\.\\.\/\\.\\.\\/',
            '^\\.\\.\/\\.\\.\\/',
            '^\\.\\.\\/',
            '^\\.\/',
          ],
        ],
      },
    ],

    // ==== Promise Plugin Rules ==== //
    'promise/prefer-await-to-then': 'error',

    // ==== Max Params Plugin Rules ==== //
    'max-params-no-constructor/max-params-no-constructor': ['error', 3],
  },
};

/** @type {import('eslint').Linter.Config}*/
const jestConfig = {
  files: ['**/*.spec.ts', '**/*.test.ts'],
  plugins: {
    jest: pluginJest,
  },
  languageOptions: {
    globals: {
      ...pluginJest.environments.globals.globals,
    },
  },
  rules: {
    'jest/consistent-test-it': [
      'error',
      {
        fn: 'it',
        withinDescribe: 'it',
      },
    ],
    'jest/expect-expect': 'error',
    'jest/no-conditional-expect': 'error',
    'jest/no-disabled-tests': 'error',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/no-standalone-expect': 'error',
    'jest/valid-expect': 'error',
    'jest/no-alias-methods': 'error',
    'jest/no-commented-out-tests': 'warn',
    'jest/no-done-callback': 'error',
    'jest/valid-expect-in-promise': 'error',
    'jest/prefer-expect-resolves': 'error',
    'jest/no-duplicate-hooks': 'error',
    'jest/prefer-hooks-on-top': 'error',
    'jest/prefer-to-be': 'error',
    'jest/prefer-to-contain': 'error',
    'jest/prefer-to-have-length': 'error',
    'jest/prefer-hooks-in-order': 'error',
    'jest/require-top-level-describe': 'error',
    'jest/no-test-return-statement': 'error',
    'jest/prefer-mock-promise-shorthand': 'error',

    // ==== Rules that are modified due to test environment ==== //
    complexity: 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
        disallowTypeAnnotations: false,
      },
    ],
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
  },
};

/** @type {import('eslint').Linter.Config} */
const prismaConfigOverride = {
  files: ['prisma.config.ts'],
  rules: {
    'import/no-default-export': 'off',
  },
};

/** @type {import('eslint').Linter.Config} */
const prettierOverrides = {
  rules: {
    curly: ['error', 'all'],
  },
};

export default defineConfig(
  ignoresConfig,
  eslint.configs.recommended,
  ...tsESLint.configs.recommendedTypeChecked,
  mainConfig,
  jestConfig,
  pluginPrettierConfig,
  prismaConfigOverride,
  prettierOverrides,
);
