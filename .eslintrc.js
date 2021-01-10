module.exports = {
    env: {
      es6: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'plugin:import/errors',
      'plugin:import/warnings'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: ['tsconfig.eslint.json'],
      sourceType: 'module',
    },
    rules: {
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/require-await": "off",
        "no-useless-escape": "off"
    },
    plugins: ['@typescript-eslint', 'import', 'prefer-arrow'],
    settings: {
        "import/resolver": {
          "node": {
            "extensions": [".js", ".jsx", ".ts", ".tsx"]
          }
        }
      }
  }