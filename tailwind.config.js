/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'pixel': ['"Press Start 2P"', 'cursive'],
      },
      animation: {
        'coin-flip': 'coinFlip 0.6s ease-in-out',
        'splash': 'splash 0.8s ease-out',
      },
      keyframes: {
        coinFlip: {
          '0%': { transform: 'translateY(0) rotateY(0)' },
          '50%': { transform: 'translateY(-30px) rotateY(180deg)' },
          '100%': { transform: 'translateY(0) rotateY(360deg)' },
        },
        splash: {
          '0%': { opacity: '0', transform: 'scale(0)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
          '100%': { opacity: '0', transform: 'scale(1.5)' },
        },
      },
    },
  },
  plugins: [],
}