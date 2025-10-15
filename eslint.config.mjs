import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 擴展 next/core-web-vitals 與 next/typescript 的規則
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // 自定義規則設定
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off", 
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": 0,
      "no-var": "off",
    },
  },
];

export default eslintConfig;
