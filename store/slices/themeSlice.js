import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    themeName: 'light', // default theme
};

export const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        setTheme: (state, action) => {
            state.themeName = action.payload; // payload will be "light", "dark", "blue", "grey", or "purple"
        },
    },
});

export const { setTheme } = themeSlice.actions;

export default themeSlice.reducer;