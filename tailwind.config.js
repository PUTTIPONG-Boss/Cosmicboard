/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#040608',
          900: '#080B14',
          800: '#0D1117',
          700: '#0f172a',
        },
      },
    },
  },
  plugins: [],
}
