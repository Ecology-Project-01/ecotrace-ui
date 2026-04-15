import { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import { useDispatch } from 'react-redux';

import TabNavigator from './TabNavigator';
import Auth from '../screens/Auth';
import Observation from '../screens/Observation';
import Results from '../screens/Results';
import CategoryDetails from '../screens/CategoryDetails';
import RecordDetails from '../screens/RecordDetails';
import EditProfile from '../screens/EditProfile';
import PrivacyScreen from "../screens/PrivacyScreen";
import HelpScreen from "../screens/HelpScreen";
import AboutScreen from '../screens/AboutScreen';
import TutorialVideo from '../screens/TutorialVideo';
import AdminRights from '../screens/AdminRights';
import SuperAdminRights from '../screens/SuperAdminRights';
import TrackMap from '../screens/TrackMap';
import TripsHistory from '../screens/TripsHistory';
import TripDetails from '../screens/TripDetails';
import colors from '../colors/colors';
import { setUser as setUserAction, clearUser } from '../store/slices/userSlice';


const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const dispatch = useDispatch();

    // Handle Logout Implementation
    const handleLogout = useCallback(async (showAlert = false) => {
        try {
            setUser(null);
            dispatch(clearUser());
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('userInfo');
            if (showAlert) {
                Alert.alert("Session Expired", "Your session has expired. Please login again.");
            }
        } catch (error) {
            console.error("[Auth] Error clearing login info:", error);
        }
    }, [dispatch]);

    useEffect(() => {
        checkLoginStatus();

        // Setup global fetch interceptor to handle 401s automatically
        const originalFetch = global.fetch;
        global.fetch = async (...args) => {
            const response = await originalFetch(...args);
            if (response.status === 401) {
                const url = args[0] || "";
                // Don't trigger on login/signup routes
                if (typeof url === 'string' && !url.includes('/auth/login') && !url.includes('/auth/signup')) {
                    const token = await SecureStore.getItemAsync('userToken');
                    if (token) {
                        handleLogout(true);
                    }
                }
            }
            return response;
        };

        return () => {
            global.fetch = originalFetch;
        };
    }, [handleLogout]);

    // Check if user is already logged in (Persistent Session)
    const checkLoginStatus = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const userInfoStr = await SecureStore.getItemAsync('userInfo');

            if (token && token !== "null" && token !== "undefined" && userInfoStr) {
                const decoded = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                if (decoded.exp && decoded.exp > currentTime) {
                    // Token is valid
                    const userData = JSON.parse(userInfoStr);
                    setUser(userData);
                    dispatch(setUserAction(userData));
                } else {
                    // Token expired
                    await handleLogout(true);
                }
            }
        } catch (error) {
            console.error("[Auth] Error checking login status:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Login Implementation
    const handleLogin = async (userData, token) => {
        try {
            setUser(userData);
            dispatch(setUserAction(userData));
            await SecureStore.setItemAsync('userToken', token);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(userData));
        } catch (error) {
            console.error("[Auth] Error saving login info:", error);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <Stack.Screen name="Auth">
                        {(props) => <Auth {...props} onLogin={handleLogin} />}
                    </Stack.Screen>
                ) : (
                    <Stack.Group>
                        <Stack.Screen name='Main'>
                            {(props) => <TabNavigator {...props} user={user} onLogout={handleLogout} />}
                        </Stack.Screen>
                        <Stack.Screen name='Observation'>
                            {(props) => <Observation {...props} />}
                        </Stack.Screen>
                        <Stack.Screen name='Results'>
                            {(props) => <Results {...props} />}
                        </Stack.Screen>
                        <Stack.Screen name='CategoryDetails'>
                            {(props) => <CategoryDetails {...props} />}
                        </Stack.Screen>
                        <Stack.Screen name='RecordDetails'>
                            {(props) => <RecordDetails {...props} />}
                        </Stack.Screen>
                        <Stack.Screen name='EditProfile'>
                            {(props) => <EditProfile {...props} />}
                        </Stack.Screen>
                        <Stack.Screen name='AdminRights'>
                            {(props) => <AdminRights {...props} />}
                        </Stack.Screen>
                        <Stack.Screen name='SuperAdminRights'>
                            {(props) => <SuperAdminRights {...props} />}
                        </Stack.Screen>
                        <Stack.Screen name='TrackMap'>
                            {(props) => <TrackMap {...props} />}
                        </Stack.Screen>
                        <Stack.Screen name='TripsHistory'>
                            {(props) => <TripsHistory {...props} />}
                        </Stack.Screen>
                        <Stack.Screen name='TripDetails'>
                            {(props) => <TripDetails {...props} />}
                        </Stack.Screen>
                        <Stack.Screen 
                            name='Help'>
                            {(props) => <HelpScreen {...props} />}
                        </Stack.Screen>
                        <Stack.Screen name='About'>
                            {(props) => <AboutScreen {...props} />}
                        </Stack.Screen>
                        <Stack.Screen name='Privacy'>
                            {(props) => <PrivacyScreen {...props} />}
                        </Stack.Screen>
                    </Stack.Group>
                    
                )}
                <Stack.Screen 
                    name='UserGuide' 
                    options={{ headerShown: false }}>
                    {(props) => <TutorialVideo {...props} />}
                </Stack.Screen>

            </Stack.Navigator>
        </NavigationContainer>
    );
}