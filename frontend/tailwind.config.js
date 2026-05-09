/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // SF-themed warm orange ("International Orange" of the Golden Gate)
        rust: {
          50:  '#fff5f0',
          100: '#ffe6d9',
          200: '#ffc8ad',
          300: '#ffa37a',
          400: '#ff7a45',
          500: '#f25c1f',
          600: '#d4470f',
          700: '#a8370c',
          800: '#7a280a',
          900: '#4d1906',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20, 14, 8, 0.04), 0 4px 16px rgba(20, 14, 8, 0.06)',
        ring: '0 0 0 1px rgba(20, 14, 8, 0.06), 0 4px 24px rgba(20, 14, 8, 0.08)',
      },
    },
  },
  plugins: [],
}
