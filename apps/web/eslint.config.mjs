import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

const eslintConfig = [
  {
  ignores: ['.next/**', '.next-dev/**', 'node_modules/**', 'out/**', 'build/**', 'dist/**', 'next-env.d.ts'],
  },
  ...compat.config({
    extends: ['next/core-web-vitals'],
    rules: {},
  }),
];

export default eslintConfig;
