/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f4f3ff',
          100: '#e8e6ff',
          200: '#d5d2ff',
          300: '#aaa8f4',
          400: '#7679db',
          500: '#4a54b8',
          600: '#3340a6',
          700: '#25328f',
          800: '#1b276e',
          900: '#111936',
        },
        accent: {
          50: '#fff4ef',
          100: '#ffe4da',
          200: '#ffc8b6',
          300: '#ffa38a',
          400: '#ff8067',
          500: '#f06b55',
          600: '#d84e3d',
          700: '#ae372c',
          800: '#8f3029',
          900: '#762d28',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'gradient': 'gradient 8s ease infinite',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-24px) rotate(2deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 16px 32px rgba(17, 25, 54, 0.18)' },
          '50%': { boxShadow: '0 22px 44px rgba(17, 25, 54, 0.24), 0 8px 20px rgba(240, 107, 85, 0.16)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      boxShadow: {
        glow: '0 22px 55px rgba(42, 35, 92, 0.16)',
        'glow-sm': '0 12px 28px rgba(42, 35, 92, 0.13)',
      },
    },
  },
  plugins: [],
}
