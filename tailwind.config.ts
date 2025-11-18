import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // This is the key setting for class-based dark mode
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Oviler brand colors
        primary: {
          DEFAULT: '#00523c',
          50: '#e6f5f0',
          100: '#ccebe1',
          200: '#99d6c3',
          300: '#66c2a5',
          400: '#33ad87',
          500: '#00523c',
          600: '#004230',
          700: '#003124',
          800: '#002118',
          900: '#00100c',
        },
        secondary: {
          DEFAULT: '#0a7a5e',
          50: '#e8f6f2',
          100: '#d1ede5',
          200: '#a3dbcb',
          300: '#75c9b1',
          400: '#47b797',
          500: '#0a7a5e',
          600: '#08624b',
          700: '#064938',
          800: '#043126',
          900: '#021813',
        },
        accent: {
          DEFAULT: '#14b88a',
          50: '#eafbf5',
          100: '#d5f7eb',
          200: '#abefd7',
          300: '#81e7c3',
          400: '#57dfaf',
          500: '#14b88a',
          600: '#10936e',
          700: '#0c6e53',
          800: '#084a37',
          900: '#04251c',
        },
      },
    },
  },
  plugins: [],
}

export default config

