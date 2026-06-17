/** @type {import('tailwindcss').Config} */
import colors from "./src/assets/theme/colors";
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.{js,ts}",
  ],

  theme: {
    extend: {
      animation: {
        "spin-slow": "spin 10s linear infinite", // Change the '3s' to any duration you want
      },
      colors: {
        ...colors,
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        nunito: ["Nunito", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        Montserrat: ["Montserrat", "sans-serif"],
      },
    },
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
      },
    },
  },
  plugins: [],
};
