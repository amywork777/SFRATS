/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'Menlo', 'monospace'],
      },
      colors: {
        // Shared surfaces; brand aliases resolve to the CSS design tokens.
        paper: {
          DEFAULT: '#f7f7f4',  // base cream
          light:   '#ffffff',
          dark:    '#e9e9e5',
        },
        ink: {
          DEFAULT: '#171717',  // not pure black - newsprint ink
          soft:    '#414141',
          mute:    '#626262',
          fade:    '#686868',
        },
        // One brand scale across buttons, links and active states.
        bridge: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700].map(step => [step, `rgb(var(--accent-${step}) / <alpha-value>)`])),
        // Used very sparingly as a 2nd ink color (for hover / focus accents)
        teal: {
          DEFAULT: '#171717',
          soft:    '#414141',
        },
      },
      boxShadow: {
        // Flat structure; soft elevation only for overlays.
        stamp: 'none',
        pin: '0 3px 10px rgba(0,0,0,0.12)',
        paper: '0 1px 0 rgba(0,0,0,0.04), 0 12px 32px rgba(24, 22, 19, 0.10)',
      },
    },
  },
  plugins: [],
}
