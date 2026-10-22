/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#101214',
        sidebar: '#15181B',
        surface: '#191D21',
        elevated: '#252B31',
        hover: '#252B31',
        border: '#30363C',
        'surface-border': '#30363C',
        platinum: {
          DEFAULT: '#B7C7D8',
          hover: '#C8D6E5',
          active: '#9EB0C3',
        },
        'text-primary': '#ECEFF1',
        'text-secondary': '#92999F',
        'text-muted': '#70777E',
        success: '#79B89A',
        warning: '#D8B477',
        error: '#D98282',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.9rem', fontWeight: '500' }],
        'xs': ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
        'sm': ['0.8125rem', { lineHeight: '1.2rem', fontWeight: '400' }],
        'base': ['0.875rem', { lineHeight: '1.35rem', fontWeight: '400' }],
        'md': ['0.9375rem', { lineHeight: '1.4rem', fontWeight: '500' }],
        'lg': ['1.0625rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
}
