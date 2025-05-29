/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-blue': '#ADD8E6',
        'bg-blue-dark': '#5BA3C4',
        'bg-orange': '#FFDAB9',
        'bg-white': '#FFFFFF',
      },
      fontFamily: {
        'sans': ['Open Sans', 'sans-serif'],
        'serif': ['Lora', 'serif'],
      },
    },
  },
  plugins: [],
} 