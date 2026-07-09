/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Scans all sub-folders and files inside src
  ],
  theme: {
    extend: {
      screens: {
        // Optional: Add an ultra-small breakpoint if you target older/smaller devices specifically
        xs: "375px",
      },
    },
  },
  plugins: [],
};
