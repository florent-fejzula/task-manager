/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
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
