export const ICONS = {
    // Navigation & UI
    BACK: "arrow-left",
    FORWARD: "arrow-right",
    CHEVRON_DOWN: "chevron-down",
    CHEVRON_RIGHT: "chevron-right",
    PLUS: "plus",
    MINUS: "minus",
    PLUS_CIRCLE: "plus-circle-outline",
    CHECK: "check",
    CLOSE: "close",

    // Tab Bar
    TAB_HOME: "home",
    TAB_HOME_OUTLINE: "home-outline",
    TAB_SETTINGS: "cog",
    TAB_SETTINGS_OUTLINE: "cog-outline",

    // Actions
    LOCATION: "map-marker",
    LOCATION_OUTLINE: "map-marker-outline",
    UPLOAD: "cloud-upload-outline",

    // Categories
    CAT_BIRD: "bird",
    CAT_MAMMAL: "paw",
    CAT_INSECT: "ladybug",
    CAT_PLANT: "flower",
    CAT_REPTILE: "snake",
    CAT_AMPHIBIAN: "fish",
    CAT_FUNGI: "mushroom",
    CAT_DEFAULT: "help-circle-outline"
};

export const getCategoryIcon = (category) => {
    switch (category) {
        case 'Bird': return ICONS.CAT_BIRD;
        case 'Mammal': return ICONS.CAT_MAMMAL;
        case 'Insect': return ICONS.CAT_INSECT;
        case 'Plant': return ICONS.CAT_PLANT;
        case 'Reptile': return ICONS.CAT_REPTILE;
        case 'Amphibian': return ICONS.CAT_AMPHIBIAN;
        case 'Fungi': return ICONS.CAT_FUNGI;
        default: return ICONS.CAT_DEFAULT;
    }
};
