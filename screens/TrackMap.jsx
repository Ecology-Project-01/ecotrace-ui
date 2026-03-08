import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Dimensions, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { startTrip, stopTrip, addLocation, resetTrip } from '../store/slices/tripSlice';
import colors from '../colors/colors';
import { ICONS } from '../constants/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function TrackMap() {
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { isTracking, path, distance, observations, startTime } = useSelector(state => state.trip);
    const isDark = useSelector(state => state.theme.isDark);
    const theme = isDark ? colors.dark : colors.light;

    const [currentPos, setCurrentPos] = useState(null);
    const [showNameModal, setShowNameModal] = useState(false);
    const [tripName, setTripName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const mapRef = useRef(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission missing', 'Location access is required to track your path.');
                return;
            }

            let initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setCurrentPos(initialLoc.coords);

            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    latitude: initialLoc.coords.latitude,
                    longitude: initialLoc.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                });
            }
        })();
    }, []);

    useEffect(() => {
        let subscriber;
        if (isTracking) {
            subscriber = Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 3, // Detect move every 3 meters
                    timeInterval: 5000,   // Detect move every 5 seconds
                },
                (loc) => {
                    const { latitude, longitude } = loc.coords;
                    dispatch(addLocation({ latitude, longitude }));
                    setCurrentPos(loc.coords);
                }
            );
        }
        return () => {
            if (subscriber) {
                subscriber.then(s => s.remove());
            }
        };
    }, [isTracking]);

    const handleToggle = () => {
        if (isTracking) {
            if (path.length < 2) {
                Alert.alert("Trip too short", "You need to walk a bit more to save a path.", [
                    { text: "Continue" },
                    { text: "Discard", onPress: () => dispatch(resetTrip()), style: "destructive" }
                ]);
                return;
            }
            setShowNameModal(true);
            setTripName(`Trip ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        } else {
            dispatch(startTrip());
        }
    };

    const handleSaveTrip = async () => {
        if (!tripName.trim()) {
            Alert.alert("Error", "Please provide a name for this trip.");
            return;
        }

        setIsSaving(true);
        try {
            const newTrip = {
                id: Date.now().toString(),
                name: tripName,
                startTime: startTime,
                endTime: new Date().toISOString(),
                path: path,
                distance: distance,
                observations: observations,
            };

            const existingTripsJson = await AsyncStorage.getItem('tripsList');
            const existingTrips = existingTripsJson ? JSON.parse(existingTripsJson) : [];

            await AsyncStorage.setItem('tripsList', JSON.stringify([newTrip, ...existingTrips]));

            dispatch(resetTrip());
            setShowNameModal(false);
            Alert.alert("Success", "Trip saved to history!");
            navigation.navigate('TripsHistory');
        } catch (error) {
            console.error("Save error:", error);
            Alert.alert("Error", "Failed to save trip.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                showsUserLocation={true}
                followsUserLocation={true}
                tintColor={theme.primary}
                customMapStyle={isDark ? darkMapStyle : []}
            >
                {path.length > 1 && (
                    <Polyline
                        coordinates={path}
                        strokeWidth={5}
                        strokeColor={theme.primary}
                        lineCap="round"
                    />
                )}
            </MapView>

            {/* Floating Top UI */}
            <View style={[styles.header, { top: Math.max(insets.top, 20) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
                    <MaterialCommunityIcons name={ICONS.BACK} size={24} color={theme.text} />
                </TouchableOpacity>

                <View style={[styles.statsBadge, { backgroundColor: theme.surface }]}>
                    <MaterialCommunityIcons name="speedometer" size={18} color={theme.primary} />
                    <Text style={[styles.statsText, { color: theme.text }]}>
                        {(distance / 1000).toFixed(2)} KM
                    </Text>
                </View>
            </View>

            {/* Quick Record Button */}
            <TouchableOpacity
                onPress={() => navigation.navigate('Observation')}
                style={[styles.obsFab, { backgroundColor: theme.secondary, bottom: 180 + insets.bottom }]}
            >
                <MaterialCommunityIcons name="plus" size={32} color="#FFF" />
            </TouchableOpacity>

            {/* Bottom Panel */}
            <View style={[styles.bottomPanel, { backgroundColor: theme.surface, bottom: Math.max(insets.bottom, 20) }]}>
                <View style={styles.panelHeader}>
                    <View style={styles.panelStat}>
                        <Text style={[styles.panelVal, { color: theme.text }]}>{path.length}</Text>
                        <Text style={[styles.panelLab, { color: theme.textSecondary }]}>SAMPLES</Text>
                    </View>
                    <View style={[styles.vDivider, { backgroundColor: theme.border }]} />
                    <View style={styles.panelStat}>
                        <Text style={[styles.panelVal, { color: theme.text }]}>
                            {isTracking ? "ONLINE" : "OFFLINE"}
                        </Text>
                        <Text style={[styles.panelLab, { color: theme.textSecondary }]}>GPS TRACKING</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleToggle}
                    activeOpacity={0.8}
                    style={[
                        styles.toggleBtn,
                        { backgroundColor: isTracking ? colors.error : theme.primary }
                    ]}
                >
                    <MaterialCommunityIcons
                        name={isTracking ? "stop" : "play"}
                        size={24}
                        color="#FFF"
                    />
                    <Text style={styles.toggleBtnText}>
                        {isTracking ? "FINISH TRIP" : "START TRACKING"}
                    </Text>
                </TouchableOpacity>
            </View>
            {/* Name Modal */}
            <Modal visible={showNameModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Finish Trip</Text>
                        <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Give your path a name to save it locally.</Text>

                        <TextInput
                            style={[styles.input, { color: theme.text, borderBottomColor: theme.primary }]}
                            value={tripName}
                            onChangeText={setTripName}
                            placeholder="e.g. Wetland Survey"
                            placeholderTextColor={theme.textLight}
                            autoFocus
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                onPress={() => { setShowNameModal(false); dispatch(stopTrip()); }}
                                style={[styles.modalBtn, { backgroundColor: theme.border }]}
                            >
                                <Text style={{ color: theme.text }}>Discard</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveTrip}
                                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                                disabled={isSaving}
                            >
                                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save Trip</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const darkMapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
    { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
    { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
    { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
    { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
    { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
];

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    header: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    statsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 22,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    statsText: { marginLeft: 8, fontWeight: 'bold', fontSize: 16 },
    obsFab: {
        position: 'absolute',
        right: 20,
        bottom: 180,
        width: 65,
        height: 65,
        borderRadius: 33,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    bottomPanel: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        borderRadius: 25,
        padding: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    panelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 20,
    },
    panelStat: { alignItems: 'center', flex: 1 },
    panelVal: { fontSize: 20, fontWeight: 'bold' },
    panelLab: { fontSize: 9, fontWeight: 'bold', marginTop: 2, letterSpacing: 0.5 },
    vDivider: { width: 1, height: '60%' },
    toggleBtn: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold', marginLeft: 10, letterSpacing: 0.5 },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalBox: {
        width: '100%',
        borderRadius: 20,
        padding: 25,
        elevation: 10,
    },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    modalSubtitle: { fontSize: 14, marginBottom: 20 },
    input: {
        height: 50,
        borderBottomWidth: 2,
        fontSize: 18,
        marginBottom: 30,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12
    },
    modalBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        minWidth: 100,
        alignItems: 'center'
    }
});
