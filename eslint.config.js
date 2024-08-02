import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import pluginJs from "@eslint/js";
import pluginStylistic from "@stylistic/eslint-plugin";
import pluginJson from "eslint-plugin-json";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactPerformance from "eslint-plugin-react-perf";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import pluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import pluginTailwind from "eslint-plugin-tailwindcss";
import globals from "globals";
import tsEslint from "typescript-eslint";

/** @type {Array<import('eslint').Linter.Config>} */
export default [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
          jsx: true,
        },
      },
    },
  },
  pluginJs.configs.recommended,
  ...tsEslint.configs.strict,
  ...tsEslint.configs.stylistic,
  ...fixupConfigRules(pluginReactConfig).map(config => {
    return {
      plugins: config.plugins,
      files: ["src/**/*.tsx"],
      settings: {
        react: {
          version: "detect",
        },
      },
      rules: {
        ...config.rules,
        "react/hook-use-state": "error",
        "react/jsx-no-bind": [
          "error",
          {
            allowArrowFunctions: true,
          },
        ],
        "react/jsx-no-constructed-context-values": "error",
        "react/jsx-no-leaked-render": "error",
        "react/jsx-no-useless-fragment": "error",
        "react/no-redundant-should-component-update": "error",
        "react/no-namespace": "error",
        "react/no-this-in-sfc": "error",
        "react/no-unstable-nested-components": "error",
        "react/no-unused-class-component-methods": "error",
        "react/no-unused-prop-types": "error",
        "react/no-unused-state": "error",
        "react/void-dom-elements-no-children": "error",
        "react/react-in-jsx-scope": "off",
        "react/require-render-return": "off",
      },
    };
  }),
  {
    plugins: {
      "react-hooks": fixupPluginRules(pluginReactHooks),
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
    },
  },
  {
    plugins: {
      "react-refresh": pluginReactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": [
        "error",
        {
          allowConstantExport: true,
        },
      ],
    },
  },
  {
    plugins: {
      "react-perf": fixupPluginRules(pluginReactPerformance),
    },
    files: ["src/**/*.tsx"],
    rules: {
      "react-perf/jsx-no-new-object-as-prop": [
        "error",
        {
          nativeAllowList: "all",
        },
      ],
      "react-perf/jsx-no-new-array-as-prop": [
        "error",
        {
          nativeAllowList: "all",
        },
      ],
      // "react-perf/jsx-no-new-function-as-prop": [
      //   "error",
      //   {
      //     nativeAllowList: "all",
      //   },
      // ],
    },
  },
  pluginStylistic.configs.customize({
    flat: true,
    indent: 2,
    quotes: "double",
    semi: true,
    jsx: true,
    quoteProps: "as-needed",
    arrowParens: false,
    blockSpacing: true,
    commaDangle: "always-multiline",
    braceStyle: "1tbs",
  }),
  {
    plugins: {
      "simple-import-sort": pluginSimpleImportSort,
    },
    files: ["**/*.js", "**/*.ts", "**/*.tsx"],
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    files: ["**/*.json"],
    ...pluginJson.configs["recommended-with-comments"],
  },
  ...pluginTailwind.configs["flat/recommended"],
  {
    rules: {
      "tailwindcss/migration-from-tailwind-2": "off",
      "tailwindcss/no-arbitrary-value": "off",
      "tailwindcss/classnames-order": "error",
      "tailwindcss/enforces-negative-arbitrary-values": "error",
      "tailwindcss/enforces-shorthand": "error",
      "tailwindcss/no-custom-classname": [
        "error",
        {
          whitelist: ["v-.*"],
        },
      ],
      "tailwindcss/no-contradicting-classname": "error",
      "tailwindcss/no-unnecessary-arbitrary-value": "error",
    },
  },
  {
    rules: {
      "@stylistic/arrow-parens": [
        "error",
        "as-needed",
      ],
      "@stylistic/jsx-self-closing-comp": [
        "error",
        {
          component: true,
          html: true,
        },
      ],
      "@stylistic/jsx-pascal-case": "error",
      "@stylistic/jsx-newline": [
        "error",
        {
          prevent: true,
          allowMultilines: true,
        },
      ],
      "@stylistic/jsx-props-no-multi-spaces": "error",
      "@stylistic/jsx-sort-props": [
        "error",
        {
          callbacksLast: true,
          shorthandFirst: true,
          shorthandLast: false,
          multiline: "ignore",
          ignoreCase: true,
          noSortAlphabetically: false,
          reservedFirst: true,
        },
      ],
    },
  },
  {
    rules: {
      "line-comment-position": [
        "error",
        {
          position: "above",
        },
      ],
      "func-style": [
        "error",
        "declaration",
        {
          allowArrowFunctions: true,
        },
      ],
      "no-var": "error",
      "prefer-object-spread": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      "no-unused-vars": "off",
      "no-unused-expressions": "off",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          enforceForJSX: true,
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "after-used",
          caughtErrors: "all",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/array-type": [
        "error",
        {
          default: "array-simple",
          readonly: "array-simple",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
          disallowTypeAnnotations: false,
        },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
          objectLiteralTypeAssertions: "allow-as-parameter",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
];
