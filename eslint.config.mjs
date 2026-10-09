// Root ESLint config - prevents cascading into workspace packages.
// Each workspace app/package manages its own ESLint configuration.
export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/coverage/**'],
  },
];
