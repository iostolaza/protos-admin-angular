/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)'],
        roboto: ['var(--font-roboto)'],
      },
    },
  },
  safelist: [
    'group-hover:hidden',
    'group-hover:block',
  ],
  plugins: [],
};