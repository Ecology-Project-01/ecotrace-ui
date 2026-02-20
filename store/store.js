import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
    reducer: {
        theme: themeReducer,
        user: userReducer,
    },
});
