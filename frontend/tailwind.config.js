/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Display = editorial serif with optical-size variation
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        // Body = warm humanist sans (NOT Inter)
        sans:    ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Mono for labels, dates, civic stamps
        mono:    ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      colors: {
        // Bulletin-board paper palette
        paper: {
          DEFAULT: '#f3eee2',  // base cream
          light:   '#faf6ec',
          dark:    '#e6dfcd',
        },
        ink: {
          DEFAULT: '#181613',  // not pure black — newsprint ink
          soft:    '#3a342c',
          mute:    '#6b6457',
          fade:    '#9c9382',
        },
        // International Orange — the literal Golden Gate Bridge color
        bridge: {
          50:  '#fff1ea',
          100: '#ffd9c2',
          200: '#ffb38a',
          300: '#ff8a52',
          400: '#ff6627',
          500: '#FF4F00',  // canonical IO
          600: '#d23d00',
          700: '#a02e00',
        },
        // Used very sparingly as a 2nd ink color (for hover / focus accents)
        teal: {
          DEFAULT: '#0F4C5C',
          soft:    '#2a6776',
        },
      },
      boxShadow: {
        // Hard newsprint shadow (no soft Apple-style blur)
        stamp: '3px 3px 0 0 rgba(24, 22, 19, 1)',
        pin:   '0 2px 0 rgba(24, 22, 19, 0.5), 0 6px 16px rgba(24, 22, 19, 0.18)',
        paper: '0 1px 0 rgba(0,0,0,0.04), 0 12px 32px rgba(24, 22, 19, 0.10)',
      },
    },
  },
  plugins: [],
}
