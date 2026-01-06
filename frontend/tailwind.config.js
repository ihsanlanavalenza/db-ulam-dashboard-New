/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  safelist: [
    // Grid column classes
    "grid-cols-1",
    "grid-cols-2",
    "grid-cols-3",
    "grid-cols-4",

    // Widths
    "w-[435px]",
    "w-[270px]",
    "w-[160px]",
    "w-[560px]",
    "w-[600px]",
    "w-[300px]",
    "w-[350px]",

    // Heights
    "h-[124px]",
    "h-[160px]",
    "h-[200px]",
    "h-[300px]",
    "h-auto"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
