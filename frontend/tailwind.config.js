/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#14B8A6",
        accent: "#10B981",
        surface: "#F8FAFC",
        ink: "#1E293B",
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "Nunito", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "24px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(37, 99, 235, 0.12)",
        glow: "0 0 24px rgba(16, 185, 129, 0.35)",
      },
    },
  },
  plugins: [],
};
