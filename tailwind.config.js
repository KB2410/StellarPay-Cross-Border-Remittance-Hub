/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#030712', // gray-950 deep
        foreground: '#f9fafb', // gray-50
        surface: 'rgba(17, 24, 39, 0.7)', // gray-900 with opacity for glass
        'surface-hover': 'rgba(31, 41, 55, 0.8)', // gray-800
        border: 'rgba(55, 65, 81, 0.5)', // gray-700
        'border-active': 'rgba(99, 102, 241, 0.5)', // indigo
        accent: '#6366f1', // indigo-500
        'accent-dark': '#4f46e5', // indigo-600
        'accent-cyan': '#06b6d4', // cyan-500
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-outfit)', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: '0 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(99, 102, 241, 0.6)' },
        }
      },
    },
  },
  plugins: [],
}
