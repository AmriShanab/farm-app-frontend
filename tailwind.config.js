/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2E7D32',
        'primary-light': '#A5D6A7',
        earth: '#6D4C41',
        background: '#ffffff',
        text: '#1B1B1B',
        accent: '#1E88E5',
      },
      fontFamily: {
        sans: ['Nunito', 'Inter', 'sans-serif'],
        heading: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        soft: '0 4px 20px 0 rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
}