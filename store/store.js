import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import userReducer from './slices/userSlice';
import tripReducer from './slices/tripSlice';

export const store = configureStore({
    reducer: {
        theme: themeReducer,
        user: userReducer,
        trip: tripReducer,
    },
});
