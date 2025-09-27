/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      // Only keep design tokens that CSS Modules can't handle
      colors: {
        primary: {
          50: 'rgb(240 249 255)',
          600: 'rgb(2 132 199)',
          700: 'rgb(3 105 161)',
          // Keep only essential colors used in component logic
        },
      },
    },
  },
  plugins: [],
}
