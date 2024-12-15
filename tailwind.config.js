/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.tsx"],
  theme: {
    extend: {},
    colors: {
      acanthus: {
        bright: "#088ab4",
        DEFAULT: "#003e5f"
      }
    }
  },
  mode: "jit",
  darkMode: "class",
  plugins: ["autoprefixer"]
}
