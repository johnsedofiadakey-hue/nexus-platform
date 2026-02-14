import { defineConfig, globalIgnores } from "eslint/config";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default defineConfig([
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "@next/next": nextPlugin,
      "react-hooks": reactHooksPlugin,
    },
  },
  {
    rules: {
      "no-debugger": "error",
      "no-constant-condition": "error",
    },
  },
  globalIgnores([
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/node_modules/**",
    "**/dist/**",
    "**/coverage/**",
    "**/.turbo/**",
    "next-env.d.ts",
  ]),
]);
