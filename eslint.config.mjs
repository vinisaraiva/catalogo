import nextConfig from "eslint-config-next";

/**
 * eslint-config-next (16.x) ships a native ESLint flat config array, so no
 * @eslint/eslintrc FlatCompat translation layer is needed here.
 */
const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "supabase/.temp/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
