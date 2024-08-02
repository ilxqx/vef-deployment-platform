import propertyGroups from "stylelint-config-recess-order/groups";

/** @type {import('stylelint').Config} */
export default {
  extends: ["stylelint-config-standard-scss", "stylelint-config-recommended"],
  plugins: ["stylelint-order"],
  rules: {
    "order/order": [
      "dollar-variables",
      "at-variables",
      "custom-properties",
      "at-rules",
      "less-mixins",
      "declarations",
      "rules",
    ],
    "order/properties-order": propertyGroups.map(group => {
      return {
        ...group,
        emptyLineBefore: "always",
        noEmptyLineBetween: true,
      };
    }),
    "declaration-empty-line-before": null,
    "at-rule-no-unknown": null,
    "function-no-unknown": null,
    "color-hex-length": "long",
    "color-hex-alpha": "never",
    "color-named": "never",
    "unit-allowed-list": [
      "px",
      "em",
      "rem",
      "%",
      "fr",
      "deg",
      "rad",
      "grad",
      "turn",
      "ms",
      "s",
    ],
    "scss/function-no-unknown": [
      true,
      {
        ignoreFunctions: [],
      },
    ],
    "scss/at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: ["tailwind"],
      },
    ],
  },
};
