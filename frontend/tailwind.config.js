/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F7FB",
        slateDeep: "#0F172A",
        panel: "#FFFFFF",
        emeraldSoft: "#10B981",
        dangerSoft: "#EF4444",
        ink: "#111827",
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        premium: "0 14px 50px rgba(15, 23, 42, 0.1)",
      },
      backgroundImage: {
        "mesh-light": "radial-gradient(at 20% 20%, rgba(17, 24, 39, 0.08) 0px, transparent 40%), radial-gradient(at 80% 0%, rgba(16, 185, 129, 0.14) 0px, transparent 45%)",
      },
    },
  },
  plugins: [],
};
