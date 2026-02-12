/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        serif: ['"Playfair Display"', "Georgia", "serif"],
        mono: ['"DM Mono"', "monospace"],
      },
      colors: {
        gold: {
          DEFAULT: '#c4a265',
          light: '#d4b275',
          dark: '#a08050',
          50: 'rgba(196, 162, 101, 0.05)',
          100: 'rgba(196, 162, 101, 0.1)',
          200: 'rgba(196, 162, 101, 0.2)',
        },
        cinema: {
          bg: '#0a0a08',
          card: '#111110',
          surface: '#161614',
          text: '#f5f0e8',
          muted: 'rgba(245, 240, 232, 0.45)',
          subtle: 'rgba(245, 240, 232, 0.25)',
          border: 'rgba(196, 162, 101, 0.12)',
        },
      },
    },
  },
  plugins: [],
};
