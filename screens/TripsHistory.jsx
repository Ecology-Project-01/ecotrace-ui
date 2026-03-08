import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import colors from '../colors/colors';

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
            const stored = await AsyncStorage.getItem('tripsList');
            if (stored) {
                setTrips(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load trips", e);
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
            const headers = ['Common Name', 'Scientific Name', 'Category', 'Qty', 'Lat', 'Lng', 'Area', 'Time', 'Notes'].join(',');
            const rows = trip.observations.map(item => {
                const time = item.observedAt ? new Date(item.observedAt).toLocaleString() : 'N/A';
                return [
                    `"${item.commonName || ''}"`,
                    `"${item.scientificName || ''}"`,
                    `"${item.category || ''}"`,
                    item.count || 1,
                    item.latitude || '',
                    item.longitude || '',
                    `"${item.areaName || ''}"`,
                    `"${time}"`,
                    `"${(item.notes || '').replace(/"/g, '""')}"`
                ].join(',');
            });

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
                        const newTrips = trips.filter(t => t.id !== id);
                        setTrips(newTrips);
                        await AsyncStorage.setItem('tripsList', JSON.stringify(newTrips));
                    }
                }
            ]
        );
    };

    const renderTrip = ({ item }) => (
        <TouchableOpacity
            style={[styles.tripCard, { backgroundColor: theme.surface }]}
            onPress={() => navigation.navigate('TripDetails', { trip: item })}
        >
            <View style={[styles.iconBox, { backgroundColor: theme.primary + '20' }]}>
                <MaterialCommunityIcons name="map-marker-path" size={24} color={theme.primary} />
            </View>

            <View style={styles.tripInfo}>
                <Text style={[styles.tripName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.tripDate, { color: theme.textSecondary }]}>
                    {new Date(item.startTime).toLocaleDateString()} • {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <View style={styles.statsRow}>
                    <View style={styles.statPill}>
                        <MaterialCommunityIcons name="run" size={14} color={theme.textLight} />
                        <Text style={[styles.statText, { color: theme.textSecondary }]}>{(item.distance / 1000).toFixed(2)} km</Text>
                    </View>
                    <View style={styles.statPill}>
                        <MaterialCommunityIcons name="leaf" size={14} color={theme.textLight} />
                        <Text style={[styles.statText, { color: theme.textSecondary }]}>{item.observations?.length || 0} finds</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity onPress={() => exportTripCSV(item)} style={styles.exportCardBtn}>
                <MaterialCommunityIcons name="file-download-outline" size={22} color={theme.primary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => deleteTrip(item.id)} style={styles.deleteBtn}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>My Trips</Text>
                <View style={{ width: 40 }} />
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
                    keyExtractor={item => item.id}
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
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    backBtn: { padding: 5 },
    list: { padding: 20 },
    tripCard: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    tripInfo: { flex: 1 },
    tripName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
    tripDate: { fontSize: 13, marginBottom: 8 },
    statsRow: { flexDirection: 'row', gap: 10 },
    statPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statText: { fontSize: 11, marginLeft: 4, fontWeight: '600' },
    exportCardBtn: { padding: 10, marginRight: 5 },
    deleteBtn: { padding: 10 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { marginTop: 10, fontSize: 16, textAlign: 'center' },
    startBtn: {
        marginTop: 20,
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 10,
    }
});
