import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Gerado por `supabase gen types typescript`. Revisar estilo de arquivo
    // que será sobrescrito na próxima geração não leva a nada.
    "src/types/database.ts",
  ]),

  {
    // Os testes simulam respostas de API externa: o formato do payload é
    // justamente o que está sendo verificado, e tipá-lo aqui apenas repetiria
    // a suposição que o teste existe para checar.
    files: ["tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_|^url$|^init$" }],
    },
  },
]);

export default eslintConfig;
