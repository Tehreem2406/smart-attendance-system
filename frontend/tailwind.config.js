/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: "#facc15",     // yellow-400
        teacher: "#ef4444",   // red-500
        student: "#16a34a",   // green-600
      },
      fontFamily: {
        sans: ["Avenir", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}