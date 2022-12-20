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
        lavender: {
          50: '#ebecf2',
          100: '#b4bdf1',
          200: '#aab3e7',
          300: '#a0a9dd',
          400: '#969fd3',
          500: '#8c95c9',
          600: '#7881b5',
          700: '#50567d',
          800: '#3d4263',
          900: '#2a2f4d',
        },
        inblue: {
          DEFAULT: '#477EFB',
          50: '#FBFCFF',
          100: '#E7EEFE',
          200: '#BFD2FE',
          300: '#97B6FD',
          400: '#6F9AFC',
          500: '#477EFB',
          600: '#1058FA',
          700: '#0442CD',
          800: '#033096',
          900: '#021F60',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
