/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#a413ec",
        "secondary": "#6366F1",
        "background-light": "#f9f5ff",
        "background-dark": "#1c1022",
        // Keeping original primary/secondary just in case they are used elsewhere
        "indigo-primary": '#4F46E5', 
        "indigo-secondary": '#6366F1',
      },
      fontFamily: {
        "display": ["Manrope", "Epilogue", "sans-serif"]
      },
      borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}