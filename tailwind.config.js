/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        gold: {
          50:  '#fbf7ed',
          100: '#f6ecd0',
          200: '#ecd79e',
          300: '#e2bb6a',
          400: '#d9a040',
          500: '#c4862a',
          600: '#a96b21',
          700: '#884f1e',
          800: '#713f1e',
          900: '#61351d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        arabic: ['"Noto Naskh Arabic"', 'serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(6, 95, 70, 0.06), 0 1px 2px rgba(6, 95, 70, 0.04)',
        'card-hover': '0 8px 24px rgba(6, 95, 70, 0.12), 0 2px 6px rgba(6, 95, 70, 0.08)',
      },
      backgroundImage: {
        'pattern-islamic': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath fill='%23059869' fill-opacity='0.04' d='M20 0l20 20-20 20L0 20 20 0zm0 4L4 20l16 16 16-16L20 4z'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseRing: { '0%': { transform: 'scale(0.95)', opacity: '0.7' }, '70%': { transform: 'scale(1.1)', opacity: '0' }, '100%': { transform: 'scale(0.95)', opacity: '0' } },
      },
    },
  },
  plugins: [],
}
