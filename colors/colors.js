const palette = {
    // Vivid / Neon "Cyber-Pop" Palette
    electricCyan: "#00F0FF", // High energy Cyan - Keep for accents
    neonPurple: "#BD00FF", // Deep electric Purple - Keep for secondary

    // New Primary Button Colors (Pink/Peach)
    vividPink: "#FF4081", // Pink
    warmPeach: "#FF8A80", // Peach
    softPeach: "#FFCCBC", // Light Peach

    electricLime: "#CCFF00", // Zesty Lime

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
    primary: palette.vividPink, // Updated to Pink
    secondary: palette.neonPurple,
    tertiary: palette.warmPeach, // Updated to Peach
    // Aliases for backward compat
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

    // Updated Gradients for Buttons (Pink/Peach)
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
};
