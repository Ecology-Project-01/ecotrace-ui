import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../colors/colors';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function TripDetails({ route, navigation }) {
    const { trip } = route.params;
    const isDark = useSelector(state => state.theme.isDark);
    const theme = isDark ? colors.dark : colors.light;
    const mapRef = useRef(null);

    useEffect(() => {
        if (mapRef.current && trip.path.length > 0) {
            setTimeout(() => {
                mapRef.current.fitToCoordinates(trip.path, {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    animated: true,
                });
            }, 500);
        }
    }, []);

    const exportTripCSV = async () => {
        if (!trip.observations || trip.observations.length === 0) {
            Alert.alert("No Data", "There are no observations in this trip to export.");
            return;
        }

        try {
            const headers = ['Common Name', 'Scientific Name', 'Category', 'Qty', 'Lat', 'Lng', 'Area', 'Time', 'Notes'].join(',');
            const rows = trip.observations.map(item => {
                return [
                    `"${item.commonName}"`,
                    `"${item.scientificName}"`,
                    `"${item.category}"`,
                    item.count,
                    item.latitude,
                    item.longitude,
                    `"${item.areaName}"`,
                    `"${new Date(item.observedAt).toLocaleString()}"`,
                    `"${(item.notes || '').replace(/"/g, '""')}"`
                ].join(',');
            });

            const csvContent = `${headers}\n${rows.join('\n')}`;
            const safeName = trip.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileUri = FileSystem.documentDirectory + `EcoTrace_${safeName}.csv`;

            await FileSystem.writeAsStringAsync(fileUri, csvContent);
            await Sharing.shareAsync(fileUri);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to export data.");
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{trip.name}</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        {new Date(trip.startTime).toLocaleDateString()} • {(trip.distance / 1000).toFixed(2)} km
                    </Text>
                </View>
                <TouchableOpacity onPress={exportTripCSV} style={[styles.exportBtn, { backgroundColor: theme.primary }]}>
                    <MaterialCommunityIcons name="file-download" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={trip.path.length > 0 ? {
                        latitude: trip.path[0].latitude,
                        longitude: trip.path[0].longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    } : null}
                >
                    <Polyline
                        coordinates={trip.path}
                        strokeWidth={4}
                        strokeColor={theme.primary}
                    />
                </MapView>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>OBSERVATIONS ({trip.observations?.length || 0})</Text>

                {trip.observations?.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.textLight }]}>No observations recorded during this trip.</Text>
                ) : (
                    trip.observations.map((item, idx) => (
                        <View key={idx} style={[styles.obsCard, { backgroundColor: theme.surface }]}>
                            <View style={styles.obsHeader}>
                                <Text style={[styles.commonName, { color: theme.text }]}>{item.commonName}</Text>
                                <Text style={[styles.qty, { color: theme.primary }]}>{item.count}x</Text>
                            </View>
                            <Text style={[styles.scientificName, { color: theme.textSecondary }]}>{item.scientificName}</Text>
                            <View style={[styles.tag, { backgroundColor: theme.border }]}>
                                <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: 'bold' }}>{item.category.toUpperCase()}</Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    title: { fontSize: 20, fontWeight: 'bold' },
    subtitle: { fontSize: 13 },
    backBtn: { padding: 5 },
    exportBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    mapContainer: {
        height: 300,
        marginHorizontal: 20,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    map: { flex: 1 },
    content: { padding: 20 },
    sectionLabel: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15 },
    obsCard: {
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 2,
    },
    obsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    commonName: { fontSize: 16, fontWeight: 'bold' },
    scientificName: { fontSize: 13, fontStyle: 'italic', marginTop: 2 },
    qty: { fontWeight: 'bold' },
    tag: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 5,
        marginTop: 8,
    },
    emptyText: { textAlign: 'center', marginTop: 20, fontStyle: 'italic' }
});
