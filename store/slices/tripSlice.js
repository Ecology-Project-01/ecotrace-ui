import { createSlice } from '@reduxjs/toolkit';

const tripSlice = createSlice({
    name: 'trip',
    initialState: {
        isTracking: false,
        path: [], // Array of {latitude, longitude}
        startTime: null,
        distance: 0, // meters
        observations: [], // List of items added during THIS trip
    },
    reducers: {
        startTrip: (state) => {
            state.isTracking = true;
            state.path = [];
            state.startTime = new Date().toISOString();
            state.distance = 0;
            state.observations = [];
        },
        stopTrip: (state) => {
            state.isTracking = false;
        },
        addLocation: (state, action) => {
            if (state.isTracking) {
                const newPoint = action.payload; // {latitude, longitude}

                if (state.path.length > 0) {
                    const lastPoint = state.path[state.path.length - 1];
                    const dist = calculateDistance(
                        lastPoint.latitude,
                        lastPoint.longitude,
                        newPoint.latitude,
                        newPoint.longitude
                    );
                    state.distance += dist;
                }

                state.path.push(newPoint);
            }
        },
        addObservationToTrip: (state, action) => {
            // We append items added during this trip to this specific trip state
            state.observations.push(action.payload);
        },
        resetTrip: (state) => {
            state.isTracking = false;
            state.path = [];
            state.startTime = null;
            state.distance = 0;
            state.observations = [];
        }
    }
});

// Haversine formula for distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export const { startTrip, stopTrip, addLocation, resetTrip, addObservationToTrip } = tripSlice.actions;
export default tripSlice.reducer;
