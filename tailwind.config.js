/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'event-paid': '#86efac',    // Light green
        'event-pending': '#fecaca',  // Pink
        'event-mixed': '#d1d5db',    // Gray
      }
    },
  },
  plugins: [],
}