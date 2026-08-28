import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gallery: {
          50: '#FAF9F6',
          100: '#F4F2EC',
          200: '#E8E5DC',
          300: '#D6D1C4',
          400: '#B8B19F',
          500: '#99907C',
          600: '#7B7260',
          700: '#5C5547',
          800: '#3D382F',
          900: '#1F1C17',
          950: '#12110E',
        },
        museum: {
          bg: '#F5F4F0',
          card: '#FFFFFF',
          dark: '#141413',
          accent: '#A47D4C',
          gold: '#C5A880',
          champagne: '#E6D7B8',
          border: '#E2DFD7',
          muted: '#737067',
        },
        pohchang: {
          red: '#8B1B1B',
          redDark: '#5E1212',
          gold: '#D4AF37',
          goldLight: '#EACD65',
        },
      },
      boxShadow: {
        'luxury': '0 10px 30px -10px rgba(26, 25, 24, 0.08), 0 4px 6px -2px rgba(26, 25, 24, 0.03)',
        'luxury-hover': '0 20px 40px -15px rgba(26, 25, 24, 0.15), 0 8px 16px -4px rgba(26, 25, 24, 0.06)',
        'floating': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      fontFamily: {
        heading: ['var(--font-sukhumvit)', 'Sukhumvit Set', 'Sukhumvit', '-apple-system', 'BlinkMacSystemFont', 'Prompt', 'Noto Sans Thai', 'sans-serif'],
        sukhumvit: ['var(--font-sukhumvit)', 'Sukhumvit Set', 'Sukhumvit', '-apple-system', 'BlinkMacSystemFont', 'Prompt', 'Noto Sans Thai', 'sans-serif'],
        sans: ['var(--font-sukhumvit)', 'Sukhumvit Set', 'Sukhumvit', '-apple-system', 'BlinkMacSystemFont', 'Prompt', 'Noto Sans Thai', 'sans-serif'],
        body: ['var(--font-maitree)', 'Maitree', 'Noto Serif Thai', 'Georgia', 'serif'],
        maitree: ['var(--font-maitree)', 'Maitree', 'Noto Serif Thai', 'Georgia', 'serif'],
        serif: ['var(--font-sukhumvit)', 'Sukhumvit Set', 'Sukhumvit', 'Prompt', 'Noto Sans Thai', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-subtle': 'pulseSubtle 3s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
