module.exports = {
  purge: ["./public/**/*.html", "./src/**/*.vue"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: "#FFCE65",
        secondary: "#F07E3F",
        success: "#92FF6B",
        danger: "#FF2F12",
        yellow: "#FFEBC1",
        gray: "#9C9787",
        dark: "#111C26",
        light: "#F2EADF",
        dark_100: "#08111A",
        dark_200: "#172634",
        dark_300: "#091C2E",
        blue_100: "#213649",
        blue_200: "#31506C",
        blue_300: "#406A90",
        blue_400: "#6390B9",
      },
    },
    screens: {
      phone: "520px",
      tablet: "640px",
      laptop: "960px",
      desktop: "1280px",
      xl: "1400px",
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
