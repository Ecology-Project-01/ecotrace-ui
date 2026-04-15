import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import colors from '../colors/colors';
import { API_URL } from '../constants/config';
import { observationCsvHeaderLine, rowFromTripObservation } from '../constants/csvExport';
import { Ionicons } from '@expo/vector-icons';

function normalizeTrip(t) {
    const id = t._id != null ? String(t._id) : t.id;
    return {
        ...t,
        id,
        contributor: t.contributor,
        path: Array.isArray(t.path) ? t.path : [],
        observations: Array.isArray(t.observations) ? t.observations : [],
    };
}

function isMongoId(id) {
    return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
}

/** Region that fits the path with padding, or a default around the first point */
function regionForPath(path) {
    if (!path || path.length === 0) return null;
    let minLat = path[0].latitude;
    let maxLat = path[0].latitude;
    let minLng = path[0].longitude;
    let maxLng = path[0].longitude;
    for (let i = 1; i < path.length; i++) {
        const p = path[i];
        minLat = Math.min(minLat, p.latitude);
        maxLat = Math.max(maxLat, p.latitude);
        minLng = Math.min(minLng, p.longitude);
        maxLng = Math.max(maxLng, p.longitude);
    }
    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    const latSpan = Math.max(maxLat - minLat, 0.0001);
    const lngSpan = Math.max(maxLng - minLng, 0.0001);
    return {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: Math.min(latSpan * 1.6, 2),
        longitudeDelta: Math.min(lngSpan * 1.6, 2),
    };
}

function TripRoutePreview({ path, strokeColor, isDark }) {
    const region = useMemo(() => regionForPath(path), [path]);
    const hasRoute = path && path.length > 1;

    if (!region) {
        return (
            <View style={[styles.mapPlaceholder, { backgroundColor: isDark ? '#1a2235' : '#E8E8E8' }]}>
                <MaterialCommunityIcons name="map-marker-off-outline" size={32} color="#999" />
                <Text style={styles.mapPlaceholderText}>No GPS track</Text>
            </View>
        );
    }

    return (
        <View style={styles.mapPreviewWrap}>
            <MapView
                style={styles.mapPreview}
                provider={PROVIDER_GOOGLE}
                initialRegion={region}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                pointerEvents="none"
                customMapStyle={isDark ? darkMapStyle : []}
            >
                {hasRoute ? (
                    <Polyline
                        coordinates={path}
                        strokeWidth={4}
                        strokeColor={strokeColor}
                        lineCap="round"
                        lineJoin="round"
                    />
                ) : (
                    <Marker coordinate={{ latitude: path[0].latitude, longitude: path[0].longitude }} />
                )}
            </MapView>
        </View>
    );
}

const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
];

export default function TripsHistory() {
    const isDark = useSelector((state) => state.theme.isDark);
    const theme = isDark ? colors.dark : colors.light;
    const navigation = useNavigation();

    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadTrips();
        });
        return unsubscribe;
    }, [navigation]);

    const loadTrips = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('userToken');
            let fromServer = [];

            if (token) {
                const res = await fetch(`${API_URL}/trips?limit=100`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const json = await res.json();
                    fromServer = (json.data || []).map(normalizeTrip);
                }
            }

            const stored = await AsyncStorage.getItem('tripsList');
            const local = stored ? JSON.parse(stored) : [];
            const serverIds = new Set(fromServer.map((x) => x.id));
            const pendingLocal = local.filter((t) => t.id && !serverIds.has(t.id));

            const byStart = (a, b) =>
                new Date(b.startTime || b.createdAt || 0) - new Date(a.startTime || a.createdAt || 0);

            const merged = [...fromServer, ...pendingLocal].sort(byStart);
            setTrips(merged);
            if (merged.length > 0) {
                await AsyncStorage.setItem('tripsList', JSON.stringify(merged));
            }
        } catch (e) {
            console.error('Failed to load trips', e);
            try {
                const stored = await AsyncStorage.getItem('tripsList');
                if (stored) setTrips(JSON.parse(stored));
            } catch (_) { }
        } finally {
            setLoading(false);
        }
    };

    const exportTripCSV = async (trip) => {
        if (!trip.observations || trip.observations.length === 0) {
            Alert.alert("No Data", "This past trip has no observations attached to it.");
            return;
        }

        try {
            const headers = observationCsvHeaderLine();
            const rows = trip.observations.map((item) =>
                rowFromTripObservation(trip, item, { contributor: trip.contributor, org: trip.org })
            );

            const csvContent = `${headers}\n${rows.join('\n')}`;
            const safeName = trip.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileUri = FileSystem.documentDirectory + `EcoTrace_${safeName}.csv`;

            await FileSystem.writeAsStringAsync(fileUri, csvContent);
            await Sharing.shareAsync(fileUri);
        } catch (error) {
            console.error("Export error:", error);
            Alert.alert("Error", "Failed to export CSV.");
        }
    };

    const deleteTrip = (id) => {
        Alert.alert(
            "Delete Trip",
            "Are you sure you want to delete this trip record?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        const token = await SecureStore.getItemAsync('userToken');
                        if (token && isMongoId(id)) {
                            try {
                                const res = await fetch(`${API_URL}/trips/${id}`, {
                                    method: 'DELETE',
                                    headers: { Authorization: `Bearer ${token}` },
                                });
                                if (!res.ok) {
                                    console.warn('Delete trip API:', await res.text());
                                }
                            } catch (err) {
                                console.warn(err);
                            }
                        }
                        const newTrips = trips.filter((t) => t.id !== id);
                        setTrips(newTrips);
                        await AsyncStorage.setItem('tripsList', JSON.stringify(newTrips));
                    }
                }
            ]
        );
    };

    const renderTrip = ({ item }) => {
        const path = item.path || [];
        const pointCount = path.length;

        return (
            <View style={[styles.tripCard, { backgroundColor: theme.surface }]}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('TripDetails', { trip: item })}
                >
                    <TripRoutePreview path={path} strokeColor={theme.primary} isDark={isDark} />

                    <View style={styles.tripBody}>
                        <Text style={[styles.tripName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.tripDate, { color: theme.textSecondary }]} numberOfLines={2}>
                            {new Date(item.startTime).toLocaleDateString()} • {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {item.contributor ? ` • ${item.contributor}` : ''}
                        </Text>
                        <View style={styles.statsRow}>
                            <View style={[styles.statPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                                <MaterialCommunityIcons name="map-marker-path" size={14} color={theme.textLight} />
                                <Text style={[styles.statText, { color: theme.textSecondary }]}>
                                    {pointCount} {pointCount === 1 ? 'point' : 'points'}
                                </Text>
                            </View>
                            <View style={[styles.statPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                                <MaterialCommunityIcons name="run" size={14} color={theme.textLight} />
                                <Text style={[styles.statText, { color: theme.textSecondary }]}>{(item.distance / 1000).toFixed(2)} km</Text>
                            </View>
                            <View style={[styles.statPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                                <MaterialCommunityIcons name="leaf" size={14} color={theme.textLight} />
                                <Text style={[styles.statText, { color: theme.textSecondary }]}>{item.observations?.length || 0} finds</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={[styles.cardActions, { borderTopColor: theme.border }]}>
                    <TouchableOpacity onPress={() => exportTripCSV(item)} style={styles.cardActionBtn}>
                        <MaterialCommunityIcons name="file-download-outline" size={22} color={theme.primary} />
                        <Text style={[styles.cardActionLabel, { color: theme.primary }]}>Export</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteTrip(item.id)} style={styles.cardActionBtn}>
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
                        <Text style={[styles.cardActionLabel, { color: colors.error }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
           <View style={styles.header}>

    <TouchableOpacity
        style={[styles.backButton, { backgroundColor: theme.surface }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
    >
        <Ionicons name="arrow-back" size={26} color={theme.text} />
    </TouchableOpacity>

    <Text style={[styles.headerTitle, { color: theme.text }]}>
        My Trips
    </Text>

    <TouchableOpacity
        style={[styles.backButton, { backgroundColor: theme.surface }]}
        onPress={() => navigation.navigate('Main', { screen: 'Home' })}
        activeOpacity={0.7}
    >
        <Ionicons name="home" size={24} color="#ff4d8d" />
    </TouchableOpacity>

</View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : trips.length === 0 ? (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="map-marker-off" size={60} color={theme.textLight} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No saved trips found.</Text>
                    <TouchableOpacity
                        style={[styles.startBtn, { backgroundColor: theme.primary }]}
                        onPress={() => navigation.navigate('TrackMap')}
                    >
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>START NEW TRIP</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={trips}
                    renderItem={renderTrip}
                    keyExtractor={(item) => item.id || String(item._id)}
                    contentContainerStyle={styles.list}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
},

backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
},
    list: { padding: 20, paddingBottom: 40 },
    tripCard: {
        borderRadius: 16,
        marginBottom: 18,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
    },
    mapPreviewWrap: {
        width: '100%',
        height: 140,
        backgroundColor: '#E8E8E8',
    },
    mapPreview: { width: '100%', height: '100%' },
    mapPlaceholder: {
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapPlaceholderText: { marginTop: 6, fontSize: 12, color: '#888' },
    tripBody: { padding: 14 },
    tripName: { fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
    tripDate: { fontSize: 13, marginBottom: 10 },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statText: { fontSize: 11, marginLeft: 4, fontWeight: '600' },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        gap: 16,
    },
    cardActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
        gap: 6,
    },
    cardActionLabel: { fontSize: 13, fontWeight: '600' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { marginTop: 10, fontSize: 16, textAlign: 'center' },
    startBtn: {
        marginTop: 20,
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 10,
    }
});
