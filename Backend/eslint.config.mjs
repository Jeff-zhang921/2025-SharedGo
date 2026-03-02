import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      "node_modules/**", 
      "dist/**", 
      "src/generated/**",
      "**/prisma/generated/**",
      "**/*.d.ts",
      "jest.config.js",
    ],
  },

  // JS base rules
  js.configs.recommended,
  ...tseslint.configs.recommended,
  
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

    },
  },
]);
