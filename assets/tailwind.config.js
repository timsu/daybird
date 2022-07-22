/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          100: '#5473a5',
          200: '#4a699b',
          300: '#405f91',
          400: '#365587',
          500: '#2c4b7d',
          600: '#224173',
          700: '#183769',
          800: '#0e2d5f',
          900: '#042355',
        },
        funblue: {
          50: '#82dfff',
          100: '#78d5ff',
          200: '#6ecbff',
          300: '#64c1ff',
          400: '#5ab7fb',
          500: '#50adf1',
          600: '#46a3e7',
          700: '#3c99dd',
          800: '#328fd3',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
