import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";

export default [
  { files: ["**/*.{js,mjs,cjs,jsx}"] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: {
      "new-cap":         [2, { capIsNewExceptions: ["URI", "RegisterEffect"] }],
      "no-multi-spaces": [
        2,
        {
          exceptions: {
            Property:           true,
            VariableDeclarator: true,
            BinaryExpression:   true,
            ImportDeclaration:  true,
          },
        },
      ],
      "key-spacing": [
        2,
        { beforeColon: false, afterColon: true, mode: "minimum", align: "value" },
      ],
      "comma-dangle":        [2, "only-multiline"],
      "space-before-blocks": [
        2,
        { functions: "never", keywords: "never", classes: "always" },
      ],
      "no-unused-expressions": [
        2,
        { allowShortCircuit: true, allowTernary: true },
      ],
      "no-underscore-dangle": [
        2,
        { allowAfterThis: true, allow: ["_appStaticModels"] },
      ],
      "function-paren-newline":      ["error", "consistent"],
      "no-restricted-globals":       ["error", "event", "fdescribe"],
      "wrap-iife":                   0,
      "func-names":                  0,
      "space-before-function-paren": 0,
      "no-param-reassign":           [
        2,
        { props: true, ignorePropertyModificationsFor: ["draft", "acc"] },
      ],
      "react/prop-types": [
        2,
        {
          ignore: [
            "children",
            "className",
            "*Cx",
            "location",
            "history",
            "match",
          ],
          customValidators: [],
          skipUndeclared:   false,
        },
      ],
      "no-console": 'warn',
    }
  }
];
