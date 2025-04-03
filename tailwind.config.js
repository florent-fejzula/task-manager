/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
      },
      fontSize: {
        base: '1rem', // 16px
        sm: '0.95rem',
      },
      colors: {
        primary: '#111111',
        accent: '#3a5a40',
        soft: '#f9f9f9',
      },
    },
  },
  plugins: [],
};
