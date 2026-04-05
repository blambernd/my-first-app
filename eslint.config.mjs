import nextConfig from "eslint-config-next";

export default [
  ...nextConfig,
  {
    files: ["src/components/ui/**/*.tsx"],
    rules: {
      "react-hooks/purity": "off",
    },
  },
];
