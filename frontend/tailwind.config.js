/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#46B646',
        'primary-dark': '#3da03d',
        secondary: '#00A9BA',
        accent: '#FFCB2B',
        'dark-navy': '#02202E',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
