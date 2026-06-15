/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        byte: {
          black: "#111111",
          graphite: "#2b2b2f",
          ash: "#f4f4f2",
          line: "#dedbd6",
          maroon: "#7a1018",
          red: "#a01824"
        }
      },
      boxShadow: {
        enterprise: "0 20px 60px rgba(17, 17, 17, 0.08)"
      }
    }
  },
  plugins: []
};
