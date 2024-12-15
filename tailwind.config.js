/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        acanthus: {
          bright: "#088ab4",
          DEFAULT: "#003e5f"
        },
        white: {
          DEFAULT: "#ffffff",
          dark: "#fafafa"
        }
      }
    }
  },
  mode: "jit",
  darkMode: "class",
  plugins: [require("tailwindcss-radix")]
}
