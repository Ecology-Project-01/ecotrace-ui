const palette = {
    // Vivid / Neon "Cyber-Pop" Palette
    electricCyan: "#00F0FF",
    neonPurple: "#BD00FF",

    // New Primary Button Colors (Pink/Peach)
    vividPink: "#FF4081",
    warmPeach: "#FF8A80",
    softPeach: "#FFCCBC",

    electricLime: "#CCFF00",

    // Softer Gradient Tones
    softPurple: "#D580FF",
    softPink: "#F48FB1",

    // Supporting Tones
    cyanDark: "#00B8D4",
    purpleLight: "#D500F9",

    // Grays & Neutrals
    white: "#FFFFFF",
    offWhite: "#F0F2F5",
    gray100: "#E0E0E0",
    gray300: "#B0BEC5",
    gray600: "#757575",
    gray800: "#424242",
    gray900: "#212121",

    // Dark Mode - Matt Black
    voidDark: "#121212",
    voidSurface: "#1E1E1E",
    textDark: "#E0E0E0",
};

export default {
    ...palette,

    // Default Legacy References
    primary: palette.vividPink,
    secondary: palette.neonPurple,
    tertiary: palette.warmPeach,
    purple: palette.neonPurple,
    purpleLight: palette.purpleLight,
    red: "#FF1744",
    cyan: palette.electricCyan,

    background: palette.offWhite,
    surface: palette.white,
    text: palette.gray900,
    textSecondary: palette.gray600,
    textLight: palette.gray300,
    accent: palette.electricLime,
    error: "#FF1744",
    success: palette.electricLime,

    // Gradients
    gradientPrimary: [palette.vividPink, palette.warmPeach],
    gradientPurple: [palette.softPurple, palette.softPink],
    gradientSurface: [palette.white, "#FFEEF2"],
    gradientPeach: [palette.warmPeach, palette.softPeach],

    // Theme Objects
    light: {
        background: palette.offWhite,
        surface: palette.white,
        text: palette.gray900,
        textSecondary: palette.gray600,
        textLight: palette.gray300,
        border: palette.gray100,
        primary: palette.vividPink,
        secondary: palette.neonPurple,
        accent: palette.warmPeach,
        highlight: palette.electricLime,
        gradientSurface: [palette.white, "#FFEEF2"],
        statusBarStyle: "dark",
    },

    dark: {
        background: palette.voidDark,
        surface: palette.voidSurface,
        text: palette.textDark,
        textSecondary: "#A0A0B0",
        textLight: "#606070",
        border: "#333333",
        primary: palette.vividPink,
        secondary: palette.softPurple,
        accent: palette.warmPeach,
        highlight: palette.electricLime,
        gradientSurface: [palette.voidSurface, "#251015"],
        statusBarStyle: "light",
    },

    // ✅ NEW THEMES
    blue: {
        background: "#E3F2FD",
        surface: "#FFFFFF",
        text: "#0D1B2A",
        textSecondary: "#1565C0",
        textLight: "#90CAF9",
        border: "#BBDEFB",
        primary: "#1976D2",
        secondary: "#0288D1",
        accent: "#29B6F6",
        highlight: "#00E5FF",
        gradientSurface: ["#FFFFFF", "#E3F2FD"],
        statusBarStyle: "dark",
    },

    grey: {
        background: "#F5F5F5",
        surface: "#FFFFFF",
        text: "#212121",
        textSecondary: "#757575",
        textLight: "#BDBDBD",
        border: "#E0E0E0",
        primary: "#616161",
        secondary: "#424242",
        accent: "#9E9E9E",
        highlight: "#EEEEEE",
        gradientSurface: ["#FFFFFF", "#F5F5F5"],
        statusBarStyle: "dark",
    },

    purple: {
        background: "#F3E5F5",
        surface: "#FFFFFF",
        text: "#1A0030",
        textSecondary: "#6A1B9A",
        textLight: "#CE93D8",
        border: "#E1BEE7",
        primary: "#8E24AA",
        secondary: "#AB47BC",
        accent: "#EA80FC",
        highlight: "#E040FB",
        gradientSurface: ["#FFFFFF", "#F3E5F5"],
        statusBarStyle: "dark",
    },

}; // ✅ ONE closing }; at the very end