import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    auth_username: 'guest',
    auth_email: null,
    auth_role: null,
    auth_org: null,
};

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        // Update user state on login/edit
        setUser: (state, action) => {
            state.auth_username = action.payload.username || action.payload.name || 'guest';
            state.auth_email = action.payload.email || null;
            state.auth_role = action.payload.role || null;
            state.auth_org = action.payload.org || null;
        },
        // Reset state on logout
        clearUser: (state) => {
            state.auth_username = 'guest';
            state.auth_email = null;
            state.auth_role = null;
            state.auth_org = null;
        }
    }
});

export const { setUser, clearUser } = userSlice.actions;

export default userSlice.reducer;