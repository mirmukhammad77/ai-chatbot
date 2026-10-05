/** @type {import('lint-staged').Config} */
const config = {
  'src/**/*.{js,ts,jsx,tsx}': ['eslint --fix'],
};

export default config;