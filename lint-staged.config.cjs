module.exports = {
  '*.{ts,tsx,js,jsx}': ['pnpm -s lint -- --fix'],
  '*.{ts,tsx,js,jsx,css,md,json,yml,yaml}': ['prettier -w']
};

